import React from 'react';
import { PrimerDesignProvider } from './PrimerDesignContext';
import PrimerDesignForm from './PrimerDesignForm';

function PrimerDesignEBIC({ pcrSources }) {
  const templateSequenceId = pcrSources[0].input[0];
  const sequenceIds = React.useMemo(() => [templateSequenceId], [templateSequenceId]);
  const initialPrimerDesignSettings = { homologyLength: null, hybridizationLength: 20, targetTm: 55 };

  const steps = React.useMemo(() => [
    { label: 'Region of interest' },
  ], []);

  return (
    <PrimerDesignProvider designType="ebic" sequenceIds={sequenceIds} initialPrimerDesignSettings={initialPrimerDesignSettings} steps={steps}>
      <PrimerDesignForm />
    </PrimerDesignProvider>

  );
}

export default PrimerDesignEBIC;
