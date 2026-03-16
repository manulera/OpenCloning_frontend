import React from 'react'
import { Box, SpeedDial, SpeedDialAction } from '@mui/material'
import { Add as AddIcon, Build as BuildIcon, Search as SearchIcon, PushPin as PushPinIcon } from '@mui/icons-material'

function CloningToolsButton() {

  return (
    // <Box sx={{ position: 'absolute', bottom: 0, right: 0 }}>
    <Box sx={{ position: 'fixed', bottom: 10, left: 10, zIndex: 1000 }}>
      <SpeedDial icon={<BuildIcon />} ariaLabel="Cloning tools" direction="up" >
        <SpeedDialAction icon={<PushPinIcon />} tooltipTitle="Locate sequences in database"/>
      </SpeedDial>

    </Box>
  // </Box>
  )
}

export default CloningToolsButton
