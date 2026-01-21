import React from 'react';
import { PrimerDesignProvider } from './PrimerDesignContext';
import PrimerDesignForm from './PrimerDesignForm';
import usePrimerDesignSettings from './usePrimerDesignSettings';
import { getPcrTemplateSequenceId } from '@opencloning/store/cloning_utils';

export default function PrimerDesignGibsonAssembly({ pcrSources }) {
  const templateSequencesIds = React.useMemo(() => pcrSources.map(getPcrTemplateSequenceId), [pcrSources]);
  const steps = React.useMemo(() => [
    ...templateSequencesIds.map((id, index) => (
      { label: `Seq ${id}`, selectOrientation: true }
    )),
  ], [pcrSources]);

  const primerDesignSettings = usePrimerDesignSettings({ homology_length: 35, minimal_hybridization_length: 14, target_tm: 55 });
  return (
    <PrimerDesignProvider
      designType="gibson_assembly"
      sequenceIds={templateSequencesIds}
      primerDesignSettings={primerDesignSettings}
      steps={steps}
    >
      <PrimerDesignForm />
    </PrimerDesignProvider>
  );
}
