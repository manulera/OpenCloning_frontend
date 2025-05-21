import React from 'react';
import { openCloningDBHttpClient } from './common';
import GetRequestMultiSelect from '../form/GetRequestMultiSelect';

function SequenceSelect({ setSequence, ...rest }) {
  const url = '/sequences';
  const getOptionsFromResponse = (data) => data;
  const messages = { loadingMessage: 'retrieving sequences', errorMessage: 'Could not retrieve sequences from OpenCloningDB' };
  const onChange = (value) => setSequence(value);

  return (
    <GetRequestMultiSelect
      getOptionsFromResponse={getOptionsFromResponse}
      httpClient={openCloningDBHttpClient}
      url={url}
      label="Sequence"
      messages={messages}
      onChange={onChange}
      getOptionLabel={(option) => (option === '' ? '' : `${option.id} - ${option.name}`)}
      multiple={false}
      {...rest}
    />
  );
}

export default SequenceSelect;
