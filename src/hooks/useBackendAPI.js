import axios from 'axios';
import { useState, useCallback } from 'react';
import error2String from '../utils/error2String';
import useBackendRoute from './useBackendRoute';

export default function useBackendAPI() {
  const [requestStatus, setRequestStatus] = useState({ status: null, message: '' });
  const [sources, setSources] = useState('');
  const [entities, setEntities] = useState('');
  const backendRoute = useBackendRoute();

  const sendPostRequest = useCallback(async ({ endpoint, requestData, config = {}, source: { output }, modifySource = (s) => s }) => {
    setRequestStatus({ status: 'loading', message: 'loading' });

    // Url built like this in case trailing slash
    const url = backendRoute(endpoint);
    // paramsSerializer: { indexes: null } is to correctly serialize arrays in the URL
    const fullConfig = { ...config, paramsSerializer: { indexes: null } };
    try {
      const resp = await axios.post(url, requestData, fullConfig);

      setRequestStatus({ status: null, message: '' });

      const receivedSources = resp.data.sources.map(modifySource);
      if (output !== null) {
        receivedSources.forEach((s) => { s.output = output; });
      }
      setSources(receivedSources); setEntities(resp.data.sequences);
    } catch (error) {
      setRequestStatus({ status: 'error', message: error2String(error) });
      setSources([]);
      setEntities([]);
    }
  }, []);

  return { requestStatus, sources, entities, sendPostRequest };
}
