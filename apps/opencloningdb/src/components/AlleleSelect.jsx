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

function AlleleSelect({ onChange, label = 'Alleles', multiple = true, ...rest }) {
  const { query, autocompleteProps } = useDebouncedSearchQuery(getQuery);

  return (
    <QuerySelect
      sx={{ minWidth: 240, margin: 4 }}
      query={query}
      label={label}
      multiple={multiple}
      getOptionLabel={(seq) => seq.name ?? `Sequence ${seq.id}`}
      getOptionKey={(seq) => seq.id}
      onChange={onChange}
      autocompleteProps={autocompleteProps}
      {...rest}
    />
  );
}

export default AlleleSelect;
