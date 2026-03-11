import React from 'react';
import { Chip } from '@mui/material';

const SEQUENCE_TYPE_COLORS = {
  locus: { color: 'secondary.main' },
  allele: { color: 'warning.main' },
  plasmid: { color: 'primary.main' },
  pcr_product: { color: '#dd2d4a' },
  restriction_fragment: { color: 'success.main' },
  linear_dna: { color: 'default.main' },
};

const SEQUENCE_TYPE_LABELS = {
  locus: 'Locus',
  allele: 'Allele',
  plasmid: 'Plasmid',
  pcr_product: 'PCR product',
  restriction_fragment: 'Restriction fragment',
  linear_dna: 'Linear DNA',
};

function SequenceTypeChip({ sequenceType }) {
  if (!sequenceType) return null;

  const config = SEQUENCE_TYPE_COLORS[sequenceType] ?? { color: 'default' };
  const label = SEQUENCE_TYPE_LABELS[sequenceType] ?? sequenceType;

  return (
    <Chip
      label={label}
      sx={{ color: config.color }}
      size="small"
      variant="outlined"
    />
  );
}

export default SequenceTypeChip;
