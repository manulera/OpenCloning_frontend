import React from 'react';
import { Alert, Box, FormControl, FormLabel, InputAdornment, TextField } from '@mui/material';
import TabPanel from '../../../navigation/TabPanel';
import { usePrimerDesign } from './PrimerDesignContext';
import StepNavigation from './StepNavigation';

function TabPanelEBICSettings() {
  const { error, selectedTab, sequenceIds, primers, submissionPreventedMessage, designPrimers, primerDesignSettings } = usePrimerDesign();
  const { max_inside, max_outside, updateSettings } = primerDesignSettings;

  return (
    <TabPanel value={selectedTab} index={sequenceIds.length}>
      <Box sx={{ width: '80%', margin: 'auto' }}>
        <Box sx={{ pt: 1 }}>
          <FormLabel>Primer settings</FormLabel>
          <Box sx={{ pt: 1.5 }}>

            <FormControl sx={{ mr: 2 }}>
              <TextField
                label="Max inside"
                value={max_inside}
                onChange={(e) => { updateSettings({ max_inside: Number(e.target.value) }); }}
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">bp</InputAdornment>,
                  sx: { width: '10em' },
                }}
                error={max_inside < 0}
                helperText={max_inside < 0 ? 'Max inside must be greater than 0' : ''}
              />
            </FormControl>

            <FormControl sx={{ mr: 2 }}>
              <TextField
                label="Max outside"
                value={max_outside}
                onChange={(e) => { updateSettings({ max_outside: Number(e.target.value) }); }}
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">bp</InputAdornment>,
                  sx: { width: '10em' },
                }}
                error={max_outside < 0}
                helperText={max_outside < 0 ? 'Max outside must be greater than 0' : ''}
              />
            </FormControl>
          </Box>
        </Box>
      </Box>
      {error && <Alert severity="error" sx={{ width: 'fit-content', margin: 'auto', mt: 2 }}>{error}</Alert>}
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

export default TabPanelEBICSettings;
