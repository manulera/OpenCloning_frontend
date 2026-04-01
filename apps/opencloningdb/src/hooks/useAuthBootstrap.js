import { useEffect } from 'react';
import {
  setUnauthorizedHandler,
  openCloningDBHttpClient,
  endpoints,
} from '@opencloning/opencloningdb';
import useChangeWorkspace from './useChangeWorkspace';

export default function useAuthBootstrap() {
  const { applySession, logout } = useChangeWorkspace();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });

    const token = localStorage.getItem('token');
    if (!token) return;

    (async () => {
      try {
        const { data: user } = await openCloningDBHttpClient.get(endpoints.authMe);
        const { data: workspaces } = await openCloningDBHttpClient.get(endpoints.workspaces);
        applySession(user, workspaces[0]);
      } catch {
        localStorage.removeItem('token');
      }
    })();
  }, [applySession, logout]);
}
