import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const { data: options = [] } = useQuery(TAG_QUERY);
  const valueAsObjects = useMemo(
    () => (value || []).map((id) => options.find((o) => o.id === id)).filter(Boolean),
    [value, options],
  );

  return (
    <QuerySelect
      query={TAG_QUERY}
      label={label}
      getOptionLabel={(tag) => tag.name}
      getOptionKey={(tag) => tag.id}
      value={valueAsObjects}
      onChange={(selectedTags) => onChange(selectedTags?.map((t) => t.id) ?? [])}
      inputProps={{ size: 'small' }}
      autoComplete={true}
      {...rest}
    />
  );
}

export default TagMultiSelect;

