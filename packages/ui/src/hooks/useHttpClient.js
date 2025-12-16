import React from 'react';
import getHttpClient from '@opencloning/utils/getHttpClient';
import { useConfig } from './useConfig';

export default function useHttpClient() {
  const { backendUrl } = useConfig();

  // Memoize the client creation and interceptor setup
  const apiClient = React.useMemo(() => {
    if (!backendUrl) {
      // Return a client without backend URL if config not loaded yet
      return getHttpClient([]);
    }
    return getHttpClient([backendUrl]);
  }, [backendUrl]);

  return apiClient;
}
