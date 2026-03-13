import React from 'react';
import { Chip } from '@mui/material';
import { SEQUENCE_TYPE_COLORS, SEQUENCE_TYPE_LABELS } from '../utils/query_utils';



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
