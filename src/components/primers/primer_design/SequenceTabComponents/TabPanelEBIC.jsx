import React from 'react';
import { Box } from '@mui/material';
import TabPanel from '../../../navigation/TabPanel';
import { usePrimerDesign } from './PrimerDesignContext';
import StepNavigation from './StepNavigation';

function TabPanelEBIC() {
  const { selectedTab, sequenceIds, primers, submissionPreventedMessage, designPrimers } = usePrimerDesign();
  return (
    <TabPanel value={selectedTab} index={sequenceIds.length}>
      <Box sx={{ width: '80%', margin: 'auto' }}>
        <div>TabPanelEBIC</div>
      </Box>
      <StepNavigation
        onStepCompletion={designPrimers}
        stepCompletionText="Design primers"
        nextDisabled={primers.length === 0}
        stepCompletionToolTip={submissionPreventedMessage}
        allowStepCompletion={submissionPreventedMessage === ''}
      />
    </TabPanel>
  );
}

export default TabPanelEBIC;
