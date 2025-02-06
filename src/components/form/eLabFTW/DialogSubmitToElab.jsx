import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, TextField } from '@mui/material';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadToELabFTWThunk } from '../../../utils/thunks';
import ElabFTWCategorySelect from './ElabFTWCategorySelect';

const apiKey = import.meta.env.VITE_ELABFTW_API_WRITE_KEY;

function DialogSubmitToElab({ id, dialogOpen, setDialogOpen }) {
  const dispatch = useDispatch();
  const [category, setCategory] = React.useState('');
  const name = useSelector((state) => state.cloning.teselaJsonCache[id].name);
  const [title, setTitle] = React.useState(name);
  const [errorMessage, setErrorMessage] = React.useState('');

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
        onSubmit: (event) => {
          event.preventDefault();
          setDialogOpen(false);
          setErrorMessage('');
          // TODO: dispatch does not return a promise
          dispatch(uploadToELabFTWThunk(id, title, category.id, apiKey)).catch((error) => setErrorMessage(error.message));
        },
      }}
    >
      <DialogTitle>Save resource to eLabFTW</DialogTitle>
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
        <ElabFTWCategorySelect setCategory={setCategory} apiKey={apiKey} />
        {errorMessage && <Alert severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button type="submit">Submit</Button>
      </DialogActions>
    </Dialog>

  );
}

export default DialogSubmitToElab;
