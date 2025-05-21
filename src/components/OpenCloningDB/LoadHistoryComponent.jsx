import { Button, CircularProgress } from '@mui/material';
import React from 'react';
import { openCloningDBHttpClient } from './common';
import RetryAlert from '../form/RetryAlert';

function LoadHistoryComponent({ handleClose, databaseId, loadDatabaseFile }) {
  const url = `/sequence/${databaseId}/cloning_strategy`;
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [retry, setRetry] = React.useState(0);
  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await openCloningDBHttpClient.get(url);
        const file = new File([JSON.stringify(response.data)], 'cloning_strategy.json', { type: 'application/json' });
        loadDatabaseFile(file, databaseId, true);
      } catch (e) {
        console.error(e);
        setError('Failed to load history file.');
      }
      setLoading(false);
    };
    fetchData();
  }, [url, retry]);
  return (
    <div>
      {loading && <CircularProgress />}
      {error && <RetryAlert onRetry={() => setRetry((prev) => prev + 1)}>{error}</RetryAlert>}
      <Button onClick={handleClose}>Close</Button>

    </div>
  );
}

export default LoadHistoryComponent;
