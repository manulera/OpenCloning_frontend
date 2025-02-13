import { cloneDeep } from 'lodash-es';
import { base64ToBlob, downloadStateAsJson, loadFilesToSessionStorage } from './readNwrite';
import { cloningActions } from '../store/cloning';
import { shiftStateIds } from '../store/cloning_utils';

const { setState: setCloningState } = cloningActions;

const collectParentEntitiesAndSources = (source, sources, entities, entitiesToExport, sourcesToExport) => {
  source.input.forEach((entityId) => {
    entitiesToExport.push(entities.find((e) => e.id === entityId));
    const parentSource = sources.find((s) => s.output === entityId);
    sourcesToExport.push(parentSource);
    collectParentEntitiesAndSources(parentSource, sources, entities, entitiesToExport, sourcesToExport);
  });
};

export const getSubState = (state, id) => {
  const { entities, sources, primers } = state.cloning;
  const entitiesToExport = entities.filter((e) => e.id === id);
  const sourcesToExport = sources.filter((s) => s.output === id);
  collectParentEntitiesAndSources(sourcesToExport[0], sources, entities, entitiesToExport, sourcesToExport);
  return { entities: entitiesToExport, sources: sourcesToExport, primers };
};

export const exportSubStateThunk = (fileName, entityId) => async (dispatch, getState) => {
  // Download the subHistory for a given entity
  const state = getState();
  const substate = getSubState(state, entityId);
  downloadStateAsJson({ ...substate, description: '' }, fileName);
};

export const mergeStateThunk = (newState, skipPrimers = false, files = []) => (dispatch, getState) => {
  const { cloning: oldState } = getState();
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

  const { newState2, networkShift } = shiftStateIds(newState, oldState, skipPrimers);
  try {
    dispatch(setCloningState({
      sources: [...oldState.sources, ...newState2.sources],
      entities: [...oldState.entities, ...newState2.entities],
      primers: [...oldState.primers, ...newState2.primers],
      files: [...oldState.files, ...newState2.files],
    }));
  } catch (e) {
    throw new Error('Failed to merge state');
  }

  loadFilesToSessionStorage(files, networkShift);
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
  dispatch(mergeStateThunk(newState, true, files));
};
