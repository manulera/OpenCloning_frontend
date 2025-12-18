import React from 'react';
import { Box, Typography, TextField, Paper, Button, Alert, Table, TableBody, TableRow, TableCell } from '@mui/material';
import { useFormData, validateOverhangPaths } from '../context/FormDataContext';
import { AssemblerPart } from '@opencloning/ui/components/assembler';
import Mermaid from './Mermaid';

function pathsToMermaidString(paths) {
  let outString = 'flowchart LR\n';
  const edges = new Set();
  const uniqueOverhangs = new Set();
  for (const path of paths) {
    for (const overhang of path) {
      uniqueOverhangs.add(overhang);
    }
  }
  const uniqueOverhangsArray = Array.from(uniqueOverhangs);
  // Extract all edges from all paths
  for (const path of paths) {
    for (let i = 0; i < path.length - 1; i++) {
      const leftNode = uniqueOverhangsArray.indexOf(path[i]) + 1;
      const rightNode = uniqueOverhangsArray.indexOf(path[i + 1]) + 1;
      const edge = `${leftNode} --[${path[i+1]}]--> ${rightNode}`;
      edges.add(edge);
    }
  }
  
  // Add all unique edges
  edges.forEach(edge => {
    outString += `  ${edge}\n`;
  });
  
  return outString;
}

function OverhangsStep() {
  const { formData, updateOverhangs, updateDesignParts } = useFormData();
  const paths = React.useMemo(() => formData.overhangs.paths || [], [formData.overhangs.paths]);

  // Convert paths to multiline string (empty lines separate paths)
  const textValue = paths.map(path => path.join('\n')).join('\n\n');
  
  // Local state to preserve linebreaks in the text field
  const [localValue, setLocalValue] = React.useState(textValue);
  
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

  // Generate parts for display grouped by path with column positions
  const displayPaths = React.useMemo(() => {
    const currentPaths = formData.overhangs.paths || [];
    const currentNodeOrder = pathsValidation.nodeOrder || [];
    if (!areAllOverhangsValid || currentPaths.length === 0 || currentNodeOrder.length === 0) return [];

    // Build a map of overhang to column index
    // Use first occurrence to handle circular paths where start/end overlap
    const overhangToColumn = new Map();
    currentNodeOrder.forEach((overhang, index) => {
      // Only set if not already in map (use first occurrence)
      if (!overhangToColumn.has(overhang)) {
        overhangToColumn.set(overhang, index);
      }
    });

    // Convert each path to an array of parts with column positions
    return currentPaths.map((path) => {
      const parts = [];
      for (let i = 0; i < path.length - 1; i++) {
        const leftOverhang = path[i];
        const rightOverhang = path[i + 1];
        const leftColumn = overhangToColumn.get(leftOverhang);
        const rightColumn = overhangToColumn.get(rightOverhang);
        
        /* eslint-disable camelcase */
        parts.push({
          header: `Part ${leftColumn + 1}`,
          body: '',
          glyph: 'engineered-region',
          left_overhang: leftOverhang,
          right_overhang: rightOverhang,
          left_inside: '',
          right_inside: '',
          left_codon_start: 0,
          right_codon_start: 0,
          color: '',
          leftColumn,
          rightColumn,
        });
        /* eslint-enable camelcase */
      }
      return parts;
    });
  }, [formData.overhangs.paths, areAllOverhangsValid, pathsValidation.nodeOrder]);

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
          <Mermaid string={pathsToMermaidString(paths)} />
          <Paper sx={{ p: 2, mt: 2, maxHeight: '70vh', overflowY: 'auto', overflowX: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 1.5 }}>
              Parts Preview
            </Typography>
            <Box>
              <Table sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <TableBody>
                  {displayPaths.map((pathParts, pathIndex) => {
                    // Create an array to represent cells in this row
                    const cells = new Array(nodeOrder.length).fill(null);
                    
                    // Find the maximum column index for this path (last part's right column)
                    const maxColumn = pathParts.length > 0 
                      ? Math.max(...pathParts.map(p => p.rightColumn ?? p.leftColumn ?? -1))
                      : -1;
                    
                    // Place each part in the correct column, maintaining path order
                    // Sort parts by leftColumn to ensure correct visual order
                    const sortedParts = [...pathParts].sort((a, b) => {
                      const aCol = a.leftColumn ?? Infinity;
                      const bCol = b.leftColumn ?? Infinity;
                      return aCol - bCol;
                    });
                    
                    // Place parts in sorted order
                    sortedParts.forEach((part) => {
                      if (part.leftColumn !== undefined && part.leftColumn >= 0 && part.leftColumn < cells.length) {
                        cells[part.leftColumn] = part;
                      }
                    });

                    return (
                      <TableRow key={pathIndex}>
                        {cells.map((part, colIndex) => {
                          // Show right overhang if:
                          // 1. It's the last part in the path (at maxColumn), OR
                          // 2. The next cell is empty (there's a gap after it)
                          const isLastInPath = colIndex === maxColumn;
                          const isBeforeGap = part && (colIndex + 1 >= cells.length || cells[colIndex + 1] === null);
                          const showRight = isLastInPath || isBeforeGap;
                          
                          return (
                            <TableCell
                              key={colIndex}
                              sx={{
                                border: 'none',
                                padding: part ? '8px' : '0px',
                                verticalAlign: 'bottom',
                                width: part ? 'auto' : '60px',
                                minWidth: part ? 'fit-content' : '60px',
                              }}
                            >
                              {part && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  {part.header && (
                                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                      {part.header}
                                    </Typography>
                                  )}
                                  <AssemblerPart 
                                    data={part} 
                                    showRight={showRight} 
                                  />
                                </Box>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
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
