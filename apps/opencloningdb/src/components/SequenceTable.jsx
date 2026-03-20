import React from 'react';
import { Checkbox, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { SequenceLink } from './EntityLinks';
import TagChipList from './TagChipList';
import SequenceTypeChip from './SequenceTypeChip';

function SequenceTable({
  sequences = [],
  showType = true,
  showSampleUids = false,
  withCheckbox = false,
  selectedIds = new Set(),
  toggleRow = () => {},
}) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {withCheckbox && <TableCell padding="checkbox" />}
          {showSampleUids && <TableCell>UID</TableCell>}
          <TableCell>Name</TableCell>
          {showType && <TableCell>Type</TableCell>}
          <TableCell>Tags</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sequences.map((seq) => (
          <TableRow key={seq.id} hover>
            {withCheckbox && (
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={selectedIds.has(seq.id)}
                  onChange={() => toggleRow(seq.id)}
                />
              </TableCell>
            )}
            {showSampleUids && (
              <TableCell>{seq.sample_uids?.join(', ') ?? '—'}</TableCell>
            )}
            <TableCell>
              <SequenceLink id={seq.id} name={seq.name} />
            </TableCell>
            {showType && (
              <TableCell>
                <SequenceTypeChip sequenceType={seq.sequence_type} />
              </TableCell>
            )}
            <TableCell>
              <TagChipList tags={seq.tags ?? []} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

}

export default SequenceTable;
