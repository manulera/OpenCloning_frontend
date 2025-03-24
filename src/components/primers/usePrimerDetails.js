import { useEffect, useState } from 'react';
import useBackendRoute from '../../hooks/useBackendRoute';
import useHttpClient from '../../hooks/useHttpClient';

const primerDetailsCache = new Map();

export function usePrimerDetails(sequence) {
  const [primerDetails, setPrimerDetails] = useState({ status: 'loading' });
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const backendRoute = useBackendRoute();
  const httpClient = useHttpClient();
  const url = backendRoute('primer_details');
  const retry = () => setConnectionAttempt((prev) => prev + 1);

  useEffect(() => {
    const fetchPrimerDetails = async () => {
      if (!primerDetailsCache.has(sequence)) {
        setPrimerDetails({ status: 'loading' });
        try {
          const { data } = await httpClient.get(url, { params: { sequence } });
          const formattedData = {
            melting_temperature: Number(data.melting_temperature.toFixed(1)),
            gc_content: Number(data.gc_content.toFixed(2)),
          };
          primerDetailsCache.set(sequence, formattedData);
        } catch (error) {
          setPrimerDetails({ status: 'error', error });
          return;
        }
      }
      setPrimerDetails({ ...primerDetailsCache.get(sequence), status: 'success' });
    };

    fetchPrimerDetails();
  }, [sequence, connectionAttempt]);

  return [primerDetails, retry];
}
