import React from 'react'
import { useFormData } from '../context/FormDataContext'
import { Button } from '@mui/material'
import { useLinkedPlasmids } from './useAssociatedPlasmids';

export default function ResetButton() {
  const { setParts } = useFormData();
  const {setLinkedPlasmids} = useLinkedPlasmids();

  const handleReset = React.useCallback(() => {
    if (window.confirm('Are you sure you want to reset the form? This will clear all parts data and cannot be undone.')) {
      setParts([]);
      setLinkedPlasmids([]);
    }
  }, [setParts, setLinkedPlasmids]);

  return (
    <Button color="error" size="large" variant="contained" onClick={handleReset}>
      Reset form
    </Button>
  )
}
