import React from 'react';
import { PrimerDesignProvider } from './PrimerDesignContext';
import PrimerDesignForm from './PrimerDesignForm';

function PrimerDesignSimplePair({ pcrSource, restrictionLigation = false }) {
  const templateSequenceId = pcrSource.input[0];
  const sequenceIds = React.useMemo(() => [templateSequenceId], [templateSequenceId]);
  const initialPrimerDesignSettings = { homologyLength: null, hybridizationLength: 20, targetTm: 55 };

  const steps = React.useMemo(() => [
    { label: 'Amplified region' },
  ], []);

  const designType = restrictionLigation ? 'restriction_ligation' : 'simple_pair';
  return (
    <PrimerDesignProvider designType={designType} sequenceIds={sequenceIds} initialPrimerDesignSettings={initialPrimerDesignSettings} steps={steps}>
      <PrimerDesignForm />
    </PrimerDesignProvider>

  );
}

export default PrimerDesignSimplePair;
