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

function TagMultiSelect({ onChange, label = 'Tags', ...rest }) {
  const onChange2 = React.useCallback((tagObjects) => onChange(tagObjects.map((t) => t.id)), [onChange]);
  return (
    <QuerySelect
      query={TAG_QUERY}
      label={label}
      getOptionLabel={(tag) => tag.name}
      getOptionKey={(tag) => tag.id}
      onChange={onChange2}
      inputProps={{size: 'small'}}
      {...rest}
    />
  );
}

export default TagMultiSelect;

