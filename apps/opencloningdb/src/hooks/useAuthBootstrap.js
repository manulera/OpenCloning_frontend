import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  setUnauthorizedHandler,
  openCloningDBHttpClient,
  endpoints,
} from '@opencloning/opencloningdb';
import { setUser } from '../store/authSlice';
import useChangeWorkspace from './useChangeWorkspace';

export default function useAuthBootstrap() {
  const dispatch = useDispatch();
  const { changeWorkspace, logout } = useChangeWorkspace();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });

    const token = localStorage.getItem('token');
    if (token) {
      openCloningDBHttpClient
        .get(endpoints.authMe)
        .then(({ data: user }) => {
          dispatch(setUser(user));
          return openCloningDBHttpClient.get(endpoints.workspaces);
        })
        .then(({ data: workspaces }) => {
          const workspace = workspaces[0];
          changeWorkspace(workspace);
        })
        .catch(() => localStorage.removeItem('token'));
    }
  }, [dispatch, changeWorkspace, logout]);
}
