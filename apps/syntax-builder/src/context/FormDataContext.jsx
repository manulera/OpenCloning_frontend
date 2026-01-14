import React from 'react';

/* eslint-disable camelcase */
const defaultPartData = {
  header: 'Header',
  body: 'helper text / body text',
  glyph: 'cds-stop',
  left_overhang: 'CATG',
  right_overhang: 'TATG',
  left_inside: 'AAAATA',
  right_inside: 'AATG',
  left_codon_start: 2,
  right_codon_start: 1,
  color: 'greenyellow',
};
/* eslint-enable camelcase */

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

export const validatePart = (part) => ({

  /* eslint-disable camelcase */
  color: validateColor(part.color),
  left_overhang: validateOverhang(part.left_overhang),
  right_overhang: validateOverhang(part.right_overhang),
  left_inside: validateInside(part.left_inside),
  right_inside: validateInside(part.right_inside),
  left_codon_start: validateCodonStart(part.left_codon_start),
  right_codon_start: validateCodonStart(part.right_codon_start),
  /* eslint-enable camelcase */
})

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

// Validate overhang paths structure and ordering
export const validateOverhangPaths = (paths) => {
  if (!paths || paths.length === 0) {
    return { isValid: true, error: '' }
  }

  // Validate all overhangs are valid
  for (const path of paths) {
    if (!Array.isArray(path) || path.length < 2) {
      return { isValid: false, error: 'Each path must contain at least 2 overhangs' }
    }
    for (const overhang of path) {
      const error = validateOverhang(overhang)
      if (error) {
        return { isValid: false, error: `Invalid overhang "${overhang}": ${error}` }
      }
    }
  }

  // Build ordering from first path
  const nodeOrder = [...paths[0]]
  const nodePositions = new Map()
  paths[0].forEach((node, index) => {
    nodePositions.set(node, index)
  })

  // Validate subsequent paths respect ordering
  for (let pathIndex = 1; pathIndex < paths.length; pathIndex++) {
    const path = paths[pathIndex]
    
    // First node must exist in previous paths
    const firstNode = path[0]
    if (!nodePositions.has(firstNode)) {
      return { 
        isValid: false, 
        error: `Path ${pathIndex + 1} starts with "${firstNode}" which doesn't exist in previous paths` 
      }
    }

    let lastPosition = nodePositions.get(firstNode)

    // Process remaining nodes in path
    for (let i = 1; i < path.length; i++) {
      const node = path[i]
      
      if (nodePositions.has(node)) {
        // Node exists - check ordering
        const nodePosition = nodePositions.get(node)
        if (nodePosition < lastPosition) {
          return { 
            isValid: false, 
            error: `Path ${pathIndex + 1} violates ordering: "${node}" appears before "${path[i - 1]}"` 
          }
        }
        lastPosition = nodePosition
      } else {
        // New node - add to ordering after last position
        const insertPosition = lastPosition + 1
        nodeOrder.splice(insertPosition, 0, node)
        // Update all positions after insertion
        nodePositions.clear()
        nodeOrder.forEach((n, idx) => {
          nodePositions.set(n, idx)
        })
        lastPosition = insertPosition
      }
    }
  }

  return { isValid: true, error: '', nodeOrder }
}

const FormDataContext = React.createContext();

export function FormDataProvider({ children }) {
  const [formData, setFormData] = React.useState({
    submission: {
      name: '',
      orcid: '',
      doi: '',
    },
    overhangs: {
      paths: [
        ["CCCT", "AACG", "TATG", "ATCC", "GCTG", "TACA", "GAGT", "CCGA", "CGCT", "CCCT"],
        ["TATG","TTCT","ATCC"],
        ["TATG","AAAA","CCCC","ATCC"],
        ["ATCC","TGGC","GCTG","CCGA","CAAT","CCCT"],
      ], // Array of paths, where each path is an array of overhang strings
    },
    design: {
      parts: [{ ...defaultPartData }],
    },
  });

  const updateSubmission = (data) => {
    setFormData((prev) => ({
      ...prev,
      submission: { ...prev.submission, ...data },
    }));
  };

  const updateOverhangs = (paths) => {
    setFormData((prev) => ({
      ...prev,
      overhangs: { ...prev.overhangs, paths },
    }));
  };

  const updateDesignParts = (parts) => {
    setFormData((prev) => ({
      ...prev,
      design: { ...prev.design, parts },
    }));
  };

  const resetFormData = () => {
    setFormData({
      submission: {
        name: '',
        orcid: '',
        doi: '',
      },
      overhangs: {
        paths: [],
      },
      design: {
        parts: [{ ...defaultPartData }],
      },
    });
  };

  const value = {
    formData,
    updateSubmission,
    updateOverhangs,
    updateDesignParts,
    resetFormData,
  };

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
