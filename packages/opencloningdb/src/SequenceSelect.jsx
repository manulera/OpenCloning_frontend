import React from 'react';
import { QuerySelect, useDebouncedSearchQuery } from '@opencloning/ui';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';

const getGetQuery = (sequenceTypes) => {
  return (name) => ({
    queryKey: ['sequences', { sequence_types: sequenceTypes, name }],
    queryFn: async () => {
      const { data } = await openCloningDBHttpClient.get(endpoints.sequences, {
        params: { sequence_types: sequenceTypes, name },
      });
      return data.items;
    },
  })};

function SequenceSelect({ value, onChange, label, multiple = true, sequenceTypes = undefined, ...rest }) {
  const { query, autocompleteProps, clearInput } = useDebouncedSearchQuery(getGetQuery(sequenceTypes));

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

export default SequenceSelect;
