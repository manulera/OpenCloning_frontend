import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl } from '@mui/material';
import { QuerySelect } from '@opencloning/ui';
import { endpoints, openCloningDBHttpClient, setWorkspaceHeader } from '@opencloning/opencloningdb';
import { setWorkspaceId, setWorkspaceName } from '../store/authSlice';

export default function SwitchWorkspaceDialog({ open, onClose }) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const currentWorkspaceId = useSelector((state) => state.auth.workspaceId);
  const [selectedWorkspace, setSelectedWorkspace] = React.useState(null);

  const workspaceQuery = React.useMemo(() => ({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const { data } = await openCloningDBHttpClient.get(endpoints.workspaces);
      return data;
    },
    enabled: open,
  }), [open]);

  function handleSwitchWorkspace() {
    if (!selectedWorkspace) return;

    setWorkspaceHeader(selectedWorkspace.id);
    dispatch(setWorkspaceId(selectedWorkspace.id));
    dispatch(setWorkspaceName(selectedWorkspace.name));
    queryClient.invalidateQueries();
    onClose();
  }

  function handleClose() {
    setSelectedWorkspace(null);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Switch workspace</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1 }}>
          <QuerySelect
            query={workspaceQuery}
            label="Workspace"
            multiple={false}
            autoComplete={false}
            getOptionLabel={(workspace) => workspace.name}
            getOptionKey={(workspace) => workspace.id}
            value={selectedWorkspace}
            onChange={setSelectedWorkspace}
            autocompleteProps={{
              noOptionsText: 'No workspaces available',
            }}
            inputProps={{
              id: 'switch-workspace-select',
            }}
          />
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!selectedWorkspace || selectedWorkspace.id === currentWorkspaceId}
          onClick={handleSwitchWorkspace}
        >
          Switch
        </Button>
      </DialogActions>
    </Dialog>
  );
}
