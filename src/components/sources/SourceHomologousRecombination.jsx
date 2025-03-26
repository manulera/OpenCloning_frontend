import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl, InputAdornment, TextField } from '@mui/material';
import { isEqual } from 'lodash-es';
import SingleInputSelector from './SingleInputSelector';
import { cloningActions } from '../../store/cloning';
import { getInputSequencesFromSourceId } from '../../store/cloning_utils';
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';
import SelectPrimerForm from '../primers/SelectPrimerForm';

// A component representing the ligation of several fragments
function SourceHomologousRecombination({ source, requestStatus, sendPostRequest }) {
  const isCrispr = source.type === 'CRISPRSource';
  const { id: sourceId, input: inputSequenceIds } = source;
  const inputSequences = useSelector((state) => getInputSequencesFromSourceId(state, sourceId), isEqual);
  const inputsAreNotTemplates = inputSequences.every((sequence) => sequence.type !== 'TemplateSequence');
  const [template, setTemplate] = React.useState(inputSequenceIds.length > 0 ? inputSequenceIds[0] : null);
  const [insert, setInsert] = React.useState(inputSequenceIds.length > 1 ? inputSequenceIds[1] : null);
  const [selectedPrimers, setSelectedPrimers] = React.useState([]);
  const { updateSource } = cloningActions;
  const dispatch = useDispatch();

  const primers = useSelector((state) => state.cloning.primers, isEqual);

  const allowSubmit = (template !== null && insert !== null) && (isCrispr ? selectedPrimers.length > 0 : true) && inputsAreNotTemplates;
  const minimalHomologyRef = React.useRef(null);
  const onSubmit = (event) => {
    event.preventDefault();
    const requestData = {
      source: { id: sourceId, input: inputSequenceIds, output_name: source.output_name },
      sequences: inputSequences,
    };
    const config = { params: { minimal_homology: minimalHomologyRef.current.value } };
    if (isCrispr) {
      requestData.guides = selectedPrimers.map((primerId) => primers.find((p) => p.id === primerId));
      requestData.source.guides = selectedPrimers;
      sendPostRequest({ endpoint: 'crispr', requestData, config, source });
    } else {
      sendPostRequest({ endpoint: 'homologous_recombination', requestData, config, source });
    }
  };

  const onTemplateChange = (event) => {
    setTemplate(Number(event.target.value));
    const newInput = [Number(event.target.value)];
    if (insert) {
      newInput.push(insert);
    }
    dispatch(updateSource({ id: sourceId, input: newInput }));
  };

  const onInsertChange = (event) => {
    if (event.target.value === '') {
      setInsert(null);
      dispatch(updateSource({ id: sourceId, input: [template] }));
    } else {
      setInsert(Number(event.target.value));
      dispatch(updateSource({ id: sourceId, input: [template, Number(event.target.value)] }));
    }
  };

  return (
    <div className="homologous-recombination">
      <form onSubmit={onSubmit}>
        <FormControl fullWidth>
          <SingleInputSelector
            label="Template sequence"
            {...{ selectedId: template,
              onChange: onTemplateChange,
              inputSequenceIds: [...new Set(inputSequenceIds)].filter(
                (id) => id !== insert,
              ) }}
          />
        </FormControl>
        <FormControl fullWidth>
          <SingleInputSelector
            label="Insert sequence"
            allowUnset
            {...{ selectedId: insert,
              onChange: onInsertChange,
              inputSequenceIds: [...new Set(inputSequenceIds)].filter(
                (id) => id !== template,
              ) }}
          />
        </FormControl>
        <FormControl fullWidth>
          <TextField
            label="Minimal homology length"
            inputRef={minimalHomologyRef}
            type="number"
            defaultValue={40}
            InputProps={{
              endAdornment: <InputAdornment position="end">bp</InputAdornment>,
              sx: { '& input': { textAlign: 'center' } },
            }}
          />
        </FormControl>
        {isCrispr && (
          <SelectPrimerForm
            primers={primers}
            selected={selectedPrimers}
            onChange={setSelectedPrimers}
            label="Select gRNAs (from primers)"
            multiple
          />
        )}
        { allowSubmit && (
        <SubmitButtonBackendAPI requestStatus={requestStatus} color="primary">
          {isCrispr ? 'Perform CRISPR' : 'Recombine'}
        </SubmitButtonBackendAPI>
        )}
      </form>
    </div>
  );
}

export default SourceHomologousRecombination;
