import React from 'react';
import { QuerySelect, useDebouncedSearchQuery } from '@opencloning/ui';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';

const getQuery = (name) => ({
  queryKey: ['sequences', { sequence_types: ['allele'], name }],
  queryFn: async () => {
    const { data } = await openCloningDBHttpClient.get(endpoints.sequences, {
      params: { sequence_types: ['allele'], name },
    });
    return data.items;
  },
});

function AlleleSelect({ value, onChange, label = 'Alleles', multiple = true, ...rest }) {
  const { query, autocompleteProps, clearInput } = useDebouncedSearchQuery(getQuery);

  return (
    <QuerySelect
      query={query}
      label={label}
      multiple={multiple}
      getOptionLabel={(seq) => seq.name ?? `Sequence ${seq.id}`}
      getOptionKey={(seq) => seq.id}
      value={value}
      onChange={onChange}
      autoComplete={true}
      autocompleteProps={autocompleteProps}
      onClear={clearInput}
      {...rest}
    />
  );
}

export default AlleleSelect;
