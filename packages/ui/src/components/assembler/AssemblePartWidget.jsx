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

function AssemblePartWidget() {
  const [parts, setParts] = React.useState([{ ...defaultData }])

  const handleChange = (rowIndex, field) => (event) => {
    const value = event.target.value
    setParts((prev) => {
      const newParts = [...prev]
      newParts[rowIndex] = {
        ...newParts[rowIndex],
        [field]: field === 'left_codon_start' || field === 'right_codon_start' 
          ? (value === '' ? '' : parseInt(value, 10) || 0)
          : value,
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
          inputProps={{ min: 0, style: { fontSize: '0.875rem' } }}
          sx={{ '& .MuiInputBase-root': { height: '32px' } }}
        />
      )
    }
    
    return (
      <TextField
        size="small"
        value={value}
        onChange={handleChange(rowIndex, field)}
        error={field === 'left_overhang' && value.length !== 4 && value.length > 0}
        inputProps={{ style: { fontSize: '0.875rem' } }}
        sx={{ '& .MuiInputBase-root': { height: '32px' } }}
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {parts.map((part, index) => (
                <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                  <AssemblerPart data={part} />
                </Box>
              ))}
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
