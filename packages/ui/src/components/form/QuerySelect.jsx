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
  autocompleteProps = {},
  ...rest
}) {
  const queryResult = useQuery(query);
  const { data: options = [] } = queryResult;

  return (
    <QueryStatusWrapper queryResult={queryResult} loadingMessage={loadingMessage} errorMessage={errorMessage}>
      <FormControl {...rest}>
        {autoComplete ? (
          <Autocomplete
            multiple={multiple}
            onChange={(event, value) => { onChange(value); }}
            id="tags-standard"
            options={options}
            getOptionLabel={getOptionLabel}
            defaultValue={multiple ? [] : ''}
            forcePopupIcon
            {...autocompleteProps}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
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
