import { cloneDeep } from 'lodash-es';
import { getUsedPrimerIds, mergePrimersInSource, shiftStateIds } from '../store/cloning_utils';

export function getParentNodes(node, entities, sources) {
  const parentEntities = entities.filter((entity) => node.source.input.includes(entity.id));

  return parentEntities.map((parentEntity) => {
    const parentSource = sources.find((source) => source.output === parentEntity.id);
    const parentNode = { source: parentSource, entity: parentEntity };
    return { ...parentNode, parentNodes: getParentNodes(parentNode, entities, sources) };
  });
}

function getAllSourceIdsInParentNodes(node) {
  const parentNodesSourceIds = node.parentNodes.map((parentNode) => parentNode.source.id);
  return parentNodesSourceIds.concat(node.parentNodes.flatMap((parentNode) => getAllSourceIdsInParentNodes(parentNode)));
}

function parentNodeSorter(a, b) {
  const aValue = getAllSourceIdsInParentNodes(a).concat(a.source.id);
  const bValue = getAllSourceIdsInParentNodes(b).concat(b.source.id);
  return Math.min(...aValue) - Math.min(...bValue);
}

export function constructNetwork(entities, sources) {
  const entitiesNoSeq = entities.map((entity) => ({ ...entity, sequence: '' }));
  const network = [];
  // To construct the network, we start by the elements of DNA that are not input for anything
  // and the sources that have no output
  const entityIdsThatAreInput = sources.reduce((result, source) => result.concat(source.input), []);
  const entitiesThatAreNotInput = entitiesNoSeq.filter((entity) => !entityIdsThatAreInput.includes(entity.id));

  const sourcesWithoutOutput = sources.filter((source) => source.output === null);

  entitiesThatAreNotInput.forEach((entity) => network.push({ entity, source: sources.find((s) => s.output === entity.id) }));
  sourcesWithoutOutput.forEach((source) => network.push({ entity: null, source }));

  const unsortedNetwork = network.map((node) => ({ ...node, parentNodes: getParentNodes(node, entitiesNoSeq, sources).sort(parentNodeSorter) }));

  return unsortedNetwork.sort(parentNodeSorter);
}

export function getAllParentSources(source, sources, parentSources = []) {
  const thisParentSources = source.input.map((input) => sources.find((s) => s.output === input));
  parentSources.push(...thisParentSources);
  thisParentSources.forEach((parentSource) => {
    getAllParentSources(parentSource, sources, parentSources);
  });
}

export function getSortedSourceIds(sources2sort, sources) {
  const sortedSources = [...sources2sort];
  sortedSources.sort((source1, source2) => {
    // We also include the source itself for sorting, in case of grafting state
    const parentSources1 = [source1];
    const parentSources2 = [source2];
    getAllParentSources(source1, sources, parentSources1);
    getAllParentSources(source2, sources, parentSources2);
    const parentSources1Ids = parentSources1.map((source) => source.id);
    const parentSources2Ids = parentSources2.map((source) => source.id);
    return Math.min(...parentSources1Ids) - Math.min(...parentSources2Ids);
  });
  return sortedSources.map((source) => source.id);
}

export const collectParentEntitiesAndSources = (source, sources, entities, entitiesToExport, sourcesToExport, stopAtDatabaseId = false) => {
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
  if (entitiesToExport.length === 0) {
    throw new Error(`Entity with id ${id} not found`);
  }
  if (sourcesToExport.length === 0) {
    throw new Error(`Source with output id ${id} not found`);
  }
  collectParentEntitiesAndSources(sourcesToExport[0], sources, entities, entitiesToExport, sourcesToExport, stopAtDatabaseId);
  const primerIdsToExport = getUsedPrimerIds(sourcesToExport);
  const primersToExport = primers.filter((p) => primerIdsToExport.includes(p.id));
  return { entities: entitiesToExport, sources: sourcesToExport, primers: primersToExport };
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

  let childEntities = [...childState.entities];
  if (graftEntityInChild && graftEntityInChild.type === 'TemplateSequence') {
    const updatedEntity = { ...graftEntityInParent, id: graftEntityInChild.id };
    childEntities = childEntities.filter((entity) => entity.id !== graftEntityInChild.id);
    childEntities.push(updatedEntity);
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
