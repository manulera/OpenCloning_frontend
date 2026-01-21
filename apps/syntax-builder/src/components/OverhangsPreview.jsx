import React from 'react';
import { useFormData } from '../context/FormDataContext';
import { Paper, Box, Typography, FormControlLabel, Switch, Table, TableBody, TableRow, TableCell } from '@mui/material';
import { AssemblerPart, AssemblerPartContainer, AssemblerPartCore, DisplayInside, DisplayOverhang } from '@opencloning/ui/components/assembler';
import { GRAPH_SPACER, graphToMSA, partDataToDisplayData } from '@opencloning/ui/components/assembler';

function OverhangRow({ row, mode = 'detailed' }) {
  const {parts} = useFormData();
  const rows2iterate = [...row];
  const actualRows =[];
  
  let currentCell = [rows2iterate.shift(), 1];
  while (currentCell[0] !== undefined) {
    if (rows2iterate[0] === GRAPH_SPACER) {
      currentCell[1]++;
      rows2iterate.shift();
    } else {
      actualRows.push(currentCell);
      currentCell = [rows2iterate.shift(), 1];
    }
  }
  actualRows.forEach(cell => {
    const [leftOverhang, rightOverhang] = cell[0].split('-');
    const data = parts.find(part => part.left_overhang === leftOverhang && part.right_overhang === rightOverhang) ||
       {
         left_overhang: leftOverhang,
         right_overhang: rightOverhang,
         left_inside: '',
         right_inside: '',
         left_codon_start: 0,
         right_codon_start: 0,
         color: 'lightgray',
         glyph: 'engineered-region',
       }
    cell.push(data);
  });
  return (
    <TableRow >
      {actualRows.flatMap(
        (cell, index) => {
          const showRight = index === actualRows.length - 1;
  
          const colSpan = (cell[1]-1)*2 + 1;
          const { left_overhang, right_overhang, left_inside, color, glyph } = cell[2];
          const { leftTranslationOverhang, leftTranslationInside, leftOverhangRc, rightOverhangRc, leftInsideRc } = partDataToDisplayData(cell[2]);
          if (mode === 'compact') {
            return <React.Fragment key={`row-${index}-compact`}>
              <TableCell sx={{padding: 0}} >
                <AssemblerPartContainer>
                  <DisplayOverhang overhang={left_overhang} overhangRc={leftOverhangRc} translation={leftTranslationOverhang} isRight={false} />
                  {left_inside && <DisplayInside inside={left_inside} insideRc={leftInsideRc} translation={leftTranslationInside} isRight={false} />}
                </AssemblerPartContainer>
              </TableCell>
              <TableCell sx={{ padding: 0, textAlign: "center" }} colSpan={colSpan}>
                <AssemblerPartContainer>
                  <AssemblerPartCore color={color} glyph={glyph} />
                </AssemblerPartContainer>
              </TableCell>
              {showRight && (
                <TableCell 
                  key={index}
                  sx={{ py: 0}}
                >
                  <AssemblerPartContainer>
                    <DisplayOverhang overhang={right_overhang} overhangRc={rightOverhangRc} isRight={true} />
                  </AssemblerPartContainer>
                </TableCell>
              )}
            </React.Fragment>
          }
          if (mode === 'detailed') {
            return (
              <TableCell colSpan={cell[1]} key={`row-${index}-detailed`} sx={{ border: 1, py: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="h6" >{cell[2].name}</Typography>
                  <Typography variant="body2" >{cell[2].info}</Typography>
                  <AssemblerPart data={cell[2]} />
                </Box>
              </TableCell>
            )
          }
        }
      )}
    </TableRow>
  );
}


function OverhangsPreview() {

  const { graph } = useFormData();

  const [mode, setMode] = React.useState('detailed');
  const msa = React.useMemo(() => graph ? graphToMSA(graph) : [], [graph])

  if (graph) {
    return (
      <Paper sx={{ p: 2, mt: 2}}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
              Parts Preview
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={mode === 'detailed'}
                onChange={(e) => setMode(e.target.checked ? 'detailed' : 'compact')}
              />
            }
            label={mode === 'compact' ? 'Compact' : 'Detailed'}
          />
        </Box>
        <Box sx={{ overflowY: 'auto', overflowX: 'auto' }}>
          <Table sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <TableBody>
              {msa.map((row, index) => (
                <OverhangRow key={index} row={row} mode={mode} />
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    )}
}

export default OverhangsPreview;
