import React from 'react';
import { PrimerDesignProvider } from './PrimerDesignContext';
import PrimerDesignForm from './PrimerDesignForm';
import useEBICPrimerDesignSettings from './useEBICPrimerDesignSettings';

function PrimerDesignEBIC({ pcrSources }) {
  const templateSequenceId = pcrSources[0].input[0];
  const sequenceIds = React.useMemo(() => [templateSequenceId], [templateSequenceId]);
  const primerDesignSettings = useEBICPrimerDesignSettings();

  const steps = React.useMemo(() => [
    { label: 'Region of interest', description: 'Select in the editor the region to be replaced' },
  ], []);

  return (
    <PrimerDesignProvider designType="ebic" sequenceIds={sequenceIds} primerDesignSettings={primerDesignSettings} steps={steps}>
      <PrimerDesignForm />
    </PrimerDesignProvider>

  );
}

export default PrimerDesignEBIC;
