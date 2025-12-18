import React from 'react'
import { TextField, FormControl, Select, MenuItem, Box, Paper, Typography, Table, TableContainer, TableHead, TableBody, TableRow, TableCell, Button, IconButton } from '@mui/material'
import { ContentCopy as ContentCopyIcon, AddCircle as AddCircleIcon, Delete as DeleteIcon } from '@mui/icons-material'
import AssemblerPart from './AssemblerPart'

/* eslint-disable camelcase */
const defaultData = {
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
}
/* eslint-enable camelcase */

const glyphOptions = [
  'assembly-scar',
  'cds',
  'cds-stop',
  'chromosomal-locus',
  'engineered-region',
  'five-prime-sticky-restriction-site',
  'origin-of-replication',
  'primer-binding-site',
  'promoter',
  'ribosome-entry-site',
  'specific-recombination-site',
  'terminator',
  'three-prime-sticky-restriction-site',
]

/* eslint-disable camelcase */
const fieldConfig = {
  header: { type: 'text', label: 'Header' },
  body: { type: 'text', label: 'Body' },
  glyph: { type: 'select', label: 'Glyph', options: glyphOptions },
  left_overhang: { type: 'text', label: 'Left Overhang' },
  right_overhang: { type: 'text', label: 'Right Overhang' },
  left_inside: { type: 'text', label: 'Left Inside' },
  right_inside: { type: 'text', label: 'Right Inside' },
  left_codon_start: { type: 'number', label: 'Left Codon Start' },
  right_codon_start: { type: 'number', label: 'Right Codon Start' },
  color: { type: 'text', label: 'Color' },
}
/* eslint-enable camelcase */

// Validation functions
const isValidColor = (color) => {
  if (!color || color.trim() === '') return false
  // Create a temporary element to test CSS color validity
  if (typeof document !== 'undefined') {
    const s = document.createElement('div').style
    s.color = color
    return s.color !== ''
  }
  // Fallback: basic validation if document is not available
  return /^#[0-9A-Fa-f]{3,6}$|^[a-zA-Z]+$|^rgb\(|^rgba\(|^hsl\(|^hsla\(/.test(color)
}

const isValidOverhang = (overhang) => {
  if (!overhang) return false
  return /^[ACGTacgt]+$/.test(overhang)
}

const isValidInside = (inside) => {
  if (!inside) return false
  return /^[ACGTNacgtn]+$/.test(inside)
}

const isValidCodonStart = (value) => {
  if (value === '' || value === null || value === undefined) return false
  const num = typeof value === 'number' ? value : parseInt(value, 10)
  return !isNaN(num) && num > 0
}

const validatePart = (part) => {
  return (
    isValidColor(part.color) &&
    isValidOverhang(part.left_overhang) &&
    isValidOverhang(part.right_overhang) &&
    isValidInside(part.left_inside) &&
    isValidInside(part.right_inside) &&
    isValidCodonStart(part.left_codon_start) &&
    isValidCodonStart(part.right_codon_start)
  )
}

