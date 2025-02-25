import { cloneDeep } from 'lodash-es';
import { base64ToBlob, downloadStateAsJson, loadFilesToSessionStorage } from './readNwrite';
import { cloningActions } from '../store/cloning';
import { getUsedPrimerIds, shiftStateIds } from '../store/cloning_utils';

const { setState: setCloningState } = cloningActions;

const collectParentEntitiesAndSources = (source, sources, entities, entitiesToExport, sourcesToExport, stopAtDatabaseId = false) => {
  source.input.forEach((entityId) => {
    entitiesToExport.push(entities.find((e) => e.id === entityId));
    const parentSource = sources.find((s) => s.output === entityId);
    sourcesToExport.push(parentSource);
    if (stopAtDatabaseId && parentSource.database_id) {
      return;
    }
    collectParentEntitiesAndSources(parentSource, sources, entities, entitiesToExport, sourcesToExport, stopAtDatabaseId);
  });
};

export const getSubState = (state, id, stopAtDatabaseId = false) => {
  const { entities, sources, primers } = state.cloning;
  const entitiesToExport = entities.filter((e) => e.id === id);
  const sourcesToExport = sources.filter((s) => s.output === id);
  collectParentEntitiesAndSources(sourcesToExport[0], sources, entities, entitiesToExport, sourcesToExport, stopAtDatabaseId);
  const primerIdsToExport = getUsedPrimerIds(sourcesToExport);
  const primersToExport = primers.filter((p) => primerIdsToExport.includes(p.id));
  return { entities: entitiesToExport, sources: sourcesToExport, primers: primersToExport };
};

export const exportSubStateThunk = (fileName, entityId) => async (dispatch, getState) => {
  // Download the subHistory for a given entity
  const state = getState();
  const substate = getSubState(state, entityId);
  downloadStateAsJson({ ...substate, description: '' }, fileName);
};

export const shiftState = (newState, oldState, skipPrimers = false) => {
  const existingPrimerNames = oldState.primers.map((p) => p.name);

  if (newState.primers === undefined || newState.entities === undefined || newState.sources === undefined) {
    throw new Error('JSON file should contain at least keys: primers, sequences and sources');
  }
  if (newState.primers.length > 0 && skipPrimers) {
    throw new Error('Primers cannot be loaded when skipping primers');
  }
  if (newState.primers.some((p) => existingPrimerNames.includes(p.name))) {
    throw new Error('Primer name from loaded file exists in current session');
  }

  return shiftStateIds(newState, oldState, skipPrimers);
};

export const mergeStates = (newState, oldState, skipPrimers = false) => {
  const { shiftedState, networkShift } = shiftState(newState, oldState, skipPrimers);
  const mergedState = {
    sources: [...oldState.sources, ...shiftedState.sources],
    entities: [...oldState.entities, ...shiftedState.entities],
    primers: [...oldState.primers, ...shiftedState.primers],
    files: [...oldState.files, ...shiftedState.files],
  };
  return { mergedState, networkShift };
};

export const copyEntityThunk = (entityId) => async (dispatch, getState) => {
  const state = getState();
  const { entities, sources } = state.cloning;
  const entitiesToCopy = entities.filter((e) => e.id === entityId);
  const sourcesToCopy = sources.filter((s) => s.output === entityId);
  collectParentEntitiesAndSources(sourcesToCopy[0], sources, entities, entitiesToCopy, sourcesToCopy);
  const entityIds = entitiesToCopy.map((e) => e.id);
  const filesToCopy = state.cloning.files.filter((f) => entityIds.includes(f.sequence_id));
  const newState = cloneDeep({
    entities: entitiesToCopy,
    sources: sourcesToCopy,
    primers: [],
    files: filesToCopy,
  });
  const files = filesToCopy.map((f) => new File(
    [base64ToBlob(sessionStorage.getItem(`verification-${f.sequence_id}-${f.file_name}`))],
    `verification-${f.sequence_id}-${f.file_name}`,
    { type: 'application/octet-stream' },
  ));
  const { mergedState, networkShift } = mergeStates(newState, state.cloning, true);
  dispatch(setCloningState(mergedState));
  await loadFilesToSessionStorage(files, networkShift);
};
