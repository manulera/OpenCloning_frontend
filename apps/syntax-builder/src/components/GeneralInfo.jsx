import React from 'react'
import { useFormData } from '../context/FormDataContext';
import { Paper, Typography, Autocomplete, TextField } from '@mui/material';
import { aliasedEnzymesByName } from '@teselagen/sequence-utils';

const enzymeOptions = Object.values(aliasedEnzymesByName).map((e) => e.name);

function GeneralInfo() {
  const { enzyme, setEnzyme } = useFormData();
  const [inputValue, setInputValue] = React.useState(enzyme);

  // Filter options based on input (require at least 2 characters)
  const filteredOptions = React.useMemo(() => {
    if (inputValue.length < 3) {
      return [];
    }
    const lowerInput = inputValue.toLowerCase();
    return enzymeOptions.filter((option) =>
      option.toLowerCase().includes(lowerInput)
    );
  }, [inputValue]);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">General Info</Typography>
      <Autocomplete
        value={enzyme || null}
        onChange={(event, newValue) => {
          setEnzyme(newValue || '');
        }}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        inputValue={inputValue}
        options={filteredOptions}
        getOptionLabel={(option) => option}
        isOptionEqualToValue={(option, value) => option === value}
        noOptionsText={inputValue.length < 2 ? 'Type at least 2 characters to search' : 'No options found'}
        sx={{ mt: 2, maxWidth: 300 }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Assembly enzyme"
            fullWidth
          />
        )}
      />
    </Paper>
  )
}

export default GeneralInfo
