import React from 'react';
import { PrimerDesignProvider } from './PrimerDesignContext';
import PrimerDesignForm from './PrimerDesignForm';

export default function PrimerDesignHomologousRecombination({ homologousRecombinationTargetId, pcrSource }) {
  const templateSequenceId = pcrSource.input[0];
  const sequenceIds = React.useMemo(() => [templateSequenceId, homologousRecombinationTargetId], [templateSequenceId, homologousRecombinationTargetId]);
  const initialPrimerDesignSettings = { homologyLength: 80, hybridizationLength: 20, targetTm: 55 };

  const steps = React.useMemo(() => [
    { label: 'Amplified region',
      description: `Select the fragment of sequence ${templateSequenceId} to be amplified in the editor and click "Choose region"`,
      inputLabel: `Amplified region (sequence ${templateSequenceId})` },
    { label: 'Replaced region',
      description: 'Select the single position (insertion) or region (replacement) where recombination will introduce the amplified fragment',
      inputLabel: `Replaced region (sequence ${homologousRecombinationTargetId})`,
      allowSinglePosition: true,
    },
  ], [templateSequenceId, homologousRecombinationTargetId]);

  return (
    <PrimerDesignProvider
      designType="homologous_recombination"
      sequenceIds={sequenceIds}
      initialPrimerDesignSettings={initialPrimerDesignSettings}
      steps={steps}
    >
      <PrimerDesignForm />
    </PrimerDesignProvider>
  );
}
