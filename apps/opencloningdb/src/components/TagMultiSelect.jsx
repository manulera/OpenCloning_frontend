import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import ChipMultiSelect from './ChipMultiSelect';

function TagMultiSelect({ value, onChange, label = 'Tags', ...rest }) {
  const { data: tagsData, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data } = await openCloningDBHttpClient.get(endpoints.tags);
      return data;
    },
  });

  const options = useMemo(() => {
    if (!Array.isArray(tagsData)) return [];
    return tagsData.map((tag) => ({ id: tag.id, label: tag.name }));
  }, [tagsData]);

  return (
    <ChipMultiSelect
      label={label}
      options={options}
      value={value ?? []}
      onChange={onChange}
      loading={isLoading}
      {...rest}
    />
  );
}

export default TagMultiSelect;
