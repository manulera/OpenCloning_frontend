import React from 'react';
import { QuerySelect } from '@opencloning/ui';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';

const TAG_QUERY = {
  queryKey: ['tags'],
  queryFn: async () => {
    const { data } = await openCloningDBHttpClient.get(endpoints.tags);
    return data;
  },
};

function TagMultiSelect({ onChange, label = 'Tags', value, ...rest }) {
  return (
    <QuerySelect
      query={TAG_QUERY}
      label={label}
      getOptionLabel={(tag) => tag.name}
      getOptionKey={(tag) => tag.id}
      onChange={onChange}
      value={value}
      inputProps={{size: 'small'}}
      autoComplete={true}
      {...rest}
    />
  );
}

export default TagMultiSelect;

