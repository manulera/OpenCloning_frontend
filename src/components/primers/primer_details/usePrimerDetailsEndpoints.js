import React, { useCallback } from 'react';
import useBackendRoute from '../../../hooks/useBackendRoute';
import useHttpClient from '../../../hooks/useHttpClient';
import { isEqual } from 'lodash-es';
import { useSelector } from 'react-redux';

const primerDetailsCache = new Map();
const heterodimerDetailsCache = new Map();
export function usePrimerDetailsEndpoints() {
  const backendRoute = useBackendRoute();
  const httpClient = useHttpClient();
  const globalPrimerSettings = useSelector((state) => state.cloning.globalPrimerSettings, isEqual);

  React.useEffect(() => {
    primerDetailsCache.clear();
    heterodimerDetailsCache.clear();
  }, [globalPrimerSettings]);

  const url = backendRoute('primer_details');
  const heterodimerUrl = backendRoute('primer_heterodimer');

  const getPrimerDetails = useCallback(async (sequence) => {
    if (!primerDetailsCache.has(sequence)) {
      const { data } = await httpClient.post(url, { sequence, settings: globalPrimerSettings });
      data.length = sequence.length;
      primerDetailsCache.set(sequence, data);
    }
    return primerDetailsCache.get(sequence);
  }, [url, httpClient, globalPrimerSettings]);

  const getHeterodimerDetails = useCallback(async (sequence1, sequence2) => {
    const key = [sequence1, sequence2].sort().join(',');
    if (!heterodimerDetailsCache.has(key)) {
      const { data } = await httpClient.post(heterodimerUrl, { sequence1, sequence2, settings: globalPrimerSettings });
      heterodimerDetailsCache.set(key, data);
    }
    return heterodimerDetailsCache.get(key);
  }, [heterodimerUrl, httpClient, globalPrimerSettings]);

  return { getPrimerDetails, getHeterodimerDetails };
}
