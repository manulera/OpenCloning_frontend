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
  value,
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

  const isOptionEqualToValue = React.useCallback((option, val) => getOptionKey(option) === getOptionKey(val), [getOptionKey]);

  // Build a lookup map from key → option object
  const optionsByKey = React.useMemo(
    () => new Map(options.map((opt) => [getOptionKey(opt), opt])),
    [options, getOptionKey],
  );

  // Resolve ID-based value to full option objects for Autocomplete,
  // or keep as-is for Select (which works with IDs directly).
  const resolvedValue = React.useMemo(() => {
    if (value === undefined) return undefined;
    if (!autoComplete) return value;
    if (multiple) {
      return (value || []).map((v) => optionsByKey.get(v)).filter(Boolean);
    }
    return optionsByKey.get(value) ?? null;
  }, [value, autoComplete, multiple, optionsByKey]);

  // Map selected objects back to IDs via getOptionKey
  const handleAutocompleteChange = React.useCallback((event, newValue) => {
    if (multiple) {
      onChange(newValue.map((v) => getOptionKey(v)));
    } else {
      onChange(newValue ? getOptionKey(newValue) : null);
    }
    setInputValue('');
  }, [onChange, multiple, getOptionKey]);

  return (
    <QueryStatusWrapper renderIfLoading={autoComplete} queryResult={queryResult} loadingMessage={loadingMessage} errorMessage={errorMessage}>
      <FormControl {...rest}>
        {autoComplete ? (
          <Autocomplete
            multiple={multiple}
            onChange={handleAutocompleteChange}
            id="tags-standard"
            options={options}
            getOptionLabel={getOptionLabel}
            getOptionKey={getOptionKey}
            value={resolvedValue !== undefined ? resolvedValue : (multiple ? [] : null)}
            forcePopupIcon
            isOptionEqualToValue={isOptionEqualToValue}
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
              value={value !== undefined ? value : undefined}
              label={label}
              defaultValue={value === undefined ? (multiple ? [] : '') : undefined}
              error={options.length === 0}
              inputProps={inputProps}
            >
              {options.map((option) => (
                <MenuItem key={getOptionKey(option)} value={getOptionKey(option)}>
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
