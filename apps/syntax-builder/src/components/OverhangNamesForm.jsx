import React from 'react'
import SectionWrapper from './SectionWrapper'
import { useFormData } from '../context/FormDataContext';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from '@mui/material';

function OverhangNamesForm() {
  const { overhangNames, updateOverhangName } = useFormData();
  const allOverhangs = React.useMemo(() => Object.keys(overhangNames), [overhangNames]);
  return (
    <SectionWrapper title="Overhang Names">
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Overhang</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allOverhangs.map((overhang) => (
              <TableRow key={overhang}>
                <TableCell sx={{ fontFamily: 'monospace' }}>{overhang}</TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={overhangNames[overhang] || ''}
                    onChange={(e) => updateOverhangName(overhang, e.target.value)}
                    placeholder="Enter name"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SectionWrapper>
  )
}

export default OverhangNamesForm
