import { Button } from '@mui/material';
import React from 'react';
import axios from 'axios';
import { baseUrl, getFileFromELabFTW, readHeaders } from './common';

function LoadHistoryComponent({ handleClose, databaseId, loadDatabaseFile }) {
  const url = `${baseUrl}/api/v2/items/${databaseId.item_id}`;

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(url, { headers: readHeaders });
        const { uploads } = response.data;
        const historyFiles = uploads.filter((upload) => upload.real_name.endsWith('history.json'));
        if (historyFiles.length === 1) {
          const file = await getFileFromELabFTW(databaseId.item_id, historyFiles[0]);
          loadDatabaseFile(file, databaseId, true);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, [url]);
  return (
    <div>
      <Button onClick={handleClose}>Close</Button>
    </div>
  );
}

export default LoadHistoryComponent;
