import React from 'react';
import { Box } from '@mui/material';

function SampleUidBadge({ uid }) {
  return (
    <Box
      component="span"
      sx={{
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        bgcolor: 'action.hover',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        px: 1,
        py: 0.5,
      }}
    >
      {uid}
    </Box>
  );
}

export default SampleUidBadge;
