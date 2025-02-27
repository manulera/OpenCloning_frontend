import React from 'react';
import { PrimerDesignProvider } from './PrimerDesignContext';
import PrimerDesignForm from './PrimerDesignForm';
import usePrimerDesignSettings from './usePrimerDesignSettings';

export default function PrimerDesignGibsonAssembly({ pcrSources }) {
  const templateSequencesIds = React.useMemo(() => pcrSources.map((pcrSource) => pcrSource.input[0]), [pcrSources]);
  const steps = React.useMemo(() => [
    ...templateSequencesIds.map((id, index) => (
      { label: `Seq ${id}`, selectOrientation: true }
    )),
  ], [pcrSources]);

  const primerDesignSettings = usePrimerDesignSettings({ homology_length: 35, minimal_hybridization_length: 20, target_tm: 55 });
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
