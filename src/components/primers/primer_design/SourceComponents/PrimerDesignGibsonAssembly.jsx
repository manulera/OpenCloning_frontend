import { Button, FormControl } from '@mui/material';
import React from 'react';
import { batch, useDispatch } from 'react-redux';
import MultipleInputsSelector from '../../../sources/MultipleInputsSelector';
import { cloningActions } from '../../../../store/cloning';
import useStoreEditor from '../../../../hooks/useStoreEditor';

function PrimerDesignGibsonAssembly({ source, assemblyType }) {
  const [targets, setTargets] = React.useState(source.input);

  const onInputChange = (newInput) => {
    // Prevent unsetting the input of the source
    if (!newInput.includes(source.input[0])) {
      setTargets(source.input.concat(newInput));
    } else {
      setTargets(newInput);
    }
  };

  const { updateStoreEditor } = useStoreEditor();
  const { addPCRsAndSubsequentSourcesForAssembly, setCurrentTab, setMainSequenceId } = cloningActions;
  const dispatch = useDispatch();
  const onSubmit = (event) => {
    event.preventDefault();
    const newEntity = {
      type: 'TemplateSequence',
      primer_design: 'gibson_assembly',
      circular: false,
    };

    batch(() => {
    // Slice from the second on
      const newPCRTemplates = targets.slice(1);
      dispatch(addPCRsAndSubsequentSourcesForAssembly({ sourceId: source.id, newEntity, templateIds: newPCRTemplates, sourceType: assemblyType }));
      dispatch(setMainSequenceId(source.input[0]));
      updateStoreEditor('mainEditor', source.input[0]);
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
          inputEntityIds={targets}
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
