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
      const formattedData = {
        melting_temperature: Number(data.melting_temperature.toFixed(1)),
        gc_content: Number(data.gc_content.toFixed(2)) * 100,
        length: sequence.length,
        homodimer_melting_temperature: Number(data.homodimer_melting_temperature.toFixed(1)),
        homodimer_dg: Number(data.homodimer_dg.toFixed(0)),
      };
      primerDetailsCache.set(sequence, formattedData);
    }
    return primerDetailsCache.get(sequence);
  };

  return { getPrimerDetails };
}
