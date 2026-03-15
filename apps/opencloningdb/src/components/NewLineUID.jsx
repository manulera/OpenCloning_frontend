import React from 'react'
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { TextFieldQueryValidated } from '@opencloning/ui';

const getLineUIDExistsErrorQuery = (value) => ({
  queryKey: ['lines', { uid: value }],
  queryFn: async () => {
    const { data } = await openCloningDBHttpClient.get(endpoints.lines, {
      params: { uid: value },
    });
    if (data.items.find((item) => item.uid === value)) {
      return 'Line UID already exists';
    }
    return '';
  },
});

function NewLineUID({ value, onChange }) {
  return (
    <TextFieldQueryValidated
      label="New Line UID"
      placeholder="Enter a new line UID"
      value={value}
      onChange={onChange}
      getQuery={getLineUIDExistsErrorQuery}
    />
  )
}

export default NewLineUID
