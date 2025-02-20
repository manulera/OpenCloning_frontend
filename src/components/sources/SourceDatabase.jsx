import React from 'react';

import { batch, useDispatch } from 'react-redux';
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';
import useDatabase from '../../hooks/useDatabase';
import { loadHistoryFile } from '../../utils/readNwrite';
import useAlerts from '../../hooks/useAlerts';
import { mergeStateThunk } from '../../utils/thunks';
import useValidateState from '../../hooks/useValidateState';
import { cloningActions } from '../../store/cloning';
import { getIdsOfEntitiesWithoutChildSource } from '../../store/cloning_utils';

const { deleteSourceAndItsChildren, restoreSource } = cloningActions;

function SourceDatabase({ source, requestStatus, sendPostRequest }) {
  const [file, setFile] = React.useState(null);
  const [databaseId, setDatabaseId] = React.useState(null);
  const database = useDatabase();
  const setAlert = useAlerts();
  const dispatch = useDispatch();
  const validateState = useValidateState();

  const onSubmit = async (e) => {
    e.preventDefault();
    // Read the file from database
    if (file.name.endsWith('.zip') || file.name.endsWith('.json')) {
      let cloningStrategy;
      try {
        ({ cloningStrategy } = await loadHistoryFile(file));
        // If the cloning strategy should end on a single sequence, set the databaseId for the right source
        const terminalEntities = getIdsOfEntitiesWithoutChildSource(cloningStrategy.sources, cloningStrategy.entities);
        if (terminalEntities.length === 1) {
          const lastSource = cloningStrategy.sources.find((s) => s.output === terminalEntities[0]);
          lastSource.database_id = databaseId;
        }
      } catch (e) {
        console.error(e);
        setAlert({ message: e.message, severity: 'error' });
        return;
      }
      batch(() => {
        // Replace the source with the new one
        dispatch(deleteSourceAndItsChildren(source.id));
        try {
          dispatch(mergeStateThunk(cloningStrategy, false, []));
          validateState(cloningStrategy);
        } catch (e) {
          setAlert({ message: e.message, severity: 'error' });
          dispatch(restoreSource({ ...source, type: 'UploadedFileSource' }));
        }
      });
    } else {
      const requestData = new FormData();
      requestData.append('file', file);
      const config = {
        headers: {
          'content-type': 'multipart/form-data',
        },
      };
      const modifySource = (s) => ({ ...s, database_id: databaseId });
      sendPostRequest({ endpoint: 'read_from_file', requestData, config, source, modifySource });
    }
  };

  return (
    <form onSubmit={onSubmit}>
      {database && <database.GetSequenceFileAndDatabaseIdComponent setFile={setFile} setDatabaseId={setDatabaseId} />}
      {file && databaseId && <SubmitButtonBackendAPI requestStatus={requestStatus}>Submit </SubmitButtonBackendAPI>}
    </form>
  );
}

export default SourceDatabase;
