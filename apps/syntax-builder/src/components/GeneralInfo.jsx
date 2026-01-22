import React from 'react'
import { useFormData } from '../context/FormDataContext';
import { Autocomplete, TextField } from '@mui/material';
import { aliasedEnzymesByName } from '@teselagen/sequence-utils';
import SectionWrapper from './SectionWrapper';

const INPUT_MIN_LENGTH = 3;

const enzymeOptions = Object.values(aliasedEnzymesByName).map((e) => e.name);

function GeneralInfo() {
  const { enzyme, setEnzyme } = useFormData();
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
    <SectionWrapper title="General Info">
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
        sx={{ mt: 2, maxWidth: 300 }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Assembly enzyme"
            fullWidth
          />
        )}
      />
    </SectionWrapper>
  )
}

export default GeneralInfo
