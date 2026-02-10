import React from 'react';
import getHttpClient from '@opencloning/utils/getHttpClient';
import { useConfig } from '../providers';
import useRequestForEffect from './useRequestForEffect';


export const localFilesHttpClient = getHttpClient([]);

function sequencesToCategories(sequences) {
  const allCategories = sequences
    .map((s) => s.categories)
    .flat()
    .filter(Boolean);
  return Array.from(new Set(allCategories)).sort((a, b) => a.localeCompare(b));
}
export default function useLocalFiles() {
  const [index, setIndex] = React.useState(null);

  const config = useConfig();
  const httpClient = localFilesHttpClient;
  const localFilesPath = `${import.meta.env.BASE_URL}${config.localFilesPath}`;

  const requestFunction = React.useCallback(async () => {
    const resp = await httpClient.get(`${localFilesPath}/index.json`);
    return resp.data;
  }, [localFilesPath, httpClient]);

  const onSuccess = React.useCallback((data) => {
    const sequences = !data.sequences ? [] : data.sequences;
    const syntaxes = !data.syntaxes ? [] : data.syntaxes;
    const categories = sequencesToCategories(sequences);
    setIndex({ sequences, syntaxes, categories });
  }, []);

  const { requestStatus: indexRequestStatus, retry: indexRetry } = useRequestForEffect({ requestFunction, onSuccess });

  const requestFile = React.useCallback(async (path) => {
    const resp = await httpClient.get(`${localFilesPath}/${path}`);
    return resp.data;
  }, [localFilesPath, httpClient]);

  return React.useMemo(() => (
    !localFilesPath ? null :
      {
        index,
        indexRequestStatus,
        indexRetry,
        requestFile
      }),
  [
    index,
    indexRequestStatus,
    indexRetry,
    requestFile,
    localFilesPath]);
}
