import React from 'react'
import { Typography, Paper, Box } from '@mui/material'

function SectionWrapper({ title, children, actions }) {
  return (
    <Paper sx={{ p: 2, mb: 2 }} >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">{title}</Typography>
        {actions}
      </Box>
      {children}
    </Paper>
  )
}

export default SectionWrapper
