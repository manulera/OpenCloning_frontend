import React from 'react';
import { openCloningDBHttpClient } from './common';
import GetRequestMultiSelect from '@opencloning/ui/components/form/GetRequestMultiSelect';

const PAGE_SIZE = 100;
const messages = { loadingMessage: 'retrieving primers', errorMessage: 'Could not retrieve primers from OpenCloningDB' };

function PrimerSelect({ setPrimer, filterDatabaseIds = [], ...rest }) {
  const url = '/primers';
  const getOptionsFromResponse = React.useCallback((data) => data.items.filter((primer) => !filterDatabaseIds.includes(primer.id)), [filterDatabaseIds]);
  const onChange = React.useCallback((value) => setPrimer(value), [setPrimer]);

  return (
    <GetRequestMultiSelect
      getOptionsFromResponse={getOptionsFromResponse}
      httpClient={openCloningDBHttpClient}
      url={url}
      requestParams={{ page: 1, size: PAGE_SIZE }}
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
