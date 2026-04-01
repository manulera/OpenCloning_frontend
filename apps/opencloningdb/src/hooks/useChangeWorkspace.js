import React from 'react';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { setWorkspaceHeader, clearWorkspaceHeader } from '@opencloning/opencloningdb';
import { setWorkspace } from '../store/authSlice';

export default function useChangeWorkspace() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

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
  }, [dispatch]);

  return React.useMemo(
    () => ({ changeWorkspace, clearWorkspace }),
    [changeWorkspace, clearWorkspace],
  );
}
