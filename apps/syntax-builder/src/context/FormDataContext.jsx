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

const validateOverhang = (overhang) => {
  if (!overhang) return 'Overhang is required'
  if (!/^[ACGTacgt]+$/.test(overhang)) return 'Only ACGT allowed'
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

const FormDataContext = React.createContext();

export function FormDataProvider({ children }) {
  const [formData, setFormData] = React.useState({
    submission: {
      name: '',
      orcid: '',
      doi: '',
    },
    overhangs: {},
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

  const updateOverhangs = (data) => {
    setFormData((prev) => ({
      ...prev,
      overhangs: { ...prev.overhangs, ...data },
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
      overhangs: {},
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
