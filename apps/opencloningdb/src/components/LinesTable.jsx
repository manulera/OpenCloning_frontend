import React from 'react';
import { Checkbox, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { LineLink, CommaSeparatorWrapper, SequenceLink } from './EntityLinks';
import TagChipList from './TagChipList';
import SelectAllCheckbox from './SelectAllCheckbox';
import { getAlleleSequencesInLine, getPlasmidSequencesInLine } from '../utils/models_utils';

function SeqCell({ sequences }) {
  return (
    sequences.length ? (
      <CommaSeparatorWrapper>
        {sequences.map((sequence) => (
          <SequenceLink key={sequence.id} {...sequence} />
        ))}
      </CommaSeparatorWrapper>
    ) : (
      '—'
    )
  );
}

function LinesTable({ lines = [], withCheckbox = false, selectedIds = new Set(), toggleRow = () => {} }) {
  const ids = lines.map((line) => line.id);

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {withCheckbox && (
            <TableCell padding="checkbox">
              <SelectAllCheckbox
                ids={ids}
                selectedIds={selectedIds}
                toggleRow={toggleRow}
                ariaLabel="select all lines"
              />
            </TableCell>
          )}
          <TableCell>UID</TableCell>
          <TableCell>Genotype</TableCell>
          <TableCell>Plasmids</TableCell>
          <TableCell>Tags</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {lines.map((line) => {
          return (
            <TableRow key={line.id} hover>
              {withCheckbox &&
              (<TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={selectedIds.has(line.id)}
                  onChange={() => toggleRow(line.id)}
                />
              </TableCell>)}
              <TableCell>
                <LineLink {...line} />
              </TableCell>
              <TableCell><SeqCell sequences={getAlleleSequencesInLine(line)} /></TableCell>
              <TableCell><SeqCell sequences={getPlasmidSequencesInLine(line)} /></TableCell>
              <TableCell><TagChipList tags={line.tags} /></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default LinesTable;
