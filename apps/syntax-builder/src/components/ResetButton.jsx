import React from 'react'
import { useFormData } from '../context/FormDataContext'
import { Box, Button } from '@mui/material'

export default function ResetButton() {
  const { setParts } = useFormData();

  const handleReset = React.useCallback(() => {
    if (window.confirm('Are you sure you want to reset the form? This will clear all parts data and cannot be undone.')) {
      setParts([]);
    }
  }, [setParts]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
      <Button color="error" size="large" variant="contained" onClick={handleReset}>Reset form</Button>
    </Box>
  )
}
