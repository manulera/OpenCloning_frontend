import React from 'react'
import { Box, Typography } from '@mui/material'

function DetailPageSection({title, children, actions = null}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'row', mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {actions}
      </Box>
      {children}
    </Box>
  )
}

export default DetailPageSection
