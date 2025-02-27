import React from 'react';
import Box from '@mui/material/Box';
import PrimerDesignStepper from './PrimerDesignStepper';
import TabPanelSelectRoi from './TabPanelSelectRoi';
import TabPannelSettings from './TabPannelSettings';
import TabPanelResults from './TabPanelResults';
import { usePrimerDesign } from './PrimerDesignContext';
import TabPanelEBICSettings from './TabPanelEBICSettings';

function PrimerDesignForm() {
  const { steps, sequenceIds, designType } = usePrimerDesign();
  return (
    <Box>
      <PrimerDesignStepper />
      {steps.slice(0, sequenceIds.length).map((step, index) => (
        <TabPanelSelectRoi
          key={step.label}
          step={step}
          index={index}
        />
      ))}
      {designType !== 'ebic' && <TabPannelSettings />}
      {designType === 'ebic' && <TabPanelEBICSettings />}
      <TabPanelResults />
    </Box>
  );
}

export default PrimerDesignForm;
