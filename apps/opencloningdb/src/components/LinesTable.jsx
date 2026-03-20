import React from 'react';
import { Checkbox, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { LineLink, CommaSeparatorWrapper, SequenceInLineLink } from './EntityLinks';
import TagChipList from './TagChipList';

function SeqCell({ sils }) {
  return (
    sils.length ? (
      <CommaSeparatorWrapper>
        {sils.map((sil) => (
          <SequenceInLineLink key={sil.id} {...sil} />
        ))}
      </CommaSeparatorWrapper>
    ) : (
      '—'
    )
  );
}

function LinesTable({ lines = [], withCheckbox = false, selectedIds = new Set(), toggleRow = () => {} }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          {withCheckbox && <TableCell padding="checkbox" />}
          <TableCell>UID</TableCell>
          <TableCell>Genotype</TableCell>
          <TableCell>Plasmids</TableCell>
          <TableCell>Tags</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {lines.map((line) => {
          const alleles = line.sequences_in_line?.filter((sil) => sil.sequence_type === 'allele') ?? [];
          const plasmids = line.sequences_in_line?.filter((sil) => sil.sequence_type === 'plasmid') ?? [];
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
              <TableCell><SeqCell sils={alleles} /></TableCell>
              <TableCell><SeqCell sils={plasmids} /></TableCell>
              <TableCell><TagChipList tags={line.tags} /></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default LinesTable;
