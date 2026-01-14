import React from 'react';
import { Box, Typography, TextField, Paper, Button, Alert } from '@mui/material';
import { useFormData, validateOverhangPaths } from '../context/FormDataContext';
import OverhangsPreview from './OverhangsPreview';



function GeneratePartsButton() {
  const { formData, updateDesignParts } = useFormData();
  const paths = formData.overhangs.paths;

  const pathsValidation = validateOverhangPaths(paths);
  const areAllOverhangsValid = pathsValidation.isValid;
  const handleGenerateParts = () => {
    if (!areAllOverhangsValid) return;

    // Extract all edges from all paths
    const edges = new Set();
    for (const path of paths) {
      for (let i = 0; i < path.length - 1; i++) {
        edges.add(`${path[i]}|${path[i + 1]}`);
      }
    }

    // Convert edges to parts
    const parts = [];
    edges.forEach(edge => {
      const [leftOverhang, rightOverhang] = edge.split('|');
      
      /* eslint-disable camelcase */
      parts.push({
        header: `${parts.length + 1}`,
        body: '',
        glyph: 'engineered-region',
        left_overhang: leftOverhang,
        right_overhang: rightOverhang,
        left_inside: '',
        right_inside: '',
        left_codon_start: 0,
        right_codon_start: 0,
        color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
      });
      /* eslint-enable camelcase */
    });
    
    updateDesignParts(parts);
  };
  return (
    <Button
      variant="contained"
      onClick={handleGenerateParts}
      disabled={!areAllOverhangsValid}
    >
      Generate Parts
    </Button>
  )
}

function OverhangsField() {
  const { formData, updateOverhangs } = useFormData();
  const paths = React.useMemo(() => formData.overhangs.paths || [], [formData.overhangs.paths]);

  // Convert paths to multiline string (empty lines separate paths)
  const textValue = paths.map(path => path.join('\n')).join('\n\n');

  // Local state to preserve linebreaks in the text field
  const [localValue, setLocalValue] = React.useState(textValue);

  // Sync local state when paths change externally
  React.useEffect(() => {
    setLocalValue(textValue);
  }, [textValue]);


  // Validate paths structure and ordering
  const pathsValidation = validateOverhangPaths(paths);
  const orderingError = pathsValidation.error || '';

  const handleChange = (event) => {
    let value = event.target.value;

    // Only allow ACGT characters and linebreaks
    // Convert to uppercase and filter out anything that's not ACGT or newline
    value = value.toUpperCase().replace(/[^ACGT\n]/g, '');

    // Process each line: limit to 4 characters per line
    const rawLines = value.split('\n');
    const processedLines = rawLines.map((line) => {
      return line.slice(0, 4);
    });
    const processedValue = processedLines.join('\n');

    // Update local state to preserve linebreaks
    setLocalValue(processedValue);

    // Parse paths: group consecutive non-empty lines into paths
    const lines = processedLines;
    const parsedPaths = [];
    let currentPath = [];
    
    for (const line of lines) {
      if (line.length === 0) {
        // Empty line - end current path if it has content
        if (currentPath.length > 0) {
          parsedPaths.push(currentPath);
          currentPath = [];
        }
      } else {
        // Non-empty line - add to current path
        currentPath.push(line);
      }
    }
    
    // Add final path if it has content
    if (currentPath.length > 0) {
      parsedPaths.push(currentPath);
    }

    updateOverhangs(parsedPaths);
  };


  
  return (

    <Paper sx={{ p: 1.5 }}>
      <Typography variant="h6" gutterBottom>
          Overhangs
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
            Enter overhangs, one per line. Use empty lines to separate paths. Each overhang must be exactly 4 DNA bases (ACGT).
        </Typography>
        <GeneratePartsButton />
      </Box>
      {orderingError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {orderingError}
        </Alert>
      )}
      <TextField
        multiline
        rows={10}
        fullWidth
        value={localValue}
        onChange={handleChange}
        placeholder="ACGT&#10;TATG&#10;CATG&#10;&#10;TATG&#10;TTCT&#10;ATCC"
        inputProps={{
          style: { 
            fontFamily: 'monospace',
            fontSize: '0.875rem',
            textTransform: 'uppercase'
          }
        }}
        sx={{
          '& .MuiInputBase-input': {
            fontFamily: 'monospace',
          }
        }}
      />
    </Paper>
  )
}



function OverhangsStep() {


  return (
    <Box sx={{ p: 3 }}>
      <OverhangsField />
      <OverhangsPreview />
    </Box>
  );
}

export default OverhangsStep;
