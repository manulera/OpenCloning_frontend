import React from 'react';
import FormHelperText from '@mui/material/FormHelperText';
import { Alert, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select } from '@mui/material';
import { useDispatch, batch, useStore } from 'react-redux';
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';
import LabelWithTooltip from '../form/LabelWithTooltip';
import { cloningActions } from '../../store/cloning';
import { loadFilesToSessionStorage, loadHistoryFile } from '../../utils/readNwrite';
import useValidateState from '../../hooks/useValidateState';
import { mergeStates, getGraftEntityId, graftState } from '../../utils/network';

const { deleteSourceAndItsChildren, restoreSource, setState: setCloningState } = cloningActions;

// A component providing an interface to import a file
function SourceFile({ source, requestStatus, sendPostRequest }) {
  const [circularize, setCircularize] = React.useState(false);
  const [fileFormat, setFileFormat] = React.useState('');
  // Error message for json only
  const [alert, setAlert] = React.useState(null);
  const dispatch = useDispatch();
  const validateState = useValidateState();
  const store = useStore();

  const onChange = async (event) => {
    setAlert(null);
    const files = Array.from(event.target.files);
    if (files.length === 0) {
      return;
    }
    event.target.value = null;
    // If the file is a history file, we load it
    if (
      fileFormat === 'json' || fileFormat === 'zip'
      || (fileFormat === '' && (files[0].name.endsWith('.json') || files[0].name.endsWith('.zip')))
    ) {
      // If file format is explicitly set, rename file to match that extension
      if (fileFormat) {
        files[0] = new File([files[0]], files[0].name.replace(/\.[^/.]+$/, `.${fileFormat}`), {
          type: fileFormat === 'json' ? 'application/json' : files[0].type,
        });
      }
      let cloningStrategy;
      let verificationFiles;
      try {
        ({ cloningStrategy, verificationFiles } = await loadHistoryFile(files[0]));
      } catch (e) {
        console.error(e);
        setAlert({ message: e.message, severity: 'error' });
        return;
      }

      const hasOutput = Boolean(source.output);
      const canGraft = getGraftEntityId(cloningStrategy) !== null;
      const graft = hasOutput && canGraft;
      if (hasOutput && !canGraft) {
        setAlert({ message: 'Cannot graft cloning strategy as it does not converge on a single sequence, you can load it on a source without outputs', severity: 'error' });
        return;
      }

      batch(async () => {
        if (!graft) {
          // Replace the source with the new one
          dispatch(deleteSourceAndItsChildren(source.id));
        }
        try {
          const cloningState = store.getState().cloning;
          let mergedState;
          let networkShift;
          if (graft) {
            ({ mergedState, networkShift } = graftState(cloningStrategy, cloningState, source.id));
          } else {
            ({ mergedState, networkShift } = mergeStates(cloningStrategy, cloningState));
          }
          dispatch(setCloningState(mergedState));
          await loadFilesToSessionStorage(verificationFiles, networkShift);
          validateState(cloningStrategy);
        } catch (e) {
          setAlert({ message: e.message, severity: 'error' });
          dispatch(restoreSource({ ...source, type: 'UploadedFileSource' }));
        }
      });
      return;
    }
    const requestData = new FormData();
    requestData.append('file', files[0]);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
      params: { circularize, sequence_file_format: fileFormat || null },
    };
    sendPostRequest({ endpoint: 'read_from_file', requestData, config, source });
  };

  return (
    <form className="submit-sequence-file" onSubmit={(e) => e.preventDefault()}>
      <FormControl fullWidth>
        <InputLabel id="select-file-format" shrink>File format</InputLabel>
        <Select
          labelId="select-file-format"
          id="select-file-format"
          value={fileFormat}
          onChange={(e) => setFileFormat(e.target.value)}
          label="File format"
          displayEmpty
        >
          <MenuItem value="">Guess from extension</MenuItem>
          <MenuItem value="genbank">Genbank / Ape</MenuItem>
          <MenuItem value="fasta">FASTA</MenuItem>
          <MenuItem value="dna">Snapgene</MenuItem>
          <MenuItem value="embl">EMBL</MenuItem>
          <MenuItem value="json">JSON (history file)</MenuItem>
          <MenuItem value="zip">Zip (history folder)</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <FormControlLabel
          control={<Checkbox checked={circularize} onChange={() => setCircularize(!circularize)} />}
          label={<LabelWithTooltip label="Circularize" tooltip="Make the sequence circular (for GenBank or Snapgene files, it will override the topology indicated in the file)" />}
        />
      </FormControl>

      {alert && (<Alert sx={{ marginTop: '10px' }} severity={alert.severity}>{alert.message}</Alert>)}
      <SubmitButtonBackendAPI
        component="label"
        requestStatus={requestStatus}
      >
        Select File
        <input
          type="file"
          hidden
          onChange={onChange}
        />
      </SubmitButtonBackendAPI>
      <FormHelperText>Supports .gb, .dna, .embl, .fasta, .fa, .ape</FormHelperText>
    </form>
  );
}

export default SourceFile;
