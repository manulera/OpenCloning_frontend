import React from 'react'
import { Button, Typography, Box } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import TagChipList from './TagChipList';

function ResourceDetailHeader({ title, tags, entityId=null, entityType=null, onBack, backTitle, afterTitle = null, belowTitle = null }) {
  return (
    <>
      <Button onClick={onBack} sx={{ mb: 2 }}>
        <ArrowBackIcon fontSize="small" sx={{ mr: 1 }} /> {backTitle}
      </Button>
      <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row', mb: 1 }}>
        <Typography variant="h5">
          {title}
        </Typography>
        {afterTitle && <Box variant="h5" sx={{ mx: 1 }}>&mdash;</Box>}
        {afterTitle}
      </Box>
      {belowTitle}
      {tags?.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <TagChipList tags={tags} entityId={entityId} entityType={entityType} />
        </Box>
      )}
    </>
  )
}

export default ResourceDetailHeader
