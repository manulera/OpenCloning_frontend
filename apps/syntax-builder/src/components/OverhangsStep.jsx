import React from 'react';
import { Box, Typography, TextField, Paper } from '@mui/material';
import { useFormData } from '../context/FormDataContext';

function OverhangsStep() {
  const { formData, updateOverhangs } = useFormData();
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

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 1.5 }}>
        <Typography variant="h6" gutterBottom>
          Overhangs
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter overhangs, one per line. Each overhang must be exactly 4 DNA bases (ACGT).
        </Typography>
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
    </Box>
  );
}

export default OverhangsStep;
