import React from 'react'
import { Button, Typography, Box } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import TagChipList from './TagChipList';

function ResourceDetailHeader({ title, tags, onBack, backTitle }) {
  return (
    <>
      <Button onClick={onBack} sx={{ mb: 2 }}>
        <ArrowBackIcon fontSize="small" sx={{ mr: 1 }} /> {backTitle}
      </Button>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {tags?.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <TagChipList tags={tags} />
        </Box>
      )}
    </>
  )
}

export default ResourceDetailHeader
