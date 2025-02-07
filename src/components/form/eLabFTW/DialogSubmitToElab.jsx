import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, TextField } from '@mui/material';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadSequenceToELabFTWThunk, uploadPrimerToELabFTWThunk } from '../../../utils/thunks';
import ElabFTWCategorySelect from './ElabFTWCategorySelect';
import PrimersNotInDabaseList from '../../primers/PrimersNotInDabaseList';

const apiKey = import.meta.env.VITE_ELABFTW_API_WRITE_KEY;

function DialogSubmitToElab({ id, dialogOpen, setDialogOpen, resourceType }) {
  const dispatch = useDispatch();
  const [category, setCategory] = React.useState(null);
  const name = useSelector((state) => {
    if (resourceType === 'primer') {
      return state.cloning.primers.find((primer) => primer.id === id).name;
    }
    return state.cloning.teselaJsonCache[id].name;
  });
  const [title, setTitle] = React.useState(name);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [primerCategoryId, setPrimerCategoryId] = React.useState(null);

  const handleClose = () => {
    setDialogOpen(false);
    setErrorMessage('');
    setCategory('');
    setTitle('');
  };

  return (
    <Dialog
      open={dialogOpen}
      onClose={handleClose}
      PaperProps={{
        component: 'form',
        sx: { width: '40%' },
        onSubmit: (event) => {
          event.preventDefault();
          setDialogOpen(false);
          setErrorMessage('');
          if (resourceType === 'primer') {
            dispatch(uploadPrimerToELabFTWThunk(id, title, category.id, apiKey)).catch((error) => setErrorMessage(error.message));
          } else {
            dispatch(uploadSequenceToELabFTWThunk(id, title, category.id, apiKey, primerCategoryId)).catch((error) => setErrorMessage(error.message));
          }
        },
      }}
    >
      <DialogTitle>{`Save ${resourceType} to eLabFTW`}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <TextField
            autoFocus
            required
            id="resource_title"
            label="Resource title"
            variant="standard"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormControl>
        <ElabFTWCategorySelect
          fullWidth
          label={`Save ${resourceType} as`}
          setCategory={setCategory}
          apiKey={apiKey}
        />
        {resourceType === 'sequence' && <PrimersNotInDabaseList id={id} primerCategoryId={primerCategoryId} setPrimerCategoryId={setPrimerCategoryId} />}
        {errorMessage && <Alert severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit" disabled={!category}>Submit</Button>
      </DialogActions>
    </Dialog>

  );
}

export default DialogSubmitToElab;
