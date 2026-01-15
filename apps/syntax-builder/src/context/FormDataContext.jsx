import React from 'react';
import { partsToGraph } from '../graph_utils';

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

export const validateOverhang = (overhang) => {
  if (!overhang) return 'Overhang is required'
  if (!/^[ACGTacgt]+$/.test(overhang)) return 'Only ACGT allowed'
  if (overhang.length !== 4) return 'Must be exactly 4 bases'
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

export const validateField = (field, value) => {
  if (field === 'color') {
    return validateColor(value)
  } else if (field === 'left_overhang' || field === 'right_overhang') {
    return validateOverhang(value)
  } else if (field === 'left_inside' || field === 'right_inside') {
    return validateInside(value)
  } else if (field === 'left_codon_start' || field === 'right_codon_start') {
    return validateCodonStart(value)
  }
  return undefined // No validation for other fields
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

  React.useEffect(() => {
    if (parts.length > 0) {
      setGraph(partsToGraph(parts));
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
  }), [submission, parts, updateSubmission, setParts, resetFormData, graph]);

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
