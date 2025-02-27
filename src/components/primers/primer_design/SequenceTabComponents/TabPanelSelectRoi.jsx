import React from 'react';
import { Alert, FormControl, TextField } from '@mui/material';
import { useSelector, useStore } from 'react-redux';

import StepNavigation from './StepNavigation';
import { selectedRegion2String } from '../../../../utils/selectedRegionUtils';
import GatewayRoiSelect from './GatewayRoiSelect';
import TabPanel from '../../../navigation/TabPanel';
import { usePrimerDesign } from './PrimerDesignContext';

function TabPanelSelectRoi({ step, index }) {
  const { selectedTab, rois, handleSelectRegion, sequenceIds, primerDesignSettings, designType } = usePrimerDesign();
  const [error, setError] = React.useState('');
  const editorHasSelection = useSelector((state) => state.cloning.mainSequenceSelection.caretPosition !== undefined);
  const store = useStore();
  const id = sequenceIds[index];
  const {
    description = `Select the fragment of sequence ${id} to be amplified in the editor and click "Choose region"`,
    inputLabel = `Amplified region (sequence ${id})`,
    allowSinglePosition = false,
    stepCompletionToolTip = 'Select a region in the editor',
  } = step;

  const mode = designType === 'gateway_bp' && index === 1 ? 'gateway_bp' : 'editor';
  const allowStepCompletion = (mode === 'editor' && editorHasSelection) || (mode === 'gateway_bp' && primerDesignSettings.knownCombination);
  const onStepCompletion = () => {
    const selectedRegion = store.getState().cloning.mainSequenceSelection;
    setError(handleSelectRegion(index, selectedRegion, allowSinglePosition));
  };

  return (
    <TabPanel value={selectedTab} index={index} className={`select-roi-tab-${index}`}>
      <Alert severity="info">{description}</Alert>
      {error && (<Alert severity="error">{error}</Alert>)}
      {mode === 'editor' && (
      <FormControl sx={{ py: 2 }}>
        <TextField
          label={inputLabel}
          value={selectedRegion2String(rois[index])}
          disabled
        />
      </FormControl>
      )}
      {mode === 'gateway_bp' && (
        <GatewayRoiSelect id={id} />
      )}
      <StepNavigation
        isFirstStep={index === 0}
        nextDisabled={(index === sequenceIds.length - 1) && rois.some((region) => region === null)}
        nextToolTip="You must select all regions before proceeding"
        allowStepCompletion={allowStepCompletion}
        stepCompletionText="Choose region"
        stepCompletionToolTip={stepCompletionToolTip}
        onStepCompletion={onStepCompletion}
      />

    </TabPanel>
  );
}

export default TabPanelSelectRoi;
