import React from 'react';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ClearIcon from '@mui/icons-material/Clear';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { Alert, Autocomplete, Table, TableBody, TableCell, TableRow } from '@mui/material';
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';
import RequestStatusWrapper from '../form/RequestStatusWrapper';
import getHttpClient from '../../utils/getHttpClient';

const httpClient = getHttpClient();

function validateRepositoryId(repositoryId, repository) {
  switch (repository) {
    case 'addgene':
      if (!repositoryId.match(/^\d+/)) {
        return 'Addgene IDs must be numbers (e.g. 39296)';
      }
      break;
    case 'benchling':
      if (!repositoryId.match(/^https:\/\/benchling\.com\/.+\/edit$/)) {
        return 'Use a Benchling URL like https://benchling.com/siverson/f/lib_B94YxDHhQh-cidar-moclo-library/seq_dh1FrJTc-b0015_dh/edit';
      }
      break;
    case 'euroscarf':
      if (!repositoryId.match(/^P\d+$/)) {
        return 'Euroscarf IDs must be P followed by numbers (e.g. P30174)';
      }
      break;
    case 'wekwikgene':
      if (!repositoryId.match(/^\d+$/)) {
        return 'WeKwikGene IDs must be numbers (e.g. 0000304)';
      }
      break;
    default:
      break;
  }
  return '';
}

const exampleIds = {
  addgene: '39296',
  genbank: 'NM_001018957.2',
  benchling: '',
  euroscarf: 'P30174',
  wekwikgene: '0000304',
};

const inputLabels = {
  addgene: 'Addgene ID',
  genbank: 'GenBank ID',
  benchling: 'Benchling URL',
  euroscarf: 'Euroscarf ID',
  wekwikgene: 'WeKwikGene ID',
};

const snapgeneCheckOption = (option, inputValue) => option.name.toLowerCase().includes(inputValue.toLowerCase());
const snapgeneFormatOption = (option, plasmidSet, plasmidSetName) => ({ name: option.name, path: `${plasmidSet}/${option.subpath}`, plasmidSetName, plasmidSet });
const snapgeneGetOptions = (data, inputValue) => Object.entries(data)
  .flatMap(([plasmidSet, category]) => category.plasmids
    .filter((option) => snapgeneCheckOption(option, inputValue))
    .map((option) => snapgeneFormatOption(option, plasmidSet, data[plasmidSet].name)));
function SnapgeneSuccessComponent({ option }) {
  return (
    <Alert severity="info" sx={{ mb: 1 }}>
      Plasmid
      {' '}
      <a href={`https://www.snapgene.com/plasmids/${option.path}`} target="_blank" rel="noopener noreferrer">{option.name}</a>
      {' '}
      from set
      {' '}
      <a href={`https://www.snapgene.com/plasmids/${option.plasmidSet}`} target="_blank" rel="noopener noreferrer">{option.plasmidSetName}</a>
    </Alert>
  );
}

const iGEMGetOptions = (plasmids, inputValue) => plasmids.map((p) => ({
  name: `${p['Short Desc / Name']} / ${p['Part Name']} / ${p['Plasmid Backbone']}`,
  url: `https://assets.opencloning.org/annotated-igem-distribution/results/plasmids/${p['Index ID']}.gb`,
  table_name: p['Short Desc / Name'],
  part_name: p['Part Name'],
  part_url: p['Part URL'],
  backbone: p['Plasmid Backbone'],
})).filter((p) => p.name.toLowerCase().includes(inputValue.toLowerCase()));

function iGEMSuccessComponent({ option }) {
  return (
    <Alert severity="info" sx={{ mb: 1 }}>
      {'Plasmid '}
      <a href={option.url} target="_blank" rel="noopener noreferrer">{option.table_name}</a>
      {' containing part '}
      <a href={option.part_url} target="_blank" rel="noopener noreferrer">{option.part_name}</a>
      {` in backbone ${option.backbone} from `}
      <a href="https://airtable.com/appgWgf6EPX5gpnNU/shrb0c8oYTgpZDRgH/tblNqHsHbNNQP2HCX" target="_blank" rel="noopener noreferrer">2024 iGEM Distribution</a>
    </Alert>
  );
}

