import React from 'react';
import GetRequestMultiSelect from '../form/GetRequestMultiSelect';
import { eLabFTWHttpClient, readHeaders } from './common';

function ELabFTWCategorySelect({ setCategory, label = 'Resource category', ...rest }) {
  const url = '/api/v2/items_types';
  const getOptionsFromResponse = (data) => data;
  const messages = { loadingMessage: 'retrieving categories', errorMessage: 'Could not retrieve categories from eLab' };
  const onChange = (value) => setCategory(value);

  return (
    <GetRequestMultiSelect
      getOptionsFromResponse={getOptionsFromResponse}
      httpClient={eLabFTWHttpClient}
      requestHeaders={readHeaders}
      url={url}
      label={label}
      messages={messages}
      onChange={onChange}
      getOptionLabel={(option) => (option === '' ? '' : option.title)}
      multiple={false}
      {...rest}
    />
  );
}

export default ELabFTWCategorySelect;
