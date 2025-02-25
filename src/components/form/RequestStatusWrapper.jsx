import React from 'react';
import { Alert } from '@mui/material';
import RetryAlert from './RetryAlert';

function RequestStatusWrapper({ children, requestStatus, retry, donorSites }) {
  if (requestStatus.status === 'success') {
    if (donorSites.length < 2) {
      return <Alert severity="error">The sequence must have at least two AttP sites</Alert>;
    }
    return children;
  }
  if (requestStatus.status === 'loading') {
    return <div>Loading...</div>;
  }
  if (requestStatus.status === 'error') {
    return <RetryAlert onRetry={retry} sx={{ margin: 'auto', width: '80%', my: 2 }}>{requestStatus.message}</RetryAlert>;
  }
  return null;
}

export default RequestStatusWrapper;
