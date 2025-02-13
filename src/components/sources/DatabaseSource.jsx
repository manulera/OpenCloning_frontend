import React from 'react';

import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';
import useDatabase from '../../hooks/useDatabase';

function DatabaseSource({ source, requestStatus, sendPostRequest }) {
  const [file, setFile] = React.useState(null);
  const [databaseId, setDatabaseId] = React.useState(null);
  const database = useDatabase();

  const onSubmit = async (e) => {
    e.preventDefault();
    // Read the file from database
    const requestData = new FormData();
    requestData.append('file', file);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    const modifySource = (s) => ({ ...s, database_id: databaseId, type: 'DatabaseSource' });
    sendPostRequest({ endpoint: 'read_from_file', requestData, config, source, modifySource });
  };

  return (
    <form onSubmit={onSubmit}>
      {database && <database.GetSequenceFileAndDatabaseIdComponent setFile={setFile} setDatabaseId={setDatabaseId} />}
      {file && databaseId && <SubmitButtonBackendAPI requestStatus={requestStatus}>Submit </SubmitButtonBackendAPI>}
    </form>
  );
}

export default DatabaseSource;
