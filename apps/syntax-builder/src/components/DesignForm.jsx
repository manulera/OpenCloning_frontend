import React from 'react'

import { Box, Paper, Typography, Button } from '@mui/material'
import { Upload as UploadIcon } from '@mui/icons-material'


import OverhangsPreview from './OverhangsPreview'
import LinkedPlasmidsTable from './LinkedPlasmidsTable'
import { useLinkedPlasmids } from './useAssociatedPlasmids'
import GeneralInfo from './GeneralInfo'
import PartsForm from './PartsForm'


function UploadPlasmidsButton({ onFileChange }) {
  const fileInputRef = React.useRef(null);
  return (<>
    <Button size="small" variant="contained" startIcon={<UploadIcon />} onClick={() => fileInputRef.current.click()}>Upload linked plasmids</Button>
    <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={(event) => onFileChange(Array.from(event.target.files))} accept=".gbk,.gb,.fasta,.fa,.dna" />
  </>
  )
}

function AssemblePartWidget() {
  const { linkedPlasmids, uploadPlasmids } = useLinkedPlasmids()

  return (
    <Box sx={{ p: 1.5 }}>
      <GeneralInfo />
      <OverhangsPreview />
      <PartsForm />

      <Paper sx={{ p: 1.5, mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography variant="h6">Linked plasmids</Typography>
          <UploadPlasmidsButton onFileChange={uploadPlasmids} />
        </Box>
        <LinkedPlasmidsTable plasmids={linkedPlasmids} />
      </Paper>

    </Box>
  )
}

export default AssemblePartWidget
