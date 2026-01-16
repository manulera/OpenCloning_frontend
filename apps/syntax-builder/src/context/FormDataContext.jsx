import React from 'react';
import { graphHasCycle, graphToMSA, partsToGraph } from '../graph_utils';

// Validation functions - return '' if valid, error message if invalid
const validateColor = (color) => {
  // Color can be empty
  if (!color || color.trim() === '') return ''
  // Create a temporary element to test CSS color validity
  if (typeof document !== 'undefined') {
    const s = document.createElement('div').style
    s.color = color
    if (s.color === '') return 'Invalid color'
  } else {
    // Fallback: basic validation if document is not available
    if (!/^#[0-9A-Fa-f]{3,6}$|^[a-zA-Z]+$|^rgb\(|^rgba\(|^hsl\(|^hsla\(/.test(color)) {
      return 'Invalid color'
    }
  }
  return ''
}

export const validateOverhang = (overhang, otherOverhang=null) => {
  if (!overhang) return 'Overhang is required'
  if (!/^[ACGTacgt]+$/.test(overhang)) return 'Only ACGT allowed'
  if (overhang.length !== 4) return 'Must be exactly 4 bases'
  if (otherOverhang && overhang === otherOverhang) return 'Overhangs must be different'
  return ''
}

const validateInside = (inside) => {
  // Inside sequence can be empty
  if (!inside) return ''
  if (!/^[ACGTNacgtn]+$/.test(inside)) return 'Only ACGTN allowed'
  return ''
}

const validateCodonStart = (value) => {
  // Codon start can be zero, but not negative
  if (value === '' || value === null || value === '') return ''
  const num = typeof value === 'number' ? value : parseInt(value, 10)
  if (isNaN(num) || num < 0) return 'Must be >= 0'
  return ''
}

export const validateField = (field, value, row=null) => {
  if (field === 'color') {
    return validateColor(value)
  } else if (field === 'left_overhang' || field === 'right_overhang') {
    const otherOverhang = field === 'left_overhang' ? 'right_overhang' : 'left_overhang'
    return validateOverhang(value, row ? row[otherOverhang] : null)
  } else if (field === 'left_inside' || field === 'right_inside') {
    return validateInside(value)
  } else if (field === 'left_codon_start' || field === 'right_codon_start') {
    return validateCodonStart(value)
  }
  return undefined // No validation for other fields
}

export const validatePart = (part) => {
  return !Object.keys(part).some(key => Boolean(validateField(key, part[key])));
}

function validateGraph(graph) {
  if (!graph) return { error: 'Invalid paths entered', nodes: [] }
  // All parts must be have in and out links
  const nodesWithMissingLinks = graph.nodes().filter(node => graph.inDegree(node) === 0 || graph.outDegree(node) === 0);
  if (nodesWithMissingLinks.length > 0) {
    return { error: `Parts with missing links: ${nodesWithMissingLinks.join(', ')}`, nodes: nodesWithMissingLinks }
  }
  // The graph should form a cycle
  if (!graphHasCycle(graph)) {
    return { error: 'The graph does not form a cycle. Please check the overhangs.', nodes: [] }
  }
  return { error: '', nodes: [] }
}

const FormDataContext = React.createContext();

function isSamePart(part1, part2) {
  return part1.left_overhang === part2.left_overhang &&
    part1.right_overhang === part2.right_overhang
}

export function FormDataProvider({ children }) {

  const [submission, setSubmission] = React.useState({
    name: '',
    orcid: '',
    doi: '',
  });
  const [parts, setParts] = React.useState([]);
  const [graph, setGraph] = React.useState(null);
  const [graphErrorMessage, setGraphErrorMessage] = React.useState('');
  const [problematicNodes, setProblematicNodes] = React.useState([]);

  React.useEffect(() => {
    setGraphErrorMessage('');
    setProblematicNodes([]);
    if (parts.length > 0) {
      try {
        const validParts = parts.filter(validatePart);
        const thisGraph = partsToGraph(validParts);
        const { error, nodes: problemNodes } = validateGraph(thisGraph);
        setGraphErrorMessage(error);
        setProblematicNodes(problemNodes);
        // This is just to test if it gives errors
        graphToMSA(thisGraph);
        setGraph(thisGraph);
      } catch (error) {
        if (error.message.includes('given graph is not acyclic')) {
          setGraphErrorMessage('Multiple independent cycles detected in the graph, or cycle that does not include all parts. Please check the overhangs.');
        }
        else {
          setGraphErrorMessage(error.message);
        }
        setGraph(null);
      }
    } else {
      setGraph(null);
    }
  }, [parts]);

  const updateSubmission = React.useCallback((data) => {
    setSubmission((prev) => ({ ...prev, ...data }));
  }, [setSubmission]);

  const resetFormData = React.useCallback(() => {
    setSubmission({
      name: '',
      orcid: '',
      doi: '',
    });
    setParts([]);
  }, [setSubmission, setParts]);


  const value = React.useMemo(() => ({
    submission,
    parts,
    updateSubmission,
    setParts,
    resetFormData,
    graph,
    graphErrorMessage,
    problematicNodes,
  }), [submission, parts, updateSubmission, setParts, resetFormData, graph, graphErrorMessage, problematicNodes]);

  return (
    <FormDataContext.Provider value={value}>
      {children}
    </FormDataContext.Provider>
  );
}

export function useFormData() {
  const context = React.useContext(FormDataContext);
  if (!context) {
    throw new Error('useFormData must be used within a FormDataProvider');
  }
  return context;
}
