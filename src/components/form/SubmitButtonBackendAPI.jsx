import { Alert, Button, CircularProgress } from '@mui/material';
import React from 'react';

function SubmitButtonBackendAPI({ requestStatus, children, ...other }) {
  return (
    <>
      <Button fullWidth type="submit" variant="contained" style={{ height: '2.5em' }} {...other}>
        {requestStatus.status !== 'loading' ? children : (<CircularProgress color="inherit" size="2em" />)}
      </Button>
      {requestStatus.status === 'error' && (<Alert sx={{ marginTop: '10px' }} severity="error">{requestStatus.message}</Alert>)}
    </>
  );
}

export default SubmitButtonBackendAPI;
