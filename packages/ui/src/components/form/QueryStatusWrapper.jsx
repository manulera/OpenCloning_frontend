import React from 'react';
import { Alert, CircularProgress } from '@mui/material';
import RetryAlert from './RetryAlert';

export default function QueryStatusWrapper({
  children,
  queryResult,
  loadingMessage = 'Loading...',
  errorMessage = 'Could not load options',
}) {
  const { isLoading, isError, refetch } = queryResult;

  if (isError) {
    return (
      <RetryAlert onRetry={refetch} sx={{ alignItems: 'center' }}>
        {errorMessage}
      </RetryAlert>
    );
  }

  if (isLoading) {
    return (
      <Alert severity="info" icon={<CircularProgress color="inherit" size="1em" />}>
        {loadingMessage}
      </Alert>
    );
  }

  return children;
}