function AssemblePartWidget() {
  const [parts, setParts] = React.useState([{ ...defaultData }])

  const handleChange = (rowIndex, field) => (event) => {
    let value = event.target.value
    
    // Convert overhangs to uppercase immediately and only allow ACGT
    if (field === 'left_overhang' || field === 'right_overhang') {
      value = value.toUpperCase()
      value = value.replace(/[^ACGT]/g, '')
    }
    
    // Convert insides to uppercase immediately and allow ACGTN
    if (field === 'left_inside' || field === 'right_inside') {
      value = value.toUpperCase()
      value = value.replace(/[^ACGTN]/g, '')
    }
    
    // Handle number fields
    if (field === 'left_codon_start' || field === 'right_codon_start') {
      value = value === '' ? '' : parseInt(value, 10) || 0
    }
    
    setParts((prev) => {
      const newParts = [...prev]
      newParts[rowIndex] = {
        ...newParts[rowIndex],
        [field]: value,
      }
      return newParts
    })
  }

  const handleAddRow = () => {
    setParts((prev) => [...prev, { ...defaultData }])
  }

  const handleRemoveRow = (index) => {
    setParts((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCopyRow = async (rowIndex) => {
    const part = parts[rowIndex]
    const keys = Object.keys(part)
    const headers = keys.join('\t')
    const values = keys.map((key) => String(part[key])).join('\t')
    const tsvData = `${headers}\n${values}`
    
    try {
      if (window.navigator && window.navigator.clipboard) {
        await window.navigator.clipboard.writeText(tsvData)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const renderEditableCell = (rowIndex, field, value) => {
    const config = fieldConfig[field]
    let hasError = false
    
    // Determine if field has validation error
    if (field === 'color') {
      hasError = !isValidColor(value)
    } else if (field === 'left_overhang' || field === 'right_overhang') {
      hasError = !isValidOverhang(value)
    } else if (field === 'left_inside' || field === 'right_inside') {
      hasError = !isValidInside(value)
    } else if (field === 'left_codon_start' || field === 'right_codon_start') {
      hasError = !isValidCodonStart(value)
    }
    
    if (config.type === 'select') {
      return (
        <FormControl size="small" fullWidth>
          <Select
            value={value}
            onChange={handleChange(rowIndex, field)}
            sx={{ fontSize: '0.875rem' }}
          >
            {config.options.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )
    }
    
    if (config.type === 'number') {
      return (
        <TextField
          size="small"
          type="number"
          value={value}
          onChange={handleChange(rowIndex, field)}
          error={hasError}
          inputProps={{ min: 1, style: { fontSize: '0.875rem' } }}
          sx={{ '& .MuiInputBase-root': { height: '32px' } }}
          helperText={hasError ? 'Must be > 0' : ''}
        />
      )
    }
    
    // Text fields (overhangs, insides, and color)
    let helperText = ''
    if (field === 'left_overhang' || field === 'right_overhang') {
      if (hasError && value) {
        helperText = 'Only ACGT allowed'
      }
    } else if (field === 'left_inside' || field === 'right_inside') {
      if (hasError && value) {
        helperText = 'Only ACGTN allowed'
      }
    } else if (field === 'color') {
      if (hasError) {
        helperText = 'Invalid color'
      }
    }
    
    return (
      <TextField
        size="small"
        value={value}
        onChange={handleChange(rowIndex, field)}
        error={hasError}
        inputProps={{ style: { fontSize: '0.875rem' } }}
        sx={{ '& .MuiInputBase-root': { height: '32px' } }}
        helperText={helperText}
      />
    )
  }

  return (
    <Box sx={{ 
      p: 1.5, 
      maxHeight: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      {/* Preview Section */}
      {parts.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 1.5 }}>
              Preview
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'row', 
              gap: 2,
              alignItems: 'flex-start',
              overflowX: 'auto',
              pb: 1
            }}>
              {parts.map((part, index) => {
                const isValid = validatePart(part)
                return (
                  <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 'fit-content' }}>
                    {(part.header || part.body) && (
                      <Box sx={{ 
                        textAlign: 'center', 
                        mb: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5
                      }}>
                        {part.header && (
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {part.header}
                          </Typography>
                        )}
                        {part.body && (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {part.body}
                          </Typography>
                        )}
                      </Box>
                    )}
                    {isValid ? (
                      <AssemblerPart data={part} />
                    ) : (
                      <Box sx={{ 
                        p: 2, 
                        border: '2px dashed', 
                        borderColor: 'error.main',
                        borderRadius: 1,
                        color: 'error.main',
                        fontWeight: 'bold'
                      }}>
                        Invalid
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Editable Table Section */}
      <Paper sx={{ p: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6">
            Parts Configuration
          </Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={handleAddRow}
          >
            Add Row
          </Button>
        </Box>
        <TableContainer>
          <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.5, px: 1 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', width: '50px' }}>Actions</TableCell>
                {Object.keys(fieldConfig).map((key) => (
                  <TableCell key={key} sx={{ fontWeight: 'bold' }}>
                    {fieldConfig[key].label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {parts.map((part, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveRow(rowIndex)}
                        disabled={parts.length === 1}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyRow(rowIndex)}
                        color="primary"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  {Object.keys(fieldConfig).map((field) => (
                    <TableCell key={field}>
                      {renderEditableCell(rowIndex, field, part[field])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

export default AssemblePartWidget
