import React from 'react';
import GetRequestMultiSelect from '../GetRequestMultiSelect';

function ElabFTWFileSelect({ itemId, apiKey, setFileInfo }) {
  const url = `https://localhost:443/api/v2/items/${itemId}`;
  const getOptionsFromResponse = ({ uploads }) => uploads;
  const label = 'File with sequence';
  const messages = { loadingMessage: 'retrieving attachments', errorMessage: 'Could not retrieve attachment from eLab' };
  const onChange = (realName, options) => setFileInfo(options.find((option) => option.real_name === realName));

  return (
    <GetRequestMultiSelect
      getOptionsFromResponse={getOptionsFromResponse}
      requestHeaders={{ Authorization: apiKey }}
      url={url}
      label={label}
      messages={messages}
      onChange={onChange}
      getOptionLabel={(option) => (option === '' ? '' : option.real_name)}
      multiple={false}
      autoComplete={false}
    />
  );
}

export default ElabFTWFileSelect;
