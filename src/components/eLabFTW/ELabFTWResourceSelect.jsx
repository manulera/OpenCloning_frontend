import axios from 'axios';
import React from 'react';
import PostRequestSelect from '../form/PostRequestSelect';
import { baseUrl, readHeaders } from './common';

function ELabFTWResourceSelect({ setResource, categoryId, ...rest }) {
  const url = `${baseUrl}/api/v2/items`;

  const resourcePostRequestSettings = React.useMemo(() => ({
    setValue: setResource,
    getOptions: async (userInput) => {
      const resp = await axios.get(url, { headers: readHeaders, params: { cat: categoryId, extended: `title:${userInput}` } });
      return resp.data;
    },
    getOptionLabel: (option) => (option ? option.title : ''),
    isOptionEqualToValue: (option, value) => option?.id === value?.id,
    textLabel: 'Resource',
  }), [setResource, categoryId]);
  return (
    <PostRequestSelect {...resourcePostRequestSettings} {...rest} />
  );
}

export default ELabFTWResourceSelect;
