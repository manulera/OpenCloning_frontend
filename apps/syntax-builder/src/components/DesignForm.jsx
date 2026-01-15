import React, { useCallback, useMemo } from 'react'
import { DataGrid, GridActionsCellItem, useGridApiContext, useGridApiRef } from '@mui/x-data-grid'
import { Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, Tooltip } from '@mui/material'
import { AddCircle as AddCircleIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { getSvgByGlyph } from '@opencloning/ui/components/assembler'
import { useFormData, validateField } from '../context/FormDataContext'
import OverhangsPreview from './OverhangsPreview'

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
const createDefaultPart = () => ({
  id: Date.now() + Math.random(),
  header: '',
  body: '',
  glyph: 'engineered-region',
  left_overhang: '',
  right_overhang: '',
  left_inside: '',
  right_inside: '',
  left_codon_start: 0,
  right_codon_start: 0,
  color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
})
/* eslint-enable camelcase */

// Custom edit component for glyph field
function GlyphEditCell(props) {
  const { id, value, field } = props
  const apiRef = useGridApiContext()

  const handleChange = (event) => {
    apiRef.current.setEditCellValue({ id, field, value: event.target.value })
  }

  return (
    <Select
      value={value || 'engineered-region'}
      onChange={handleChange}
      fullWidth
      size="small"
      autoFocus
      sx={{ fontSize: '0.875rem' }}
    >
      {glyphOptions.map((option) => (
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
  )
}

// Body cell dialog for long text editing
function BodyEditDialog({ open, value, onClose, onSave }) {
  const [tempValue, setTempValue] = React.useState(value || '')

  React.useEffect(() => {
    if (open) setTempValue(value || '')
  }, [open, value])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(tempValue)} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  )
}

function AssemblePartWidget() {
  const { parts, setParts } = useFormData()
  const [bodyDialog, setBodyDialog] = React.useState({ open: false, rowId: null, value: '' })
  const apiRef = useGridApiRef()

  const processRowUpdate = useCallback((newRow) => {
    setParts(prevParts => 
      prevParts.map(part => 
        part.id === newRow.id ? newRow : part
      )
    )
    return newRow
  }, [setParts])

  const handleAddRow = useCallback(() => {
    setParts(prevParts => [...prevParts, createDefaultPart()])
  }, [setParts])

  const handleDeleteRow = useCallback((id) => () => {
    setParts(prevParts => prevParts.filter(part => part.id !== id))
  }, [setParts])

  const handleCellClick = useCallback((params) => {
    if (params.field === 'body') {
      setBodyDialog({ open: true, rowId: params.id, value: params.value })
    } else if (params.field !== 'actions' && params.isEditable) {
      apiRef.current.startCellEditMode({ id: params.id, field: params.field })
    }
  }, [apiRef])

  const handleBodySave = useCallback((newValue) => {
    setParts(prevParts => 
      prevParts.map(part => 
        part.id === bodyDialog.rowId 
          ? { ...part, body: newValue } 
          : part
      )
    )
    setBodyDialog({ open: false, rowId: null, value: '' })
  }, [bodyDialog.rowId, setParts])

  // Render cell with validation error display
  const renderValidatedCell = useCallback((field, params) => {
    const errorMessage = validateField(field, params.value)
    return (
      <Tooltip title={errorMessage || ''} placement="top" arrow>
        <Box sx={{ 
          color: errorMessage ? 'error.main' : 'inherit',
          fontWeight: errorMessage ? 'bold' : 'normal',
          width: '100%'
        }}>
          {params.value ?? ''}
        </Box>
      </Tooltip>
    )
  }, [])

  const columns = useMemo(() => [
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 50,
      getActions: (params) => [
        <GridActionsCellItem
          key="delete"
          icon={<DeleteIcon />}
          label="Delete"
          onClick={handleDeleteRow(params.id)}
          disabled={parts.length === 1}
          color="error"
        />
      ]
    },
    { 
      field: 'header', 
      headerName: 'Header', 
      flex: 1,
      editable: true 
    },
    { 
      field: 'body', 
      headerName: 'Body', 
      flex: 1,
      editable: false,
      renderCell: (params) => (
        <Box sx={{ cursor: 'pointer', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value ? (params.value.length > 30 ? `${params.value.substring(0, 30)}...` : params.value) : 'Click to edit...'}
        </Box>
      )
    },
    { 
      field: 'glyph', 
      headerName: 'Glyph', 
      flex: 1,
      editable: true,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img src={getSvgByGlyph(params.value)} alt={params.value} style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
          <span>{params.value}</span>
        </Box>
      ),
      renderEditCell: (params) => <GlyphEditCell {...params} />
    },
    { 
      field: 'left_overhang', 
      headerName: 'Left Overhang', 
      flex: 1,
      editable: true,
      renderCell: (params) => renderValidatedCell('left_overhang', params),
      valueParser: (value) => (value || '').toUpperCase().replace(/[^ACGT]/g, '')
    },
    { 
      field: 'right_overhang', 
      headerName: 'Right Overhang', 
      flex: 1,
      editable: true,
      renderCell: (params) => renderValidatedCell('right_overhang', params),
      valueParser: (value) => (value || '').toUpperCase().replace(/[^ACGT]/g, '')
    },
    { 
      field: 'left_inside', 
      headerName: 'Left Inside', 
      flex: 1,
      editable: true,
      renderCell: (params) => renderValidatedCell('left_inside', params),
      valueParser: (value) => (value || '').toUpperCase().replace(/[^ACGTN]/g, '')
    },
    { 
      field: 'right_inside', 
      headerName: 'Right Inside', 
      flex: 1,
      editable: true,
      renderCell: (params) => renderValidatedCell('right_inside', params),
      valueParser: (value) => (value || '').toUpperCase().replace(/[^ACGTN]/g, '')
    },
    { 
      field: 'left_codon_start', 
      headerName: 'Left Codon Start', 
      flex: 1,
      type: 'number',
      editable: true,
      valueParser: (value) => Math.max(0, parseInt(value, 10) || 0)
    },
    { 
      field: 'right_codon_start', 
      headerName: 'Right Codon Start', 
      flex: 1,
      type: 'number',
      editable: true,
      valueParser: (value) => Math.max(0, parseInt(value, 10) || 0)
    },
    { 
      field: 'color', 
      headerName: 'Color', 
      flex: 1,
      editable: true,
      renderCell: (params) => {
        const errorMessage = validateField('color', params.value)
        return (
          <Tooltip title={errorMessage || ''} placement="top" arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 20, height: 20, 
                backgroundColor: errorMessage ? 'transparent' : (params.value || 'transparent'),
                border: errorMessage ? '2px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }} />
              <span style={{ color: errorMessage ? 'red' : 'inherit' }}>{params.value}</span>
            </Box>
          </Tooltip>
        )
      }
    },
  ], [handleDeleteRow, parts.length, renderValidatedCell])

  return (
    <Box sx={{ p: 1.5, maxHeight: '100vh' }}>
      <OverhangsPreview />

      <Paper sx={{ p: 1.5, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6">Parts Configuration</Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddCircleIcon />}
            onClick={handleAddRow}
          >
            Add Row
          </Button>
        </Box>
        
        <DataGrid
          apiRef={apiRef}
          rows={parts}
          columns={columns}
          processRowUpdate={processRowUpdate}
          onCellClick={handleCellClick}
          density="compact"
          disableRowSelectionOnClick
          disableColumnSorting
          disableColumnFilter
          disableColumnMenu
          hideFooter
          autoHeight
          sx={{
            '& .MuiDataGrid-cell': { fontSize: '0.875rem' },
            '& .MuiDataGrid-columnHeader': { fontWeight: 'bold' }
          }}
        />
      </Paper>

      <BodyEditDialog
        open={bodyDialog.open}
        value={bodyDialog.value}
        onClose={() => setBodyDialog({ open: false, rowId: null, value: '' })}
        onSave={handleBodySave}
      />
    </Box>
  )
}

export default AssemblePartWidget
