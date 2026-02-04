import React from 'react'
import { Autocomplete, TextField } from '@mui/material';
import { aliasedEnzymesByName } from '@teselagen/sequence-utils';

const INPUT_MIN_LENGTH = 3;
const enzymeOptions = Object.values(aliasedEnzymesByName).map((e) => e.name);

function EnzymeInput({ label = 'Enzyme', enzyme, setEnzyme, ...rest }) {
  
  const [inputValue, setInputValue] = React.useState(enzyme);
  
  // Filter options based on input (require at least 2 characters)
  const filteredOptions = React.useMemo(() => {
    if (inputValue.length < INPUT_MIN_LENGTH) {
      return [];
    }
    const lowerInput = inputValue.toLowerCase();
    return enzymeOptions.filter((option) =>
      option.toLowerCase().includes(lowerInput)
    );
  }, [inputValue]);

  return (
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
      noOptionsText={inputValue.length < INPUT_MIN_LENGTH ? `Type at least ${INPUT_MIN_LENGTH} characters to search` : 'No options found'}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          fullWidth
          {...rest}
        />
      )}
    />
  )
}

export default EnzymeInput
