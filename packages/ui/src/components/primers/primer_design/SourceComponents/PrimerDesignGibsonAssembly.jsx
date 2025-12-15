import { Button, FormControl } from '@mui/material';
import React from 'react';
import { batch, useDispatch } from 'react-redux';
import MultipleInputsSelector from '../../../sources/MultipleInputsSelector';
import { cloningActions } from '@opencloning/store/cloning';
import useStoreEditor from '../../../../hooks/useStoreEditor';
import { getPcrTemplateSequenceId } from '@opencloning/store/cloning_utils';

function PrimerDesignGibsonAssembly({ source, assemblyType }) {
  const [targets, setTargets] = React.useState(source.input.map(({ sequence }) => sequence));
  const inputSequenceId = getPcrTemplateSequenceId(source);

  const onInputChange = (newInputSequenceIds) => {
    // Prevent unsetting the input of the source
    if (!newInputSequenceIds.includes(inputSequenceId)) {
      setTargets( (prev) => [...prev, ...newInputSequenceIds]);
    } else {
      setTargets(newInputSequenceIds);
    }
  };

  const { updateStoreEditor } = useStoreEditor();
  const { addPCRsAndSubsequentSourcesForAssembly, setCurrentTab, setMainSequenceId } = cloningActions;
  const dispatch = useDispatch();
  const onSubmit = (event) => {
    event.preventDefault();
    const newSequence = {
      type: 'TemplateSequence',
      primer_design: 'gibson_assembly',
      circular: false,
    };

    batch(() => {
    // Slice from the second on
      const newPCRTemplates = targets.slice(1);
      dispatch(addPCRsAndSubsequentSourcesForAssembly({ sourceId: source.id, newSequence, templateIds: newPCRTemplates, sourceType: assemblyType }));
      dispatch(setMainSequenceId(inputSequenceId));
      updateStoreEditor('mainEditor', inputSequenceId);
      dispatch(setCurrentTab(3));
      // Scroll to the top of the page after 300ms
      setTimeout(() => {
        document.querySelector('.tab-panels-container')?.scrollTo({ top: 0, behavior: 'instant' });
      }, 300);
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <FormControl fullWidth>
        <MultipleInputsSelector
          inputSequenceIds={targets}
          label="Input sequences (in order)"
          onChange={onInputChange}
        />
      </FormControl>

      <Button type="submit" variant="contained" color="success">
        Design primers
      </Button>

    </form>
  );
}

export default PrimerDesignGibsonAssembly;
