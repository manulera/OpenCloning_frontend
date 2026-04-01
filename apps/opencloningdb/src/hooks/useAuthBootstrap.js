import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  setUnauthorizedHandler,
  openCloningDBHttpClient,
  endpoints,
  setWorkspaceHeader,
  clearWorkspaceHeader,
} from '@opencloning/opencloningdb';
import { setUser, setWorkspaceId, setWorkspaceName, clearUser } from '../store/authSlice';
import { useQueryClient } from '@tanstack/react-query';

export default function useAuthBootstrap() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearWorkspaceHeader();
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
          const id = workspace.id;
          setWorkspaceHeader(id);
          dispatch(setWorkspaceId(id));
          dispatch(setWorkspaceName(workspace.name));
        })
        .catch(() => globalThis.localStorage.removeItem('token'));
    }
  }, [dispatch, navigate, queryClient]);
}
