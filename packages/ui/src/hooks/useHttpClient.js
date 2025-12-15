import { useSelector } from 'react-redux';
import React from 'react';
import getHttpClient from '@opencloning/utils/getHttpClient';

export default function useHttpClient() {
  const backendUrl = useSelector((state) => state.cloning.config.backendUrl);

  // Memoize the client creation and interceptor setup
  const apiClient = React.useMemo(() => getHttpClient([backendUrl]), [backendUrl]);

  return apiClient;
}
