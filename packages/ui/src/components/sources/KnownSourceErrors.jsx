import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import React from 'react';

function KnownSourceErrors({ errors }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  return (
    <>
      <Alert
        severity="error"
        action={(
          <Button color="inherit" size="small" onClick={() => setDialogOpen(true)}>
            See how
          </Button>
      )}
        sx={{ alignItems: 'center', mb: 1 }}
      >
        Affected by external errors
      </Alert>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      >
        <DialogTitle>Known external errors</DialogTitle>
        <DialogContent>
          <ul>
            {errors.map((error, i) => (
              <li style={{ marginBottom: '1em' }} key={i} component="li">
                {error}
              </li>
            ))}
          </ul>

        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpen(false);
            }}
          >
            Close
          </Button>

        </DialogActions>
      </Dialog>
    </>

  );
}

export default KnownSourceErrors;
