import React from 'react';
import GetRequestMultiSelect from '../form/GetRequestMultiSelect';
import { eLabFTWHttpClient, getELabFTWVersion, readHeaders } from './common';
import RequestStatusWrapper from '../form/RequestStatusWrapper';

function ELabFTWCategorySelect({ setCategory, label = 'Resource category', ...rest }) {
  const [eLabFTWVersion, setELabFTWVersion] = React.useState(null);
  const [requestStatus, setRequestStatus] = React.useState({ status: 'loading' });
  const [retry, setRetry] = React.useState(0);
  React.useEffect(() => {
    setRequestStatus({ status: 'loading' });
    getELabFTWVersion().then(
      (version) => {
        setELabFTWVersion(version);
        setRequestStatus({ status: 'success' });
      }
    ).catch(() => setRequestStatus({ status: 'error', message: 'Could not retrieve eLabFTW version' }));
  }, [retry]);
  const url = eLabFTWVersion && eLabFTWVersion >= 50300 ? '/api/v2/teams/current/resources_categories' : '/api/v2/items_types';
  const getOptionsFromResponse = (data) => data;
  const messages = { loadingMessage: 'retrieving categories', errorMessage: 'Could not retrieve categories from eLab' };
  const onChange = (value) => setCategory(value);

  return (
    <RequestStatusWrapper requestStatus={requestStatus} retry={() => { setRetry(retry + 1); }}>
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
    </RequestStatusWrapper>
  );
}

export default ELabFTWCategorySelect;
