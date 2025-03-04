import React from 'react';
import useAlerts from './useAlerts';
import useBackendRoute from './useBackendRoute';
import useHttpClient from './useHttpClient';

export default function useValidateState() {
  const backendRoute = useBackendRoute();
  const { addAlert } = useAlerts();
  const httpClient = useHttpClient();

  const validateState = React.useCallback(async (newState) => {
    try {
      const newState2 = { ...newState, sequences: newState.entities };
      delete newState2.entities;
      await httpClient.post(backendRoute('validate'), newState2);
    } catch (e) {
      if (e.code === 'ERR_NETWORK') {
        addAlert({
          message: 'Cannot connect to backend server to validate the JSON file',
          severity: 'error',
        });
      } else {
        addAlert({
          message: 'Cloning strategy could be loaded, but it is not valid',
          severity: 'warning',
        });
      }
    }
  }, [addAlert, backendRoute]);

  return validateState;
}
