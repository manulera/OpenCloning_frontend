import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, TextField } from '@mui/material';
import React from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { isEqual } from 'lodash-es';
import { cloningActions } from '../store/cloning';
import error2String from '../utils/error2String';
import useBackendRoute from '../hooks/useBackendRoute';
import useHttpClient from '../hooks/useHttpClient';

function EditSequenceNameDialog({ id, dialogOpen, setDialogOpen }) {
  const [name, setName] = React.useState('');
  const [originalName, setOriginalName] = React.useState('');
  const [error, setError] = React.useState('');
  const [sequence, source] = useSelector(({ cloning }) => [
    cloning.sequences.find((e) => e.id === id),
    cloning.sources.find((s) => s.output === id),
  ], isEqual);
  const store = useStore();
  const backendRoute = useBackendRoute();
  const httpClient = useHttpClient();

  const { updateSequenceAndItsSource } = cloningActions;
  const dispatch = useDispatch();

  const changeName = async (newName) => {
    setError('');
    const url = backendRoute('rename_sequence');
    try {
      const { data: newSequence } = await httpClient.post(url, sequence, { params: { name } });
      const newSource = { ...source, output_name: newName };
      dispatch(updateSequenceAndItsSource({ newSequence, newSource }));
      setDialogOpen(false);
    } catch (e) {
      setError(error2String(e));
    }
  };

  React.useEffect(() => {
    const seq = store.getState().cloning.teselaJsonCache[id];
    setName(seq.name);
    setOriginalName(seq.name);
  }, [sequence]);

  const nameIsNotValid = /\s/.test(name);
  const submissionAllowed = name && name !== originalName && !nameIsNotValid;
  return (
    <Dialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      PaperProps={{
        component: 'form',
        onSubmit: async (event) => {
          event.preventDefault();
          changeName(name);
        },
      }}
    >
      <DialogTitle>Rename sequence</DialogTitle>
      <DialogContent>
        <FormControl fullWidth>
          <TextField
            autoFocus
            required
            id="sequence_rename"
            label="New name"
            variant="standard"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
            error={nameIsNotValid}
            helperText={nameIsNotValid && 'Name cannot contain spaces'}
          />
        </FormControl>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setDialogOpen(false);
          }}
        >
          Cancel
        </Button>
        {submissionAllowed && <Button type="submit">Rename</Button>}
      </DialogActions>
    </Dialog>
  );
}

export default EditSequenceNameDialog;
