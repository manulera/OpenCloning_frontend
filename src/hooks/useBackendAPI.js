import axios from 'axios';
import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { cloningActions } from '../store/cloning';
import error2String from '../utils/error2String';

export default function useBackendAPI(sourceId) {
  const [requestStatus, setRequestStatus] = useState({ status: null, message: '' });
  const [sources, setSources] = useState('');
  const [entities, setEntities] = useState('');
  const { addEntityAndItsSource } = cloningActions;
  const dispatch = useDispatch();

  const sendPostRequest = useCallback(async (endpoint, requestData, config = {}) => {
    setRequestStatus({ status: 'loading', message: 'loading' });
    const url = import.meta.env.VITE_REACT_APP_BACKEND_URL + endpoint;
    axios
      .post(url, requestData, config)
      .then((resp) => {
        setRequestStatus({ status: null, message: '' });

        // If there is only a single product, commit the result, else allow choosing
        if (resp.data.sources.length === 1) {
          dispatch(addEntityAndItsSource({ newSource: { ...resp.data.sources[0], id: sourceId }, newEntity: resp.data.sequences[0] }));
        } else { setSources(resp.data.sources); setEntities(resp.data.sequences); }
      }).catch((error) => { setRequestStatus({ status: 'error', message: error2String(error) }); setSources([]); setEntities([]); });
  }, []);

  return { requestStatus, sources, entities, sendPostRequest };
}
