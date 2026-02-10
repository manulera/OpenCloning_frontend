import React from 'react'
import LocalSequenceFileSelect from '../form/LocalSequenceFileSelect';
import { Alert, LinearProgress } from '@mui/material';

function SourceLocalFile({ source, requestStatus, sendPostRequest }) {
  const onFileSelected = React.useCallback((file) => {
    const requestData = new FormData();
    requestData.append('file', file);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    sendPostRequest({ endpoint: 'read_from_file', requestData, config, source });
  }, [sendPostRequest, source]);

  return (
    <>
      <LocalSequenceFileSelect onFileSelected={onFileSelected} />
      { requestStatus.status === 'loading' && <LinearProgress /> }
      { requestStatus.status === 'error' && <Alert severity="error">{requestStatus.message}</Alert> }
    </>
  );
}

export default SourceLocalFile
