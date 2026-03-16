import React from 'react'
import TagChip from './TagChip'
import { Box } from '@mui/material';


function TagChipList({tags}) {
  if (!tags?.length) return '—';
  return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
    {tags.map((tag) => <TagChip key={tag.id} tag={tag} />)}
  </Box>
}

export default TagChipList
