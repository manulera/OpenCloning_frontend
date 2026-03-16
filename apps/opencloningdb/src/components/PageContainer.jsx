import React from 'react'
import { Box } from '@mui/material'

function PageContainer({ children }) {
  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 3 }}>
      {children}
    </Box>
  )
}

export default PageContainer
