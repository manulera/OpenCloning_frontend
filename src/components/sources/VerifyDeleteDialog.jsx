import { Button, Dialog, DialogActions, DialogTitle } from '@mui/material';
import React from 'react';

// You can override the downloadSequence function by passing a downloadCallback that takes the fileName and entity as arguments
function VerifyDeleteDialog({ dialogOpen, setDialogOpen, onClickDelete }) {
  return (
    <Dialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      className="verify-delete-dialog"
    >
      <DialogTitle>
        Delete this source and all its children?

      </DialogTitle>
      <DialogActions>
        <Button color="error" onClick={onClickDelete}>Delete</Button>
        <Button onClick={() => { setDialogOpen(false); }}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

export default VerifyDeleteDialog;
