import React from 'react';
import { TableContainer, Paper, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { SequenceLink } from './EntityLinks';
import TagChipList from './TagChipList';
import SequenceTypeChip from './SequenceTypeChip';

function SequenceTable({ sequences, showType = true }) {
  return (
    <TableContainer component={Paper} sx={{ maxWidth: 800 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            {showType && <TableCell>Type</TableCell>}
            <TableCell>Tags</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sequences.map((seq) => (
            <TableRow key={seq.id}>
              <TableCell>
                <SequenceLink id={seq.id} name={seq.name} />
              </TableCell>
              {showType && <TableCell><SequenceTypeChip sequenceType={seq.sequence_type} /></TableCell>}
              <TableCell>
                <TagChipList tags={seq.tags} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

}

export default SequenceTable;
