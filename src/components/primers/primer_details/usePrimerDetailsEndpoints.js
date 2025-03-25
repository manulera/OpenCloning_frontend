import useBackendRoute from '../../../hooks/useBackendRoute';
import useHttpClient from '../../../hooks/useHttpClient';

const primerDetailsCache = new Map();
const heterodimerDetailsCache = new Map();
export function usePrimerDetailsEndpoints() {
  const backendRoute = useBackendRoute();
  const httpClient = useHttpClient();

  const url = backendRoute('primer_details');
  const heterodimerUrl = backendRoute('primer_heterodimer');

  const getPrimerDetails = async (sequence) => {
    if (!primerDetailsCache.has(sequence)) {
      const { data } = await httpClient.get(url, { params: { sequence } });
      data.length = sequence.length;
      primerDetailsCache.set(sequence, data);
    }
    return primerDetailsCache.get(sequence);
  };

  const getHeterodimerDetails = async (sequence1, sequence2) => {
    const key = [sequence1, sequence2].sort().join(',');
    if (!heterodimerDetailsCache.has(key)) {
      const { data } = await httpClient.get(heterodimerUrl, { params: { sequence1, sequence2 } });
      heterodimerDetailsCache.set(key, data);
    }
    return heterodimerDetailsCache.get(key);
  };

  return { getPrimerDetails, getHeterodimerDetails };
}
