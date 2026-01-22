import React from 'react'

import { Box} from '@mui/material'
import OverhangsPreview from './OverhangsPreview'
import GeneralInfo from './GeneralInfo'
import PartsForm from './PartsForm'
import LinkedPlasmidsTable from './LinkedPlasmidsTable'
import OverhangNamesForm from './OverhangNamesForm'
import ResetButton from './ResetButton'


function AssemblePartWidget() {
  return (
    <Box sx={{ p: 1.5 }}>
      <GeneralInfo />
      <OverhangsPreview />
      <PartsForm />
      <OverhangNamesForm />
      <LinkedPlasmidsTable />
      <ResetButton />
    </Box>
  )
}

export default AssemblePartWidget
