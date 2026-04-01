import React from 'react';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { setWorkspaceHeader, clearWorkspaceHeader } from '@opencloning/opencloningdb';
import { setWorkspace, clearUser, setUser } from '../store/authSlice';

export default function useChangeWorkspace() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const changeWorkspace = React.useCallback(
    (workspace) => {
      queryClient.clear();
      setWorkspaceHeader(workspace.id);
      dispatch(
        setWorkspace({
          id: workspace.id,
          name: workspace.name,
          role: workspace.role ?? null,
        }),
      );
    },
    [dispatch, queryClient],
  );

  const clearWorkspace = React.useCallback(() => {
    clearWorkspaceHeader();
    dispatch(setWorkspace(null));
    queryClient.clear();
  }, [dispatch, queryClient]);

  const applySession = React.useCallback(
    (user, workspace) => {
      dispatch(setUser(user));
      changeWorkspace(workspace);
    },
    [dispatch, changeWorkspace],
  );

  const logout = React.useCallback(() => {
    clearWorkspace();
    localStorage.removeItem('token');
    dispatch(clearUser());
    navigate('/login');
  }, [clearWorkspace, dispatch, navigate]);

  return React.useMemo(
    () => ({ changeWorkspace, clearWorkspace, applySession, logout }),
    [changeWorkspace, clearWorkspace, applySession, logout],
  );
}
