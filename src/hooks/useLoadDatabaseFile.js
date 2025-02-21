import React from 'react';
import { batch, useDispatch, useStore } from 'react-redux';
import useValidateState from './useValidateState';
import { loadHistoryFile } from '../utils/readNwrite';
import { getIdsOfEntitiesWithoutChildSource } from '../store/cloning_utils';
import { cloningActions } from '../store/cloning';
import { mergeStateThunk } from '../utils/thunks';

const { deleteSourceAndItsChildren, setState: setCloningState } = cloningActions;

export default function useLoadDatabaseFile({ source, sendPostRequest }) {
  const [historyFileError, setHistoryFileError] = React.useState(null);
  const dispatch = useDispatch();
  const validateState = useValidateState();
  const store = useStore();

  const loadDatabaseFile = async (file, databaseId) => {
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
        const prevState = store.getState().cloning;
        // Replace the source with the new one
        dispatch(deleteSourceAndItsChildren(source.id));
        try {
          dispatch(mergeStateThunk(cloningStrategy, false, []));
          validateState(cloningStrategy);
        } catch (e) {
          setHistoryFileError(e.message);
          console.error(e);
          dispatch(setCloningState(prevState));
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
  return { loadDatabaseFile, historyFileError };
}
