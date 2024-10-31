import React from 'react';
import FormHelperText from '@mui/material/FormHelperText';
import { Alert, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select } from '@mui/material';
import { useDispatch } from 'react-redux';
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';
import { addHistory } from '../../utils/readNwrite';
import useBackendRoute from '../../hooks/useBackendRoute';

// A component providing an interface to import a file
function SourceFile({ source, requestStatus, sendPostRequest }) {
  const [circularize, setCircularize] = React.useState(false);
  const [fileFormat, setFileFormat] = React.useState('');
  // Error message for json only
  const [errorMessage, setErrorMessage] = React.useState('');
  const dispatch = useDispatch();
  const backendRoute = useBackendRoute();
  const onChange = async (event) => {
    setErrorMessage('');
    const files = Array.from(event.target.files);
    if (fileFormat === 'json' || (fileFormat === '' && files[0].name.endsWith('.json'))) {
      let loadedHistory = null;
      try {
        loadedHistory = JSON.parse(await files[0].text());
      } catch (error) {
        setErrorMessage('Invalid JSON');
        return;
      }
      addHistory(loadedHistory, dispatch, setErrorMessage, backendRoute('validate'), source.id);
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
        </Select>
      </FormControl>
      { (fileFormat === 'fasta' || fileFormat === '') && (
        <FormControl fullWidth>
          <FormControlLabel control={<Checkbox checked={circularize} onChange={() => setCircularize(!circularize)} />} label="Circularize (FASTA only)" />
        </FormControl>
      )}
      {errorMessage && (<Alert sx={{ marginTop: '10px' }} severity="error">{errorMessage}</Alert>)}
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
