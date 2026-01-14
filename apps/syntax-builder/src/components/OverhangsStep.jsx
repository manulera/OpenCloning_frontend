import React from 'react';
import { Box, Typography, TextField, Paper, Button, Alert, Table, TableBody, TableRow, TableCell } from '@mui/material';
import { useFormData, validateOverhangPaths } from '../context/FormDataContext';
import { AssemblerPartCore } from '@opencloning/ui/components/assembler';
import { pathToMSA } from '../graph_utils';
import { assemblyComponentStyles as styles } from '@opencloning/ui/components/assembler';
import { getComplementSequenceString } from '@teselagen/sequence-utils';


function OverhangDisplay( { overhang } ) {
  const overhangRc = getComplementSequenceString(overhang)
  return (
    <div className={`${styles.dna} ${styles.overhang} ${styles.left}`}>
      <div className={styles.top}></div>
      <div className={styles.watson}>{overhang}</div>
      <div className={styles.crick}>{overhangRc}</div>
      <div className={styles.bottom}> </div>
    </div>
  )
}

function overhangRow(row) {
  const rows2iterate = [...row];
  const actualRows =[];

  let currentCell = [rows2iterate.shift(), 1];
  while (rows2iterate.length > 0) {
    if (rows2iterate[0] === '---------') {
      currentCell[1]++;
      rows2iterate.shift();
    } else {
      actualRows.push(currentCell);
      currentCell = [rows2iterate.shift(), 1];
    }
  }
  actualRows.forEach(cell => {
    const [leftOverhang, rightOverhang] = cell[0].split('-');
    const data = {
      left_overhang: leftOverhang,
      right_overhang: rightOverhang,
    }
    cell.push(data);
  });
  return (
    <TableRow >
      {actualRows.flatMap(
        (cell, index) => {
          const showRight = index === actualRows.length - 1;

          const colSpan = (cell[1]-1)*2 + 1;
          console.log('colSpan', cell[1], colSpan);
          return <>
            <TableCell sx={{padding: 0}} >
              <OverhangDisplay overhang={cell[2].left_overhang} />
            </TableCell>
            <TableCell sx={{ padding: 0, textAlign: "center" }} colSpan={colSpan}>
              <AssemblerPartCore color="lightgray" glyph="engineered-region" />
            </TableCell>
            {showRight && (
              <TableCell 
                key={index}
                sx={{ padding: 0 }}
              >
                <OverhangDisplay overhang={cell[2].right_overhang} />
              </TableCell>
            )}
            </>
         
        }
      )}
      
    </TableRow>
  );
}

function OverhangsStep() {
  const { formData, updateOverhangs, updateDesignParts } = useFormData();
  const paths = React.useMemo(() => formData.overhangs.paths || [], [formData.overhangs.paths]);

  // Convert paths to multiline string (empty lines separate paths)
  const textValue = paths.map(path => path.join('\n')).join('\n\n');
  
  // Local state to preserve linebreaks in the text field
  const [localValue, setLocalValue] = React.useState(textValue);

  const msa = React.useMemo(() => pathToMSA(paths), [paths]);
  
  console.log('msa', msa);
  // Sync local state when paths change externally
  React.useEffect(() => {
    setLocalValue(textValue);
  }, [textValue]);

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

  // Validate paths structure and ordering
  const pathsValidation = validateOverhangPaths(paths);
  const areAllOverhangsValid = pathsValidation.isValid;
  const orderingError = pathsValidation.error || '';
  const nodeOrder = React.useMemo(() => pathsValidation.nodeOrder || [], [pathsValidation.nodeOrder]);

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
    });
    
    updateDesignParts(parts);
  };
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 1.5 }}>
        <Typography variant="h6" gutterBottom>
          Overhangs
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Enter overhangs, one per line. Use empty lines to separate paths. Each overhang must be exactly 4 DNA bases (ACGT).
          </Typography>
          <Button
            variant="contained"
            onClick={handleGenerateParts}
            disabled={!areAllOverhangsValid}
          >
            Generate Parts
          </Button>
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
      {areAllOverhangsValid && paths.length > 0 && paths.some(path => path.length >= 2) && (
        <>
          <Paper sx={{ p: 2, mt: 2, maxHeight: '70vh', overflowY: 'auto', overflowX: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 1.5 }}>
              Parts Preview
            </Typography>
            <Box>
              <Table sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <TableBody>
                  {msa.map((row, index) => (
                    overhangRow(row)
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}

export default OverhangsStep;
