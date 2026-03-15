import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TextField } from '@mui/material';

/**
 * Text field with validation driven by a React Query. Error/loading state come from the query.
 * Similar to TextFieldApiValidated but takes a query (like QuerySelect vs PostRequestSelect).
 *
 * @param {string} label - Label for the TextField
 * @param {string} placeholder - Placeholder text
 * @param {Function} getQuery - (value) => ({ queryKey, queryFn, ... }) — returns a query config for the given value (use value in queryKey so each input has its own cache).
 * @param {Function} onChange - Callback when validation succeeds; receives (queryData). Called with null when value is empty or validation fails.
 * @param {string} value - Controlled value (optional)
 * @param {number} debounceDelay - Delay in ms before running the query (default: 500)
 * @param {string} successMessage - Optional message to show when validation succeeds (default: ' ')
 * @param {string} validatingMessage - Message while the query is loading (default: 'Validating...')
 */
export default function TextFieldQueryValidated({
  label,
  placeholder,
  getQuery,
  onChange,
  value = '',
  debounceDelay = 500,
  successMessage = ' ',
  validatingMessage = 'Validating...',
  ...rest
}) {
  const [localValue, setLocalValue] = useState(value);
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
    setDebouncedValue(value);
  }, [value]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(localValue), debounceDelay);
    return () => clearTimeout(id);
  }, [localValue, debounceDelay]);

  const queryConfig = React.useMemo(
    () => getQuery(debouncedValue),
    [getQuery, debouncedValue],
  );

  console.log('debouncedValue', debouncedValue);
  console.log('localValue', localValue);
  const { data, isLoading, error, isSuccess } = useQuery({
    ...queryConfig,
    enabled: debouncedValue.length > 0 && (queryConfig.enabled !== false),
  });

  useEffect(() => {
    if (debouncedValue.length === 0) {
      onChange('');
      return;
    }
    if (isSuccess && data !== undefined) {
      onChange(data);
    }
    if (error) {
      onChange('');
    }
  }, [debouncedValue, isSuccess, data, error, onChange]);

  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };

  const helperText = isLoading ? validatingMessage : (error?.message || (isSuccess && data !== undefined ? successMessage : ' '));

  return (
    <TextField
      label={label}
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      error={!!error}
      helperText={helperText}
      {...rest}
    />
  );
}
