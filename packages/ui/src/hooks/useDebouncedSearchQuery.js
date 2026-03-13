import { useState, useEffect } from 'react';
import { keepPreviousData } from '@tanstack/react-query';

export default function useDebouncedSearchQuery(getQuery, { minChars = 3, debounceMs = 500 } = {}) {
  const [input, setInput] = useState('');
  const [debouncedInput, setDebouncedInput] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebouncedInput(input), debounceMs);
    return () => clearTimeout(id);
  }, [input, debounceMs]);

  const query = {
    ...getQuery(debouncedInput),
    enabled: debouncedInput.length >= minChars,
    placeholderData: keepPreviousData,
  };

  const autocompleteProps = {
    inputValue: input,
    onInputChange: (_event, value, reason) => {
      if (reason === 'input') setInput(value);
    },
    filterOptions: (x) => x,
    noOptionsText: input.length < minChars
      ? `Type at least ${minChars} characters to search`
      : 'No results found',
  };

  return { query, autocompleteProps };
}
