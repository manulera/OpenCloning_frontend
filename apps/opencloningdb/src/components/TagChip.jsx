import React from 'react';
import { Chip } from '@mui/material';

function TagChip({ tag }) {
  return <Chip label={tag.name} size="small" variant="outlined" />;
}

export default TagChip;
