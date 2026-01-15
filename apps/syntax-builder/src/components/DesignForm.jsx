import React, { useCallback } from 'react'
import isEqual from 'lodash/isEqual'
import { TextField, FormControl, Select, MenuItem, Box, Paper, Typography, Table, TableContainer, TableHead, TableBody, TableRow, TableCell, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { AddCircle as AddCircleIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { getSvgByGlyph } from '@opencloning/ui/components/assembler'
import { useFormData, validateField } from '../context/FormDataContext'
import OverhangsPreview from './OverhangsPreview'

/* eslint-disable camelcase */
const defaultData = {
  left_overhang: '',
  right_overhang: '',
  left_inside: '',
  right_inside: '',
  left_codon_start: 0,
  right_codon_start: 0,
  color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
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


function EditableCell({ rowIndex, field, value, handleChange }) {
  
  const config = fieldConfig[field]
  const errorMessage = validateField(field, value)
  const hasError = Boolean(errorMessage)
    
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

// Body cell with its own dialog
function BodyCell({ value, onSave }) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [tempValue, setTempValue] = React.useState('')

  const handleOpen = () => {
    setTempValue(value || '')
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setTempValue('')
  }

  const handleSave = () => {
    onSave(tempValue)
    handleClose()
  }

  const displayValue = value || ''
  const truncatedValue = displayValue.length > 50 
    ? `${displayValue.substring(0, 50)}...` 
    : displayValue

  return (
    <>
      <TextField
        size="small"
        value={truncatedValue}
        onClick={handleOpen}
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
      <Dialog 
        open={dialogOpen} 
        onClose={handleClose}
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
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="Enter body text..."
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// Memoized table row to prevent re-rendering unchanged rows
const PartRow = React.memo(function PartRow({ 
  part, 
  rowIndex, 
  partsLength,
  onRemove, 
  onFieldChange,
  onBodyChange
}) {
  const handleBodySave = useCallback((newValue) => {
    onBodyChange(rowIndex, newValue)
  }, [onBodyChange, rowIndex])

  return (
    <TableRow>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            size="small"
            onClick={() => onRemove(rowIndex)}
            disabled={partsLength === 1}
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>
      {Object.keys(fieldConfig).map((field) => (
        <TableCell key={field}>
          {field === 'body' ? (
            <BodyCell value={part.body} onSave={handleBodySave} />
          ) : (
            <EditableCell 
              rowIndex={rowIndex} 
              field={field} 
              value={part[field]} 
              handleChange={onFieldChange} 
            />
          )}
        </TableCell>
      ))}
    </TableRow>
  )
}, (prevProps, nextProps) => isEqual(prevProps, nextProps))


function AssemblePartWidget() {
  const { parts, setParts } = useFormData()

  // Stable handler - uses functional update to avoid stale closure
  const handleChange = useCallback((rowIndex, field) => (event) => {
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

    setParts(prevParts => {
      const newParts = [...prevParts]
      newParts[rowIndex] = {
        ...newParts[rowIndex],
        [field]: value,
      }
      return newParts
    })
  }, [setParts])
  
  const handleAddRow = useCallback(() => {
    setParts(prevParts => [...prevParts, { ...defaultData }])
  }, [setParts])

  const handleRemoveRow = useCallback((index) => {
    setParts(prevParts => prevParts.filter((_, i) => i !== index))
  }, [setParts])


  const handleBodyChange = useCallback((rowIndex, bodyValue) => {
    setParts(prevParts => {
      const newParts = [...prevParts]
      newParts[rowIndex] = {
        ...newParts[rowIndex],
        body: bodyValue,
      }
      return newParts
    })
  }, [setParts])

  

  return (
    <Box sx={{ 
      p: 1.5, 
      maxHeight: '100vh',
    }}>
      <OverhangsPreview />

      {/* Editable Table Section */}
      <Paper sx={{ p: 1.5, mt: 2 }}>
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
                <TableCell sx={{ fontWeight: 'bold', width: '50px' }}></TableCell>
                {Object.keys(fieldConfig).map((key) => (
                  <TableCell key={key} sx={{ fontWeight: 'bold' }}>
                    {fieldConfig[key].label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {parts.map((part, rowIndex) => (
                <PartRow
                  key={rowIndex}
                  part={part}
                  rowIndex={rowIndex}
                  partsLength={parts.length}
                  onRemove={handleRemoveRow}
                  onFieldChange={handleChange}
                  onBodyChange={handleBodyChange}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}

export default AssemblePartWidget
