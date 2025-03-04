import { cloneDeep } from 'lodash-es';
import { base64ToBlob, downloadStateAsJson, loadFilesToSessionStorage } from './readNwrite';
import { cloningActions } from '../store/cloning';
import { getUsedPrimerIds, mergePrimersInSource, shiftStateIds } from '../store/cloning_utils';

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
  if (newState.primers === undefined || newState.entities === undefined || newState.sources === undefined) {
    throw new Error('JSON file should contain at least keys: primers, sequences and sources');
  }
  if (newState.primers.length > 0 && skipPrimers) {
    throw new Error('Primers cannot be loaded when skipping primers');
  }

  return shiftStateIds(newState, oldState, skipPrimers);
};

export function getGraftEntityId(parentState) {
  const entityIdsThatAreInput = parentState.sources.reduce((result, source) => result.concat(source.input), []);
  const entityIdsThatAreNotInput = parentState.entities.filter((entity) => !entityIdsThatAreInput.includes(entity.id)).map((entity) => entity.id);
  const sourcesWithoutOutput = parentState.sources.filter((source) => source.output === null);

  if (sourcesWithoutOutput.length === 0 && entityIdsThatAreNotInput.length === 1) {
    return entityIdsThatAreNotInput[0];
  }
  return null;
}

export function mergePrimersInState(mergedState) {
  const newState = cloneDeep(mergedState);
  const removedPrimerIds = [];
  for (let i = 0; i < newState.primers.length - 1; i++) {
    const p1 = newState.primers[i];
    for (let j = i + 1; j < newState.primers.length; j++) {
      const p2 = newState.primers[j];
      if (p1.name === p2.name) {
        if (p1.sequence === p2.sequence && p1.database_id === p2.database_id) {
          newState.sources = newState.sources.map((s) => mergePrimersInSource(s, p1.id, p2.id));
          removedPrimerIds.push(p2.id);
        } else {
          throw new Error(`Primer name ${p1.name} exists in current session but has different sequence or database_id`);
        }
      }
    }
  }
  newState.primers = newState.primers.filter((p) => !removedPrimerIds.includes(p.id));
  return newState;
}

export function graftState(parentState, childState, graftSourceId) {
  const { shiftedState: shiftedParentState, networkShift } = shiftState(parentState, childState);

  const graftEntityId = getGraftEntityId(shiftedParentState);
  if (graftEntityId === null) {
    throw new Error('Invalid parent state');
  }
  const graftEntityInParent = shiftedParentState.entities.find((entity) => entity.id === graftEntityId);

  const parentGraftSource = shiftedParentState.sources.find((source) => source.output === graftEntityId);
  const childGraftSource = childState.sources.find((source) => source.id === graftSourceId);
  const graftEntityInChild = childState.entities.find((entity) => entity.id === childGraftSource.output);
  const mergedSource = { ...parentGraftSource, id: childGraftSource.id, output: childGraftSource.output };

  const parentSources = shiftedParentState.sources.filter((source) => source.id !== parentGraftSource.id);
  const parentEntities = shiftedParentState.entities.filter((entity) => entity.id !== graftEntityId);
  const childSources = childState.sources.filter((source) => source.id !== childGraftSource.id);

  const childEntities = childState.entities.filter((entity) => entity.id !== graftEntityInChild.id);
  if (graftEntityInChild.type === 'TemplateSequence') {
    const updatedEntity = { ...graftEntityInParent, id: graftEntityInChild.id };
    childEntities.push(updatedEntity);
  } else {
    childEntities.push(graftEntityInChild);
  }

  let mergedState = {
    sources: [...parentSources, ...childSources, mergedSource],
    entities: [...parentEntities, ...childEntities],
    primers: [...shiftedParentState.primers, ...childState.primers],
    files: [...shiftedParentState.files, ...childState.files],
  };
  mergedState = mergePrimersInState(mergedState);
  return { mergedState, networkShift };
}

export const mergeStates = (newState, oldState, skipPrimers = false) => {
  const { shiftedState, networkShift } = shiftState(newState, oldState, skipPrimers);
  let mergedState = {
    sources: [...oldState.sources, ...shiftedState.sources],
    entities: [...oldState.entities, ...shiftedState.entities],
    primers: [...oldState.primers, ...shiftedState.primers],
    files: [...oldState.files, ...shiftedState.files],
  };
  if (!skipPrimers) {
    mergedState = mergePrimersInState(mergedState);
  }
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
