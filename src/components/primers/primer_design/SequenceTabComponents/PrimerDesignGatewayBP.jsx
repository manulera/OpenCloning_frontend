import React from 'react';
import { PrimerDesignProvider } from './PrimerDesignContext';
import PrimerDesignForm from './PrimerDesignForm';

function PrimerDesignGatewayBP({ donorVectorId, pcrSource }) {
  const templateSequenceId = pcrSource.input[0];
  const sequenceIds = React.useMemo(() => [templateSequenceId, donorVectorId], [templateSequenceId, donorVectorId]);
  const initialPrimerDesignSettings = { homologyLength: null, hybridizationLength: 20, targetTm: 55 };
  const steps = React.useMemo(() => [
    { label: 'Amplified region',
      description: `Select the fragment of sequence ${templateSequenceId} to be amplified in the editor and click "Choose region"`,
      inputLabel: `Amplified region (sequence ${templateSequenceId})` },
    { label: 'Replaced region',
      description: 'Select attP sites between which the PCR product will be inserted',
      inputLabel: `Replaced region (sequence ${donorVectorId})`,
      stepCompletionToolTip: 'Select a valid combination of attP sites',
    },
  ], [templateSequenceId, donorVectorId]);

  return (
    <PrimerDesignProvider
      designType="gateway_bp"
      sequenceIds={sequenceIds}
      initialPrimerDesignSettings={initialPrimerDesignSettings}
      steps={steps}
    >
      <PrimerDesignForm />
    </PrimerDesignProvider>
  );
}

export default PrimerDesignGatewayBP;
