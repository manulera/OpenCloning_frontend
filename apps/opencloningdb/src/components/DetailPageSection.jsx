import React from 'react'
import { Box, Typography } from '@mui/material'

function DetailPageSection({title, children}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

export default DetailPageSection
