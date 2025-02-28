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

export function graftState(parentState, childState, graftSourceId) {
  // Find the source in the parent state that should be merged with the graft source
  const entityIdsThatAreInput = parentState.sources.reduce((result, source) => result.concat(source.input), []);
  const entityIdsThatAreNotInput = parentState.entities.filter((entity) => !entityIdsThatAreInput.includes(entity.id)).map((entity) => entity.id);
  const sourcesWithoutOutput = parentState.sources.filter((source) => source.output === null);

  if (sourcesWithoutOutput.length > 0 || entityIdsThatAreNotInput.length !== 1) {
    throw new Error('Invalid parent state');
  }

  const parentGraftSource = parentState.sources.find((source) => source.output === entityIdsThatAreNotInput[0]);
  const childGraftSource = childState.sources.find((source) => source.id === graftSourceId);
  const mergedSource = { ...parentGraftSource, id: childGraftSource.id, output: childGraftSource.output };

  const parentSources = parentState.sources.filter((source) => source.id !== parentGraftSource.id);
  const parentEntities = parentState.entities.filter((entity) => entity.id !== entityIdsThatAreNotInput[0]);
  const childSources = childState.sources.filter((source) => source.id !== childGraftSource.id);

  return {
    sources: [...parentSources, ...childSources, mergedSource],
    entities: [...parentEntities, ...childState.entities],
    primers: [...parentState.primers, ...childState.primers],
    files: [...parentState.files, ...childState.files],
  };
}

export function getAllParentSources(source, sources, parentSources = []) {
  const thisParentSources = source.input.map((input) => sources.find((s) => s.output === input));
  parentSources.push(...thisParentSources);
  thisParentSources.forEach((parentSource) => {
    getAllParentSources(parentSource, sources, parentSources);
  });
}
