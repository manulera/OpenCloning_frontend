import { batch, useDispatch, useStore } from 'react-redux';
import { jsonToGenbank } from '@teselagen/bio-parsers';
import useValidateState from './useValidateState';
import { convertToTeselaJson, loadHistoryFile } from '../utils/readNwrite';
import { getIdsOfEntitiesWithoutChildSource } from '../store/cloning_utils';
import { mergeStates, graftState } from '../utils/thunks';
import { cloningActions } from '../store/cloning';
import useDatabase from './useDatabase';

const { deleteSourceAndItsChildren, setState: setCloningState } = cloningActions;

export default function useLoadDatabaseFile({ source, sendPostRequest, setHistoryFileError }) {
  const dispatch = useDispatch();
  const validateState = useValidateState();
  const store = useStore();
  const database = useDatabase();

  const loadDatabaseFile = async (file, databaseId, ancestors = false) => {
    if (file.name.endsWith('.json')) {
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

        // Get primer names (in case they have changed with respect to what was in the file)
        // and verify that the sequence of the primer in the database is the same as the sequence in the cloning strategy
        const primerDatabaseIds = cloningStrategy.primers.filter((p) => p.database_id).map((p) => p.database_id);
        const databasePrimers = await Promise.all(primerDatabaseIds.map(database.getPrimer));
        databasePrimers.forEach((databasePrimer, index) => {
          const primerInCloningStrategy = cloningStrategy.primers.find((p) => p.database_id === databasePrimer.database_id);
          primerInCloningStrategy.name = databasePrimer.name;
          if (primerInCloningStrategy.sequence !== databasePrimer.sequence) {
            throw new Error(`The sequence of primer ${primerInCloningStrategy.name} (${primerInCloningStrategy.database_id}) conflicts with the sequence in the database`);
          }
        });

        // Get the sequence name from the database and update the cloning strategy with it if it is different
        await Promise.all(cloningStrategy.sources.filter((s) => s.database_id).map(async (cloningSource) => {
          const seqDatabaseId = cloningSource.database_id;
          const entity = cloningStrategy.entities.find((e) => e.id === cloningSource.output);
          const seq = convertToTeselaJson(entity);
          const databaseName = await database.getSequenceName(seqDatabaseId);
          if (seq.name !== databaseName) {
            seq.name = databaseName;
            const genbank = jsonToGenbank(seq);
            entity.file_content = genbank;
            // Maybe this is unnecessary
            cloningSource.output_name = databaseName;
          }
        }));
      } catch (e) {
        console.error(e);
        setHistoryFileError(e.message);
        return;
      }
      // This one won't have the source.id deleted
      const prevState = store.getState().cloning;

      batch(() => {
        // Replace the source with the new one if called from a source
        if (!ancestors) {
          dispatch(deleteSourceAndItsChildren(source.id));
        }
        const cloningState = store.getState().cloning;
        try {
          let mergedState;
          if (ancestors) {
            ({ mergedState } = graftState(cloningStrategy, cloningState, source.id));
          } else {
            ({ mergedState } = mergeStates(cloningStrategy, cloningState));
          }
          dispatch(setCloningState(mergedState));
          validateState(cloningStrategy);
        } catch (e) {
          setHistoryFileError(e.message);
          console.error(e);
          if (!ancestors) {
            dispatch(setCloningState(prevState));
          }
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
  return { loadDatabaseFile };
}
