import React from 'react'
import { TextField, FormControl, Select, MenuItem, Box, Paper, Typography, Table, TableContainer, TableHead, TableBody, TableRow, TableCell, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { ContentCopy as ContentCopyIcon, AddCircle as AddCircleIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { AssemblerPart, getSvgByGlyph } from '@opencloning/ui/components/assembler'
import { useFormData, validatePart, validateField } from '../context/FormDataContext'

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

function AssemblePartWidget() {
  const { formData, updateDesignParts } = useFormData()
  const parts = formData.design.parts
  const [bodyDialogOpen, setBodyDialogOpen] = React.useState(false)
  const [editingRowIndex, setEditingRowIndex] = React.useState(null)
  const [tempBodyValue, setTempBodyValue] = React.useState('')

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
    
    const newParts = [...parts]
    newParts[rowIndex] = {
      ...newParts[rowIndex],
      [field]: value,
    }
    updateDesignParts(newParts)
  }

  const handleAddRow = () => {
    updateDesignParts([...parts, { ...defaultData }])
  }

  const handleRemoveRow = (index) => {
    updateDesignParts(parts.filter((_, i) => i !== index))
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

  const handleOpenBodyDialog = (rowIndex) => {
    setEditingRowIndex(rowIndex)
    setTempBodyValue(parts[rowIndex].body || '')
    setBodyDialogOpen(true)
  }

  const handleCloseBodyDialog = () => {
    setBodyDialogOpen(false)
    setEditingRowIndex(null)
    setTempBodyValue('')
  }

  const handleSaveBodyDialog = () => {
    if (editingRowIndex !== null) {
      const newParts = [...parts]
      newParts[editingRowIndex] = {
        ...newParts[editingRowIndex],
        body: tempBodyValue,
      }
      updateDesignParts(newParts)
    }
    handleCloseBodyDialog()
  }

  const renderEditableCell = (rowIndex, field, value) => {
    const config = fieldConfig[field]
    const errorMessage = validateField(field, value)
    const hasError = errorMessage !== ''
    
    if (config.type === 'select') {
      // Special handling for glyph field - show images
      if (field === 'glyph') {
        return (
          <FormControl size="small" sx={{ width: '100px' }}>
            <Select
              value={value}
              onChange={handleChange(rowIndex, field)}
              sx={{ fontSize: '0.875rem' }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <img 
                    src={getSvgByGlyph(selected)} 
                    alt={selected}
                    style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                  />
                  <span>{selected}</span>
                </Box>
              )}
            >
              {config.options.map((option) => (
                <MenuItem key={option} value={option}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img 
                      src={getSvgByGlyph(option)} 
                      alt={option}
                      style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                    />
                    <span>{option}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )
      }
      
      // Default select for other fields
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
          inputProps={{ min: 0, style: { fontSize: '0.875rem' } }}
          sx={{ '& .MuiInputBase-root': { height: '32px' } }}
          helperText={errorMessage}
        />
      )
    }
    
    // Special handling for body field - open dialog on click
    if (field === 'body') {
      const displayValue = value || ''
      const truncatedValue = displayValue.length > 50 
        ? `${displayValue.substring(0, 50)}...` 
        : displayValue
      
      return (
        <TextField
          size="small"
          value={truncatedValue}
          onClick={() => handleOpenBodyDialog(rowIndex)}
          readOnly
          inputProps={{ 
            style: { 
              fontSize: '0.875rem',
              cursor: 'pointer'
            } 
          }}
          sx={{ 
            '& .MuiInputBase-root': { 
              height: '32px',
              cursor: 'pointer'
            },
            '& .MuiInputBase-input': {
              cursor: 'pointer'
            }
          }}
          placeholder="Click to edit..."
        />
      )
    }
    
    // Text fields (overhangs, insides, and color)
    return (
      <TextField
        size="small"
        value={value}
        onChange={handleChange(rowIndex, field)}
        error={hasError}
        inputProps={{ style: { fontSize: '0.875rem' } }}
        sx={{ '& .MuiInputBase-root': { height: '32px' } }}
        helperText={errorMessage}
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
                const partError = validatePart(part)
                const isValid = partError === ''
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

      {/* Body Edit Dialog */}
      <Dialog 
        open={bodyDialogOpen} 
        onClose={handleCloseBodyDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Body Text</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={6}
            fullWidth
            value={tempBodyValue}
            onChange={(e) => setTempBodyValue(e.target.value)}
            placeholder="Enter body text..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBodyDialog}>Cancel</Button>
          <Button onClick={handleSaveBodyDialog} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AssemblePartWidget
