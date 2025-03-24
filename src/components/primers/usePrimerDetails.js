import useBackendRoute from '../../hooks/useBackendRoute';
import useHttpClient from '../../hooks/useHttpClient';

const primerDetailsCache = new Map();

export function usePrimerDetails() {
  const backendRoute = useBackendRoute();
  const httpClient = useHttpClient();

  const url = backendRoute('primer_details');

  const getPrimerDetails = async (sequence) => {
    if (!primerDetailsCache.has(sequence)) {
      const { data } = await httpClient.get(url, { params: { sequence } });
      data.length = sequence.length;
      primerDetailsCache.set(sequence, data);
    }
    return primerDetailsCache.get(sequence);
  };

  return { getPrimerDetails };
}
