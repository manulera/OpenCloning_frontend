import React from 'react'

import { Box} from '@mui/material'
import OverhangsPreview from './OverhangsPreview'
import GeneralInfo from './GeneralInfo'
import PartsForm from './PartsForm'
import LinkedPlasmidsTable from './LinkedPlasmidsTable'


function AssemblePartWidget() {
  return (
    <Box sx={{ p: 1.5 }}>
      <GeneralInfo />
      <OverhangsPreview />
      <PartsForm />
      <LinkedPlasmidsTable />
    </Box>
  )
}

export default AssemblePartWidget
