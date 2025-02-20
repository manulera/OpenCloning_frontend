import React from 'react';

import { batch, useDispatch } from 'react-redux';
import { Alert } from '@mui/material';
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';
import useDatabase from '../../hooks/useDatabase';
import { loadHistoryFile } from '../../utils/readNwrite';
import { mergeStateThunk } from '../../utils/thunks';
import useValidateState from '../../hooks/useValidateState';
import { cloningActions } from '../../store/cloning';
import { getIdsOfEntitiesWithoutChildSource } from '../../store/cloning_utils';

const { deleteSourceAndItsChildren, restoreSource } = cloningActions;

function SourceDatabase({ source, requestStatus, sendPostRequest }) {
  const [file, setFile] = React.useState(null);
  const [databaseId, setDatabaseId] = React.useState(null);
  const [historyFileError, setHistoryFileError] = React.useState(null);
  const database = useDatabase();
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
        // When importing sources that had inputs that we don't want to load, we need to add some templatesequences
        const allEntityIds = cloningStrategy.entities.map((e) => e.id);
        cloningStrategy.sources = cloningStrategy.sources.map((s) => {
          if (s.input.some((id) => !allEntityIds.includes(id))) {
            return { id: s.id, type: 'DatabaseSource', input: [], output: s.output, database_id: s.database_id };
          }
          return s;
        });
      } catch (e) {
        console.error(e);
        setHistoryFileError(e.message);
        return;
      }
      batch(() => {
        // Replace the source with the new one
        dispatch(deleteSourceAndItsChildren(source.id));
        try {
          dispatch(mergeStateThunk(cloningStrategy, false, []));
          validateState(cloningStrategy);
        } catch (e) {
          setHistoryFileError(e.message);
          dispatch(restoreSource({ ...source, type: 'DatabaseSource' }));
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
      {historyFileError && <Alert severity="error">{historyFileError}</Alert>}
      {file && databaseId && <SubmitButtonBackendAPI requestStatus={requestStatus}>Submit </SubmitButtonBackendAPI>}

    </form>
  );
}

export default SourceDatabase;
