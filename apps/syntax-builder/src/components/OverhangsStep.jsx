import React from 'react';
import { Box, Typography, TextField, Paper, Button, Alert } from '@mui/material';
import { useFormData, validateOverhang } from '../context/FormDataContext';
import Mermaid from './Mermaid';

function overhangsToMermaidString(overhangs) {
  let outString = 'graph LR\n';
  for (let i = 0; i < overhangs.length; i += 1) {
    outString += `  ${overhangs[i]} --> ${overhangs[(i + 1) % overhangs.length]}\n`;
  }
  outString += '\n';
  return outString;
}

function OverhangsStep() {
  const { formData, updateOverhangs, updateDesignParts } = useFormData();
  const overhangs = formData.overhangs.list || [];

  // Convert array to multiline string
  const textValue = overhangs.join('\n');
  
  // Local state to preserve linebreaks in the text field
  const [localValue, setLocalValue] = React.useState(textValue);
  
  // Sync local state when overhangs change externally
  React.useEffect(() => {
    setLocalValue(textValue);
  }, [textValue]);

  const handleChange = (event) => {
    let value = event.target.value;

    // Only allow ACGT characters and linebreaks
    // Convert to uppercase and filter out anything that's not ACGT or newline
    value = value.toUpperCase().replace(/[^ACGT\n]/g, '');

    // Process each line: limit to 4 characters per line
    const lines = value.split('\n');
    const processedLines = lines.map((line) => {
      return line.slice(0, 4);
    });
    const processedValue = processedLines.join('\n');

    // Update local state to preserve linebreaks
    setLocalValue(processedValue);

    // Filter out empty lines when updating context
    const validOverhangs = processedLines.filter(overhang => overhang.length > 0);
    updateOverhangs(validOverhangs);
  };

  // Check if all overhangs are valid
  const areAllOverhangsValid = overhangs.length > 0 &&
    overhangs.every(overhang => validateOverhang(overhang) === '');

  // Check for duplicate overhangs
  const hasDuplicateOverhangs = overhangs.length !== new Set(overhangs).size;
  const duplicateOverhangs = overhangs.filter((overhang, index) => overhangs.indexOf(overhang) !== index);

  const handleGenerateParts = () => {
    if (!areAllOverhangsValid) return;

    // Pair subsequent overhangs
    const parts = [];
    for (let i = 0; i < overhangs.length; i += 1) {
      const leftOverhang = overhangs[i];
      const rightOverhang = overhangs[i + 1] || overhangs[0]; // Circular iteration
      
      /* eslint-disable camelcase */
      parts.push({
        header: `Part ${parts.length + 1}`,
        body: '',
        glyph: 'engineered-region',
        left_overhang: leftOverhang,
        right_overhang: rightOverhang,
        left_inside: '',
        right_inside: '',
        left_codon_start: 0,
        right_codon_start: 0,
        color: '',
      });
      /* eslint-enable camelcase */
    }
    
    updateDesignParts(parts);
  };

  console.log('overhangs', overhangs);
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 1.5 }}>
        <Typography variant="h6" gutterBottom>
          Overhangs
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Enter overhangs, one per line. Each overhang must be exactly 4 DNA bases (ACGT).
          </Typography>
          <Button
            variant="contained"
            onClick={handleGenerateParts}
            disabled={!areAllOverhangsValid || hasDuplicateOverhangs}
          >
            Generate Parts
          </Button>
        </Box>
        {hasDuplicateOverhangs && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Duplicate overhangs found: {[...new Set(duplicateOverhangs)].join(', ')}
          </Alert>
        )}
        <TextField
          multiline
          rows={10}
          fullWidth
          value={localValue}
          onChange={handleChange}
          placeholder="ACGT&#10;TATG&#10;CATG"
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
      {!hasDuplicateOverhangs && areAllOverhangsValid && overhangs.length >= 2 && (
        <Mermaid string={overhangsToMermaidString(overhangs)} />
      )}
    </Box>
  );
}

export default OverhangsStep;
