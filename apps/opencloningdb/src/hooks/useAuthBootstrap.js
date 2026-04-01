import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  setUnauthorizedHandler,
  openCloningDBHttpClient,
  endpoints,
} from '@opencloning/opencloningdb';
import { setUser, clearUser } from '../store/authSlice';
import { useQueryClient } from '@tanstack/react-query';
import useChangeWorkspace from './useChangeWorkspace';

export default function useAuthBootstrap() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { changeWorkspace, clearWorkspace } = useChangeWorkspace();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearWorkspace();
      queryClient.clear();
      globalThis.localStorage.removeItem('token');
      dispatch(clearUser());
      navigate('/login');
    });

    const token = globalThis.localStorage.getItem('token');
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
        .catch(() => globalThis.localStorage.removeItem('token'));
    }
  }, [dispatch, queryClient, navigate, changeWorkspace, clearWorkspace]);
}
