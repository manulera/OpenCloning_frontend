import React from 'react';
import GetRequestMultiSelect from '../form/GetRequestMultiSelect';
import { eLabFTWHttpClient, readHeaders } from './common';
import { useSelector } from 'react-redux';

function ELabFTWCategorySelect({ setCategory, label = 'Resource category', ...rest }) {
  const { eLabFTWVersion } = useSelector((state) => state.cloning.config);
  const url = eLabFTWVersion && eLabFTWVersion >= 50300 ? 'api/v2/teams/current/resources_categories' : '/api/v2/items_types';
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
