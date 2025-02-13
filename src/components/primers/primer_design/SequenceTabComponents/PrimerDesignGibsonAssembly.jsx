import React from 'react';
import { PrimerDesignProvider } from './PrimerDesignContext';
import PrimerDesignForm from './PrimerDesignForm';

export default function PrimerDesignGibsonAssembly({ pcrSources }) {
  const templateSequencesIds = React.useMemo(() => pcrSources.map((pcrSource) => pcrSource.input[0]), [pcrSources]);
  const initialPrimerDesignSettings = { homologyLength: 35, hybridizationLength: 20, targetTm: 55 };
  const steps = React.useMemo(() => [
    ...templateSequencesIds.map((id, index) => (
      { label: `Seq ${id}`, selectOrientation: true }
    )),
  ], [pcrSources]);

  return (
    <PrimerDesignProvider
      designType="gibson_assembly"
      sequenceIds={templateSequencesIds}
      initialPrimerDesignSettings={initialPrimerDesignSettings}
      steps={steps}
    >
      <PrimerDesignForm />
    </PrimerDesignProvider>
  );
}
