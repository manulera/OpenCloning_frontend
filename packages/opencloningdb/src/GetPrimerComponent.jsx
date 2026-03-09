import React, { useCallback } from 'react';
import PrimerSelect from './PrimerSelect';
import { openCloningDBHttpClient } from './common';
import { Box } from '@mui/material';

function GetPrimerComponent({ setPrimer, setError, existingDatabaseIds }) {
  const handlePrimerSelect = useCallback(async (selectedPrimer) => {
    if (selectedPrimer === null || selectedPrimer === '') {
      setPrimer(null);
      setError('');
      return;
    }
    try {
      const response = await openCloningDBHttpClient.get(`/primer/${selectedPrimer.id}`);
      const primer = response.data;
      /* database_id matches API primer model */
      /* eslint-disable-next-line camelcase */
      setPrimer({ name: primer.name, sequence: primer.sequence, database_id: primer.id });
      setError('');
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Could not retrieve primer from OpenCloningDB');
      setPrimer(null);
    }
  }, [setPrimer, setError]);

  return (
    <Box sx={{ minWidth: '400px' }}>
      <PrimerSelect fullWidth setPrimer={handlePrimerSelect} filterDatabaseIds={existingDatabaseIds} />
    </Box>
  );
}

export default GetPrimerComponent;
