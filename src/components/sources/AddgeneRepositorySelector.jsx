import React from 'react';
import { FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';
import GetRequestMultiSelect from '../form/GetRequestMultiSelect';
import useHttpClient from '../../hooks/useHttpClient';

export default function AddgeneRepositorySelector({ inputValue, setInputValue, helperText, error, sourceId }) {
  const httpClient = useHttpClient();
  const [mode, setMode] = React.useState('id'); // 'id' | 'search'
  const [query, setQuery] = React.useState('');
  const [url, setUrl] = React.useState('');

  const requestHeaders = (function () {
    const token = import.meta.env.VITE_ADDGENE_API_TOKEN || import.meta.env.VITE_ADDGENE_TOKEN;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }());

  return (
    <>
      <FormControl fullWidth sx={{ mb: 1 }}>
        <FormLabel id={`addgene-mode-${sourceId}`}>Addgene Input Mode</FormLabel>
        <RadioGroup
          row
          aria-labelledby={`addgene-mode-${sourceId}`}
          name={`addgene-mode-${sourceId}`}
          value={mode}
          onChange={(e) => { setMode(e.target.value); setInputValue(''); }}
        >
          <FormControlLabel value="id" control={<Radio />} label="Enter ID" />
          <FormControlLabel value="search" control={<Radio />} label="Search by name" />
        </RadioGroup>
      </FormControl>
      {mode === 'id' && (
        <FormControl fullWidth>
          <TextField
            label="Addgene ID"
            id={`repository-id-${sourceId}`}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            helperText={helperText}
            error={error !== ''}
          />
        </FormControl>
      )}
      {mode === 'search' && (
        <GetRequestMultiSelect
          key={url || 'empty'}
          multiple={false}
          autoComplete
          httpClient={httpClient}
          url={url}
          label="Search Addgene plasmids"
          messages={{ loadingMessage: query && query.length >= 3 ? 'Searching Addgene…' : 'Type at least 3 characters', errorMessage: 'Failed to search Addgene' }}
          requestHeaders={requestHeaders}
          getOptionsFromResponse={(data) => {
            const items = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
            return items;
          }}
          getOptionLabel={(o) => {
            const name = o.name || o.plasmid_name || 'Unknown plasmid';
            const id = o.id || o.plasmid_id || '';
            return id ? `${name} (#${id})` : name;
          }}
          onChange={(value) => {
            const v = Array.isArray(value) ? value[0] : value;
            const id = v?.id || v?.plasmid_id;
            if (id) {
              setInputValue(String(id));
            }
          }}
          noOptionsMessage={query && query.length >= 3 ? 'No plasmids found' : 'Type at least 3 characters'}
        />
      )}
      {mode === 'search' && (
        <FormControl fullWidth sx={{ mt: 1 }}>
          <TextField
            label="Search query"
            value={query}
            onChange={(e) => {
              const q = e.target.value;
              setQuery(q);
              if (!q || q.length < 3) {
                setUrl('');
                return;
              }
              const params = new URLSearchParams();
              params.set('search', q);
              params.set('per_page', '25');
              setUrl(`https://api.addgene.org/v1/catalog/plasmid?${params.toString()}`);
            }}
            helperText="Type at least 3 characters"
          />
        </FormControl>
      )}
    </>
  );
}


