import React from 'react'
import { TextField, FormControl, InputLabel, Select, MenuItem, Box, Grid, Paper, Typography, Table, TableContainer, TableHead, TableBody, TableRow, TableCell, Button } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
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

function AssemblePartWidget() {
  const [formData, setFormData] = React.useState(defaultData)

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'left_codon_start' || field === 'right_codon_start' 
        ? (value === '' ? '' : parseInt(value, 10) || 0)
        : value,
    }))
  }

  const handleCopyRow = async () => {
    const keys = Object.keys(formData)
    const headers = keys.join('\t')
    const values = keys.map((key) => String(formData[key])).join('\t')
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

  return (
    <Box sx={{ 
      p: 1.5, 
      maxHeight: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden'
    }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 1.5 }}>
              Part Configuration
            </Typography>
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <TextField
                size="small"
                label="Header"
                value={formData.header}
                onChange={handleChange('header')}
                fullWidth
              />
              <TextField
                size="small"
                label="Body"
                value={formData.body}
                onChange={handleChange('body')}
                fullWidth
                multiline
                rows={2}
              />
              <FormControl fullWidth size="small">
                <InputLabel id="glyph-select-label">Glyph</InputLabel>
                <Select
                  labelId="glyph-select-label"
                  value={formData.glyph}
                  label="Glyph"
                  onChange={handleChange('glyph')}
                >
                  {glyphOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Color"
                value={formData.color}
                onChange={handleChange('color')}
                fullWidth
                helperText="CSS color name or hex code"
              />
              <Typography variant="subtitle2" sx={{ mt: 0.5, mb: 0.5 }}>
                Left Side
              </Typography>
              <TextField
                size="small"
                label="Left Overhang"
                value={formData.left_overhang}
                onChange={handleChange('left_overhang')}
                error={formData.left_overhang.length !== 4}
                helperText={formData.left_overhang.length !== 4 ? 'Must be 4 bases' : ''}
                fullWidth
              />
              <TextField
                size="small"
                label="Left Inside"
                value={formData.left_inside}
                onChange={handleChange('left_inside')}
                fullWidth
              />
              <TextField
                size="small"
                label="Left Codon Start"
                type="number"
                value={formData.left_codon_start}
                onChange={handleChange('left_codon_start')}
                fullWidth
                inputProps={{ min: 0 }}
                helperText="If the left side is translated, where the codon starts"
              />
              <Typography variant="subtitle2" sx={{ mt: 0.5, mb: 0.5 }}>
                Right Side
              </Typography>
              <TextField
                size="small"
                label="Right Overhang"
                value={formData.right_overhang}
                onChange={handleChange('right_overhang')}
                fullWidth
              />
              <TextField
                size="small"
                label="Right Inside"
                value={formData.right_inside}
                onChange={handleChange('right_inside')}
                fullWidth
              />
              <TextField
                size="small"
                label="Right Codon Start"
                type="number"
                value={formData.right_codon_start}
                onChange={handleChange('right_codon_start')}
                fullWidth
                inputProps={{ min: 0 }}
                helperText="If the right side is translated, where the codon starts"
              />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 1.5 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 1.5 }}>
              Preview
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {(formData.header || formData.body) && (
                <Box sx={{ 
                  textAlign: 'center', 
                  mb: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5
                }}>
                  {formData.header && (
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {formData.header}
                    </Typography>
                  )}
                  {formData.body && (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {formData.body}
                    </Typography>
                  )}
                </Box>
              )}
              <AssemblerPart data={formData} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
      <Box sx={{ mt: 2 }}>
        <Paper sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h6">
              JSON Data
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyRow}
            >
              Copy Row
            </Button>
          </Box>
          <TableContainer>
            <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.5, px: 1 } }}>
              <TableHead>
                <TableRow>
                  {Object.keys(formData).map((key) => (
                    <TableCell key={key} sx={{ fontWeight: 'bold' }}>
                      {key}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  {Object.keys(formData).map((key) => (
                    <TableCell key={key}>
                      {String(formData[key])}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  )
}

export default AssemblePartWidget
