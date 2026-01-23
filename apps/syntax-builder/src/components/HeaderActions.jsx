import React from 'react'
import { Box, Button } from '@mui/material'
import { Download as DownloadIcon } from '@mui/icons-material'
import { useDownloadData } from './useDownloadData'
import ResetButton from './ResetButton'
import UploadDataButton from './UploadDataButton'
import useUploadData from './useUploadData'

export default function HeaderActions() {
  const { downloadData } = useDownloadData()
  const { uploadData } = useUploadData()
  
  return (
    <Box sx={{ position: 'sticky',
      top: 0,
      zIndex: 1000,
      pb: 2,
      px: 1.5,
      borderBottom: '2px solid rgba(0, 0, 0, 0.12)',
      display: 'flex',
      gap: 4,
      justifyContent: 'space-between',
      alignItems: 'center' }}>
      <Button 
        variant="contained" 
        startIcon={<DownloadIcon />} 
        onClick={downloadData}
        size="large"
      >
          Download Syntax
      </Button>
      <UploadDataButton onFileChange={uploadData} />
      <ResetButton />
    </Box>
    
  )
}
