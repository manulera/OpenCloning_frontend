import React from 'react';
import { openCloningDBHttpClient } from './common';
import GetRequestMultiSelect from '@opencloning/ui/components/form/GetRequestMultiSelect';

const messages = { loadingMessage: 'retrieving primers', errorMessage: 'Could not retrieve primers from OpenCloningDB' };

function PrimerSelect({ setPrimer, filterDatabaseIds = [], ...rest }) {
  const url = '/primers';
  const getOptionsFromResponse = React.useCallback((data) => data.filter((primer) => !filterDatabaseIds.includes(primer.id)), [filterDatabaseIds]);
  const onChange = React.useCallback((value) => setPrimer(value), [setPrimer]);

  return (
    <GetRequestMultiSelect
      getOptionsFromResponse={getOptionsFromResponse}
      httpClient={openCloningDBHttpClient}
      url={url}
      label="Primer"
      messages={messages}
      onChange={onChange}
      getOptionLabel={(option) => (option === '' ? '' : `${option.id} - ${option.name || 'Unnamed'}`)}
      multiple={false}
      {...rest}
    />
  );
}

export default PrimerSelect;
