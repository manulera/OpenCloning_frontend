import React from 'react';
import SequenceSelect from './SequenceSelect';
import { openCloningDBHttpClient } from './common';

function GetSequenceFileAndDatabaseIdComponent({ setFile, setDatabaseId }) {
  const onSequenceSelect = async (selectedSequence) => {
    const selectedId = selectedSequence.id;
    try {
      const response = await openCloningDBHttpClient.get(`/sequence/${selectedId}`);
      const sequence = response.data;
      const source = { id: 1, input: [], output: 2, database_id: selectedId, type: 'DatabaseSource' };
      sequence.id = 2;
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
    <div>
      <SequenceSelect fullWidth setSequence={onSequenceSelect} />
    </div>
  );
}

export default GetSequenceFileAndDatabaseIdComponent;
