import axios from 'axios';
import React from 'react';
import PostRequestSelect from '../PostRequestSelect';

function ElabFTWResourceSelect({ setResource, categoryId, apiKey }) {
  const url = 'https://localhost:443/api/v2/items';
  const resourcePostRequestSettings = React.useMemo(() => ({
    setValue: setResource,
    getOptions: async (userInput) => {
      const resp = await axios.get(url, { headers: { Authorization: apiKey }, params: { cat: categoryId, extended: `title:${userInput}` } });
      return resp.data;
    },
    getOptionLabel: ({ title }) => title,
    isOptionEqualToValue: (option, value) => option.id === value.id,
    textLabel: 'Resource',
  }), [setResource]);
  return (
    <PostRequestSelect {...resourcePostRequestSettings} />
  );
}

export default ElabFTWResourceSelect;
