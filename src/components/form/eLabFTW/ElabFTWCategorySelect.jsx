import React from 'react';
import GetRequestMultiSelect from '../GetRequestMultiSelect';

function ElabFTWCategorySelect({ setCategory, apiKey }) {
  const url = 'https://localhost:443/api/v2/items_types';
  const getOptionsFromResponse = (data) => data;
  const label = 'Resource category';
  const messages = { loadingMessage: 'retrieving categories', errorMessage: 'Could not retrieve categories from eLab' };
  const onChange = (value) => setCategory(value);

  return (
    <GetRequestMultiSelect
      getOptionsFromResponse={getOptionsFromResponse}
      requestHeaders={{ Authorization: apiKey }}
      url={url}
      label={label}
      messages={messages}
      onChange={onChange}
      getOptionLabel={(option) => (option === '' ? '' : option.title)}
      multiple={false}
    />
  );
}

export default ElabFTWCategorySelect;
