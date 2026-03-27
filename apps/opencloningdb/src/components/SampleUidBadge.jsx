import React from 'react';
import { Box } from '@mui/material';

export const sampleUidBadgeSx = {
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  bgcolor: 'action.hover',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  px: 1,
  py: 0.5,
};

function SampleUidBadge({ uid }) {
  return (
    <Box component="span" sx={sampleUidBadgeSx}>
      {uid}
    </Box>
  );
}

export default SampleUidBadge;
