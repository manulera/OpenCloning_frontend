import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { cloningActions } from '@opencloning/store/cloning';
import useHttpClient from './useHttpClient';

const { setKnownErrors } = cloningActions;

/**
 * Hook to initialize application-level concerns
 * - Loads known errors from JSON file
 * - Clears session storage
 */
export default function useInitializeApp() {
  const dispatch = useDispatch();
  const httpClient = useHttpClient();

  useEffect(() => {
    // Load known errors from google sheet
    httpClient.get(`${import.meta.env.BASE_URL}known_errors.json`)
      .then(({ data }) => { 
        dispatch(setKnownErrors(data || {})); 
      })
      .catch(() => {
        dispatch(setKnownErrors({}));
      });
    
    // Clear session storage
    // eslint-disable-next-line no-undef
    sessionStorage.clear();
  }, [httpClient, dispatch]);
}

