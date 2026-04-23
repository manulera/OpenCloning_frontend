import React from 'react';
import SequenceSelect from './SequenceSelect';
import { openCloningDBHttpClient } from './common';
import endpoints from './endpoints';
import { FormControl } from '@mui/material';

function GetSequenceFileAndDatabaseIdComponent({ setFile, setDatabaseId }) {
  const onSequenceSelect = async (selectedSequence) => {
    const selectedId = selectedSequence.id;
    try {
      const response = await openCloningDBHttpClient.get(endpoints.sequenceTextFile(selectedId));
      const sequence = response.data;
      const source = { id: 1, input: [], database_id: selectedId, type: 'DatabaseSource' };
      sequence.id = 1;
      const cloningStrategy = { sources: [source], sequences: [sequence], primers: [] };
      const fileContent = JSON.stringify(cloningStrategy);
      setFile(new File([fileContent], 'cloning_strategy.json', { type: 'application/json' }));
      setDatabaseId(selectedId);
    } catch (error) {
      console.error('Error fetching cloning strategy:', error);
      // Optionally handle error (e.g., show error message)
    }
  };

  return (
    <FormControl fullWidth>
      <SequenceSelect multiple={false} label="Sequence" onChange={onSequenceSelect} />
    </FormControl>
  );
}

export default GetSequenceFileAndDatabaseIdComponent;
