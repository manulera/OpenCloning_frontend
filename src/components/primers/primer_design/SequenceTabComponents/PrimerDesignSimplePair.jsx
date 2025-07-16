import React from 'react';
import { PrimerDesignProvider } from './PrimerDesignContext';
import PrimerDesignForm from './PrimerDesignForm';
import usePrimerDesignSettings from './usePrimerDesignSettings';
import { getPcrTemplateSequenceId } from '../../../../store/cloning_utils';

function PrimerDesignSimplePair({ pcrSource }) {
  const templateSequenceId = getPcrTemplateSequenceId(pcrSource);
  const sequenceIds = React.useMemo(() => [templateSequenceId], [templateSequenceId]);

  const steps = React.useMemo(() => [
    { label: 'Amplified region' },
  ], []);

  const primerDesignSettings = usePrimerDesignSettings({ homology_length: null, minimal_hybridization_length: 20, target_tm: 55 });

  return (
    <PrimerDesignProvider designType="simple_pair" sequenceIds={sequenceIds} primerDesignSettings={primerDesignSettings} steps={steps}>
      <PrimerDesignForm />
    </PrimerDesignProvider>

  );
}

export default PrimerDesignSimplePair;
