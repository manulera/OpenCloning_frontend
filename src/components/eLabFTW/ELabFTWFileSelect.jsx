import React from 'react';
import GetRequestMultiSelect from '../form/GetRequestMultiSelect';
import { baseUrl, readHeaders } from './common';

function ELabFTWFileSelect({ itemId, setFileInfo, ...rest }) {
  const url = `${baseUrl}/api/v2/items/${itemId}`;
  const getOptionsFromResponse = ({ uploads }) => uploads;
  const label = 'File with sequence';
  const messages = { loadingMessage: 'retrieving attachments', errorMessage: 'Could not retrieve attachment from eLab' };
  const onChange = (realName, options) => setFileInfo(options.find((option) => option.real_name === realName));

  return (
    <GetRequestMultiSelect
      getOptionsFromResponse={getOptionsFromResponse}
      requestHeaders={readHeaders}
      url={url}
      label={label}
      messages={messages}
      onChange={onChange}
      getOptionLabel={(option) => (option === '' ? '' : option.real_name)}
      multiple={false}
      autoComplete={false}
      {...rest}
    />
  );
}

export default ELabFTWFileSelect;