const sevaGetOptions = (data, inputValue) => data.map((p) => {
  const info = [p.Resistance, p.ORI, p.Cargo, p.Gadget, p.FunctionType].filter((i) => i !== '').join('/');
  return {
    name: `${p.Name} (${info})`,
    plasmid_name: p.Name,
    data: p,
  };
}).filter((p) => p.name.toLowerCase().includes(inputValue.toLowerCase()));

function SEVASuccessComponent({ option }) {
  return (
    <Alert severity="info" sx={{ mb: 1 }} icon={false}>
      <Table size="small">
        <TableBody>
          {Object.entries(option.data)
            .filter(([key]) => ['Name', 'Resistance', 'ORI', 'Cargo', 'Gadget', 'FunctionType'].includes(key))
            .map(([key, value]) => (
              <TableRow key={key}>
                <TableCell>{key}</TableCell>
                <TableCell>{value || 'N/A'}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </Alert>
  );
}

const openDNACollectionsGetOptions = (data, inputValue, groupedBy) => data.map((p) => ({
  name: `${p.id}` + (p.plasmid_name ? ` - ${p.plasmid_name}` : ''),
  plasmid_name: p.plasmid_name,
  plasmid_id: p.id,
  collection: p.collection,
  url: `https://assets.opencloning.org/open-dna-collections/${p.path}`,
})).filter((p) => p.name.toLowerCase().includes(inputValue.toLowerCase()) && (groupedBy ? p.collection === groupedBy : true));

function OpenDNACollectionsSuccessComponent({ option }) {
  return (
    <Alert severity="info" sx={{ mb: 1 }}>
      Plasmid <a href={option.url} target="_blank" rel="noopener noreferrer">{option.name}</a> {' '}
      from collection <a href={`https://github.com/Reclone-org/open-dna-collections/tree/main/${option.collection}`} target="_blank" rel="noopener noreferrer">{option.collection}</a>
    </Alert>
  );
}

function IndexJsonSelector({
  url,
  setInputValue,
  getOptions,
  noOptionsText,
  inputLabel,
  SuccessComponent,
  responseProcessCallback = (resp) => resp.data,
  requiredInput = 3,
  groupField = null, // You can pass the name of the field to group by
}) {
  const [userInput, setUserInput] = React.useState('');
  const [data, setData] = React.useState(null);
  const [options, setOptions] = React.useState([]);
  const [requestStatus, setRequestStatus] = React.useState({ status: 'loading' });
  const [retry, setRetry] = React.useState(0);
  const [groups, setGroups] = React.useState([]);
  const [groupedBy, setGroupedBy] = React.useState(null);

  React.useEffect(() => {
    const fetchOptions = async () => {
      setRequestStatus({ status: 'loading' });
      try {
        const resp = await httpClient.get(url);
        setData(responseProcessCallback(resp));
        if (requiredInput === 0) {
          setOptions(getOptions(resp.data, ''));
        }
        if (groupField) {
          setGroups([...new Set(resp.data.map((p) => p[groupField]))].sort());
        }
        setRequestStatus({ status: 'success' });
      } catch (error) {
        setRequestStatus({ status: 'error', message: error.message });
      }
    };
    fetchOptions();
  }, [retry]);

  const onInputChange = (newInputValue) => {
    if (newInputValue === undefined) {
      // When clearing the input via x button
      setUserInput('');
      if (requiredInput === 0) {
        setOptions(getOptions(data, '', groupedBy));
      } else {
        setOptions([]);
      }
      return;
    }
    setUserInput(newInputValue);
    if (newInputValue.length < requiredInput) {
      setOptions([]);
      return;
    }

    setOptions(getOptions(data, newInputValue, groupedBy));
  };

  const onGroupChange = (newGroup) => {
    setUserInput('');
    setInputValue('')
    setGroupedBy(newGroup);
    setOptions(getOptions(data, '', newGroup))
  };

  const selectedOption = options.find((option) => option.name === userInput);
  console.log(selectedOption);
  return (
    <RequestStatusWrapper requestStatus={requestStatus} retry={() => setRetry(retry + 1)}>
      {groupField && (
        <FormControl fullWidth>
          <InputLabel>{groupField.charAt(0).toUpperCase() + groupField.slice(1).replace(/([A-Z])/g, ' $1')}</InputLabel>
          <Select
            endAdornment={groupedBy && (<InputAdornment position="end"><IconButton onClick={() => onGroupChange(null)}><ClearIcon /></IconButton></InputAdornment>)}
            value={groupedBy}
            onChange={(e) => onGroupChange(e.target.value)}
            // Capitalize the first letter and add a space before each capital letter
            label={groupField.charAt(0).toUpperCase() + groupField.slice(1).replace(/([A-Z])/g, ' $1')}
          >
            {groups.map((group) => (
              <MenuItem value={group}>{group}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <FormControl fullWidth>
        <Autocomplete
          onChange={(event, value) => {
            onInputChange(value?.name);
            if (value) {
              setInputValue(value);
            } else {
              setInputValue('');
            }
          }}
          // Change options only when input changes (not when an option is picked)
          onInputChange={(event, newInputValue, reason) => (reason === 'input') && onInputChange(newInputValue)}
          id="tags-standard"
          options={options}
          noOptionsText={userInput.length < requiredInput ? noOptionsText : 'Nothing found'}
          getOptionLabel={(o) => o.name}
          isOptionEqualToValue={(o1, o2) => o1.subpath === o2.subpath}
          inputValue={userInput}
          renderInput={(params) => (
            <TextField
              {...params}
              label={inputLabel}
            />
          )}
        />
      </FormControl>
      {selectedOption && <SuccessComponent option={selectedOption} />}
    </RequestStatusWrapper>
  );
}

// A component providing an interface for the user to type a repository ID
// and get a sequence
function SourceRepositoryId({ source, requestStatus, sendPostRequest }) {
  const { id: sourceId } = source;
  const [inputValue, setInputValue] = React.useState('');
  const [selectedRepository, setSelectedRepository] = React.useState(source.repository_name || '');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    setSelectedRepository(source.repository_name || '');
  }, [source.repository_name]);

  React.useEffect(() => {
    setInputValue('');
    setError('');
  }, [selectedRepository]);

  React.useEffect(() => {
    if (inputValue) {
      setError(validateRepositoryId(inputValue, selectedRepository));
    } else {
      setError('');
    }
  }, [inputValue]);

  const onSubmit = (event) => {
    event.preventDefault();
    const extra = { repository_id: inputValue };
    if (selectedRepository === 'benchling') {
      // Remove /edit from the end of the URL and add .gb
      extra.repository_id = inputValue.replace(/\/edit$/, '.gb');
    }
    if (selectedRepository === 'snapgene') {
      extra.repository_id = inputValue.path;
    }
    if (selectedRepository === 'igem') {
      extra.repository_id = `${inputValue.part_name}-${inputValue.backbone}`;
      extra.sequence_file_url = inputValue.url;
    }
    if (selectedRepository === 'seva') {
      extra.repository_id = inputValue.plasmid_name;
      extra.sequence_file_url = inputValue.data.GenBank_link;
    }
    if (selectedRepository === 'open_dna_collections') {
      extra.repository_id = inputValue.collection + '/' + inputValue.plasmid_id;
      extra.sequence_file_url = inputValue.url.replace(/ /g, '%20');
    }
    const requestData = { id: sourceId, ...extra, repository_name: selectedRepository };
    sendPostRequest({ endpoint: `repository_id/${selectedRepository}`, requestData, source });
  };
  const helperText = error || (exampleIds[selectedRepository] && `Example: ${exampleIds[selectedRepository]}`);
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
          <MenuItem value="addgene">Addgene</MenuItem>
          <MenuItem value="benchling">Benchling</MenuItem>
          <MenuItem value="euroscarf">Euroscarf</MenuItem>
          <MenuItem value="genbank">GenBank</MenuItem>
          <MenuItem value="igem">iGEM</MenuItem>
          <MenuItem value="open_dna_collections">Open DNA Collections</MenuItem>
          <MenuItem value="seva">SEVA Plasmids</MenuItem>
          <MenuItem value="snapgene">SnapGene</MenuItem>
          <MenuItem value="wekwikgene">WeKwikGene</MenuItem>
        </Select>
      </FormControl>
      {selectedRepository !== '' && (
        <form onSubmit={onSubmit}>
          {selectedRepository !== 'snapgene' && selectedRepository !== 'igem' && selectedRepository !== 'seva' && selectedRepository !== 'open_dna_collections' && (
            <>
              <FormControl fullWidth>
                <TextField
                  label={inputLabels[selectedRepository]}
                  id={`repository-id-${sourceId}`}
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  helperText={helperText}
                  error={error !== ''}
                />
              </FormControl>
              {/* Extra info for benchling case */}
              {selectedRepository === 'benchling' && (
                <Alert severity="info" sx={{ mb: 1 }}>
                  The sequence must be publicly accessible. Use the URL from a sequence editor page (ending in &quot;/edit&quot;), like
                  {' '}
                  <a target="_blank" rel="noopener noreferrer" href="https://benchling.com/siverson/f/lib_B94YxDHhQh-cidar-moclo-library/seq_dh1FrJTc-b0015_dh/edit">this example</a>
                  .
                </Alert>
              )}
            </>
          )}
          {selectedRepository === 'snapgene'
            && (
              <IndexJsonSelector
                url="https://assets.opencloning.org/SnapGene_crawler/index.json"
                setInputValue={setInputValue}
                getOptions={snapgeneGetOptions}
                noOptionsText="Type at least 3 characters to search, see SnapGene plasmids for options"
                inputLabel="Plasmid name"
                SuccessComponent={SnapgeneSuccessComponent}
                requiredInput={3}
              />
            )}
          {selectedRepository === 'igem' && (
            <IndexJsonSelector
              url="https://assets.opencloning.org/annotated-igem-distribution/results/index.json"
              setInputValue={setInputValue}
              getOptions={iGEMGetOptions}
              noOptionsText=""
              inputLabel="Plasmid name"
              SuccessComponent={iGEMSuccessComponent}
              requiredInput={0}
            />
          )}
          {selectedRepository === 'seva' && (
            <IndexJsonSelector
              url="https://assets.opencloning.org/seva_plasmids_index/index.json"
              setInputValue={setInputValue}
              getOptions={sevaGetOptions}
              noOptionsText="Type at least 3 characters to search"
              inputLabel="Plasmid name"
              SuccessComponent={SEVASuccessComponent}
              requiredInput={3}
            />
          )}
          {selectedRepository === 'open_dna_collections' && (
            <IndexJsonSelector
              url="https://assets.opencloning.org/open-dna-collections/scripts/index.json"
              setInputValue={setInputValue}
              getOptions={openDNACollectionsGetOptions}
              noOptionsText=""
              inputLabel="Plasmid name"
              SuccessComponent={OpenDNACollectionsSuccessComponent}
              requiredInput={0}
              groupField="collection"
            />
          )}
          {inputValue && !error && (<SubmitButtonBackendAPI requestStatus={requestStatus}>Submit</SubmitButtonBackendAPI>)}

        </form>
      )}
    </>
  );
}

export default SourceRepositoryId;
