import * as React from 'react';
import GetRequestMultiSelect from './GetRequestMultiSelect';
import useBackendRoute from '../../hooks/useBackendRoute';

function EnzymeMultiSelect({ setEnzymes, label = 'Enzymes used', multiple = true }) {
  const backendRoute = useBackendRoute();
  const url = backendRoute('restriction_enzyme_list');
  const getOptionsFromResponse = React.useCallback((data) => data.enzyme_names, []);
  const messages = React.useMemo(() => ({
    loadingMessage: 'retrieving enzymes...',
    errorMessage: 'Could not retrieve enzymes from server',
  }), []);
  const onChange = React.useCallback((value) => setEnzymes(value), [setEnzymes]);

  return (

    <GetRequestMultiSelect
      fullWidth
      className="enzyme-multi-select"
      getOptionsFromResponse={getOptionsFromResponse}
      url={url}
      label={label}
      messages={messages}
      onChange={onChange}
      multiple={multiple}
      getOptionLabel={(option) => option}
    />
  );
}

export default React.memo(EnzymeMultiSelect);
