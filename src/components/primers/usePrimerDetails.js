import { useEffect, useState } from 'react';
import useBackendRoute from '../../hooks/useBackendRoute';
import useHttpClient from '../../hooks/useHttpClient';

const primerDetailsCache = new Map();

export function usePrimerDetails(sequence) {
  const [primerDetails, setPrimerDetails] = useState(null);
  const backendRoute = useBackendRoute();
  const httpClient = useHttpClient();
  const url = backendRoute('primer_details');

  useEffect(() => {
    const fetchPrimerDetails = async () => {
      if (!primerDetailsCache.has(sequence)) {
        const { data } = await httpClient.get(url, { params: { sequence } });
        const formattedData = {
          melting_temperature: Number(data.melting_temperature.toFixed(1)),
          gc_content: data.gc_content,
        };
        primerDetailsCache.set(sequence, formattedData);
      }
      setPrimerDetails(primerDetailsCache.get(sequence));
    };

    fetchPrimerDetails();
  }, [sequence]);

  return primerDetails;
}
