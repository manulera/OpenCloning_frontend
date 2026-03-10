import React from 'react';
import { openCloningDBHttpClient } from './common';
import GetRequestMultiSelect from '@opencloning/ui/components/form/GetRequestMultiSelect';

const PAGE_SIZE = 100;

function SequenceSelect({ setSequence, ...rest }) {
  const url = '/sequences';
  const getOptionsFromResponse = (data) => data.items;
  const messages = { loadingMessage: 'retrieving sequences', errorMessage: 'Could not retrieve sequences from OpenCloningDB' };
  const onChange = (value) => setSequence(value);

  return (
    <GetRequestMultiSelect
      getOptionsFromResponse={getOptionsFromResponse}
      httpClient={openCloningDBHttpClient}
      url={url}
      requestParams={{ page: 1, size: PAGE_SIZE }}
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
