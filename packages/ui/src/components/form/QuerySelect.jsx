import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Autocomplete, TextField, FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material';
import QueryStatusWrapper from './QueryStatusWrapper';

export default function QuerySelect({
  query,
  label,
  loadingMessage = 'Loading...',
  errorMessage = 'Could not load options',
  onChange,
  multiple = true,
  autoComplete = true,
  getOptionLabel,
  getOptionKey = getOptionLabel,
  autocompleteProps = {},
  inputProps = {},
  ...rest
}) {
  const queryResult = useQuery(query);
  const { data: options = [] } = queryResult;
  const [inputValue, setInputValue] = React.useState('');

  return (
    <QueryStatusWrapper renderIfLoading={true} queryResult={queryResult} loadingMessage={loadingMessage} errorMessage={errorMessage}>
      <FormControl {...rest}>
        {autoComplete ? (
          <Autocomplete
            multiple={multiple}
            onChange={(event, value) => { onChange(value); }}
            id="tags-standard"
            options={options}
            getOptionLabel={getOptionLabel}
            getOptionKey={getOptionKey}
            defaultValue={multiple ? [] : ''}
            forcePopupIcon
            inputValue={inputValue}
            onInputChange={(event, newInputValue, reason) => {
              if (reason === 'reset') return;
              setInputValue(newInputValue);
            }}
            {...autocompleteProps}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                {...inputProps}
              />
            )}
          />
        ) : (
          <>
            <InputLabel id={`select-${label.replaceAll(' ', '-')}`}>{label}</InputLabel>
            <Select
              multiple={multiple}
              onChange={(event) => { onChange(event.target.value, options); }}
              label={label}
              defaultValue={multiple ? [] : ''}
              error={options.length === 0}
              inputProps={inputProps}
            >
              {options.map((option) => (
                <MenuItem key={getOptionLabel(option)} value={getOptionLabel(option)}>
                  {getOptionLabel(option)}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>{autocompleteProps.noOptionsText || ''}</FormHelperText>
          </>
        )}
      </FormControl>
    </QueryStatusWrapper>
  );
}
