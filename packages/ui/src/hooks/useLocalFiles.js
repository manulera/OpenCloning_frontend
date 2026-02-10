import React from 'react';
import getHttpClient from '@opencloning/utils/getHttpClient';
import { useConfig } from '../providers';
import useRequestForEffect from './useRequestForEffect';


export const localFilesHttpClient = getHttpClient([]);

export default function useLocalFiles() {
  const [index, setIndex] = React.useState(null);

  const config = useConfig();
  const httpClient = localFilesHttpClient;
  const localFilesPath = `${import.meta.env.BASE_URL}${config.localFilesPath}`;

  const categories = React.useMemo(() => {
    if (!index?.sequences) return [];
    const allCategories = index.sequences
      .map((s) => s.categories)
      .flat()
      .filter(Boolean);
    return Array.from(new Set(allCategories)).sort((a, b) => a.localeCompare(b));
  }, [index]);

  const sequences = React.useMemo(() => {
    if (!index?.sequences) return [];
    return index.sequences;
  }, [index]);

  const requestFunction = React.useCallback(async () => {
    const resp = await httpClient.get(`${localFilesPath}/index.json`);
    return resp.data;
  }, [localFilesPath, httpClient]);

  const onSuccess = React.useCallback((data) => {
    setIndex(data);
  }, []);

  const { requestStatus: indexRequestStatus, retry: indexRetry } = useRequestForEffect({ requestFunction, onSuccess });

  const requestFile = React.useCallback(async (path) => {
    console.log(`${localFilesPath}/${path}`);
    const resp = await httpClient.get(`${localFilesPath}/${path}`);
    return resp.data;
  }, [localFilesPath, httpClient]);

  return React.useMemo(() => ({
    index,
    categories,
    sequences,
    indexRequestStatus,
    indexRetry,
    requestFile
  }),
  [
    index,
    categories,
    sequences,
    indexRequestStatus,
    indexRetry,
    requestFile]);
}
