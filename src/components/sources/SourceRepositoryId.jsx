import React from 'react';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Button } from '@mui/material';
import useBackendAPI from '../../hooks/useBackendAPI';

// A component providing an interface for the user to type a Genbank ID
// and get a sequence
function SourceRepositoryId({ sourceId }) {
  const [selectedRepository, setSelectedRepository] = React.useState('');
  const repositoryIdRef = React.useRef('');

  const { waitingMessage, sendRequest } = useBackendAPI(sourceId);

  const onSubmit = (event) => {
    event.preventDefault();
    sendRequest('repository_id', { repository_id: repositoryIdRef.current.value, repository: selectedRepository });
  };

  return (
    <>
      <FormControl fullWidth>
        <InputLabel id={`select-repository-${sourceId}-label`}>Select repository</InputLabel>
        <Select
          value={selectedRepository}
          onChange={(event) => setSelectedRepository(event.target.value)}
          labelId={`select-repository-${sourceId}-label`}
          label="Select repository"
        >
          <MenuItem value="addgene">AddGene</MenuItem>
          <MenuItem value="genbank">GenBank</MenuItem>
        </Select>
      </FormControl>
      {selectedRepository !== '' && (
      <form onSubmit={onSubmit}>
        <FormControl fullWidth>
          <TextField
            label="ID in repository"
            id={`repository-id-${sourceId}`}
            inputRef={repositoryIdRef}
            helperText={`Example ID: ${(selectedRepository === 'genbank') ? 'NM_001018957.2' : '39282'}`}
          />
        </FormControl>
        <Button fullWidth type="submit" variant="contained">Submit</Button>
      </form>
      )}
      <div className="waiting-message">{waitingMessage}</div>
    </>
  );
}

export default SourceRepositoryId;
