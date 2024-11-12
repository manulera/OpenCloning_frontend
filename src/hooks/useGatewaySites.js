import React, { useCallback, useState } from 'react';
import axios from 'axios';
import { useStore } from 'react-redux';
import error2String from '../utils/error2String';
import { formatGatewaySites } from '../store/cloning_utils';
import useBackendRoute from './useBackendRoute';

export default function useGatewaySites({ target, greedy }) {
  const store = useStore();
  const [requestStatus, setRequestStatus] = useState({ status: null, message: '' });
  const [connectAttempt, setConnectAttempt] = useState(0);
  const [sites, setSites] = useState([]);
  const backendRoute = useBackendRoute();

  const attemptAgain = useCallback(() => {
    setConnectAttempt((p) => p + 1);
  }, []);

  React.useEffect(() => {
    async function getSitesInTarget() {
      setRequestStatus({ status: 'loading', message: 'loading' });
      const url = backendRoute('annotation/get_gateway_sites');
      const state = store.getState();
      const sequence = state.cloning.entities.find((entity) => entity.id === target);
      try {
        const { data: donorSites } = await axios.post(url, sequence, { params: { greedy } });
        setRequestStatus({ status: 'success', message: '' });
        setSites(formatGatewaySites(donorSites, 'att'));
      } catch (error) {
        setRequestStatus({ status: 'error', message: error2String(error) });
        setSites([]);
      }
    }
    getSitesInTarget();
  }, [store, connectAttempt, target, greedy]);
  return { requestStatus, attemptAgain, sites };
}
