import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormControl, InputAdornment, TextField } from '@mui/material';
import { isEqual } from 'lodash-es';
import SingleInputSelector from './SingleInputSelector';
import { cloningActions } from '../../store/cloning';
import { getInputEntitiesFromSourceId } from '../../store/cloning_utils';
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';
import MultiplePrimerSelector from '../primers/MultiplePrimerSelector';

// A component representing the ligation of several fragments
function SourceHomologousRecombination({ source, requestStatus, sendPostRequest }) {
  const isCrispr = source.type === 'CRISPRSource';
  const { id: sourceId, input: inputEntityIds } = source;
  const inputEntities = useSelector((state) => getInputEntitiesFromSourceId(state, sourceId), isEqual);
  const inputsAreNotTemplates = inputEntities.every((entity) => entity.type !== 'TemplateSequence');
  const [template, setTemplate] = React.useState(inputEntityIds.length > 0 ? inputEntityIds[0] : null);
  const [insert, setInsert] = React.useState(inputEntityIds.length > 1 ? inputEntityIds[1] : null);
  const [selectedPrimers, setSelectedPrimers] = React.useState([]);
  const { updateSource } = cloningActions;
  const dispatch = useDispatch();

  const allowSubmit = (template !== null && insert !== null) && (isCrispr ? selectedPrimers.length > 0 : true) && inputsAreNotTemplates;
  const minimalHomologyRef = React.useRef(null);
  const onSubmit = (event) => {
    event.preventDefault();
    const requestData = {
      source: { id: sourceId, input: inputEntityIds, output_name: source.output_name },
      sequences: inputEntities,
    };
    const config = { params: { minimal_homology: minimalHomologyRef.current.value } };
    if (isCrispr) {
      requestData.guides = selectedPrimers;
      requestData.source.guides = selectedPrimers.map((p) => p.id);
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
              inputEntityIds: [...new Set(inputEntityIds)].filter(
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
              inputEntityIds: [...new Set(inputEntityIds)].filter(
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
        {isCrispr && (<MultiplePrimerSelector {...{ onChange: setSelectedPrimers, label: 'Select gRNAs (from primers)' }} />)}
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
