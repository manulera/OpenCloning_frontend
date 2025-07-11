import { cloneDeep } from 'lodash-es';
import { getUsedPrimerIds, mergePrimersInSource, shiftStateIds } from '../store/cloning_utils';

export function getParentNodes(node, sequences, sources) {
  const parentSequences = sequences.filter((sequence) => node.source.input.includes(sequence.id));

  return parentSequences.map((parentSequence) => {
    const parentSource = sources.find((source) => source.id === parentSequence.id);
    const parentNode = { source: parentSource, sequence: parentSequence };
    return { ...parentNode, parentNodes: getParentNodes(parentNode, sequences, sources) };
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

export function constructNetwork(sequences, sources) {
  const sequencesNoSeq = sequences.map((seq) => ({ ...seq, sequence: '' }));
  const network = [];
  // To construct the network, we start by the elements of DNA that are not input for anything
  // and the sources that have no output
  const sequenceIdsThatAreInput = sources.reduce((result, source) => result.concat(source.input), []);
  const sequencesThatAreNotInput = sequencesNoSeq.filter((sequence) => !sequenceIdsThatAreInput.includes(sequence.id));

  const sourcesWithoutOutput = sources.filter((source) => source.output === null);

  sequencesThatAreNotInput.forEach((sequence) => network.push({ sequence, source: sources.find((s) => s.output === sequence.id) }));
  sourcesWithoutOutput.forEach((source) => network.push({ sequence: null, source }));

  const unsortedNetwork = network.map((node) => ({ ...node, parentNodes: getParentNodes(node, sequencesNoSeq, sources).sort(parentNodeSorter) }));

  return unsortedNetwork.sort(parentNodeSorter);
}

export function getSourcesTakingSequenceAsInput(sources, sequenceId) {
  return sources.filter((s) => s.input.some(({sequence}) => sequence === sequenceId));
}

export function getImmediateParentSources(sources, source) {
  const parentIds = source.input.map(({sequence}) => sequence);
  return sources.filter((s) => parentIds.includes(s.id));
}

export function getAllParentSources(source, sources, stopAtDatabaseId = false, parentSources = []) {
  const thisParentSources = getImmediateParentSources(sources, source);
  parentSources.push(...thisParentSources);
  thisParentSources.forEach((parentSource) => {
    if (stopAtDatabaseId && parentSource.database_id) {
      return;
    }
    getAllParentSources(parentSource, sources, stopAtDatabaseId, parentSources);
  });
  return parentSources;
}

export function getSortedSourceIds(sources2sort, sources) {
  const sortedSources = [...sources2sort];
  sortedSources.sort((source1, source2) => {
    // We also include the source itself for sorting, in case of grafting state
    const parentSources1 = getAllParentSources(source1, sources);
    const parentSources2 = getAllParentSources(source2, sources);
    const parentSources1Ids = parentSources1.map((source) => source.id);
    const parentSources2Ids = parentSources2.map((source) => source.id);
    return Math.min(...parentSources1Ids) - Math.min(...parentSources2Ids);
  });
  return sortedSources.map((source) => source.id);
}

export const collectParentSequencesAndSources = (source, sources, sequences, stopAtDatabaseId = false) => {
  const parentSources = getAllParentSources(source, sources, stopAtDatabaseId);
  const parentSourceIds = parentSources.map((s) => s.id);
  const parentSequences = sequences.filter((s) => parentSourceIds.includes(s.id));
  return { parentSources, parentSequences };
};

export const getSubState = (state, id, stopAtDatabaseId = false) => {
  const { sequences, sources, primers, appInfo } = state.cloning;
  const sequencesToExport = sequences.filter((e) => e.id === id);
  const sourcesToExport = sources.filter((s) => s.id === id);
  if (sequencesToExport.length === 0) {
    throw new Error(`Sequence with id ${id} not found`);
  }
  if (sourcesToExport.length === 0) {
    throw new Error(`Source with output id ${id} not found`);
  }
  const { parentSources, parentSequences } = collectParentSequencesAndSources(sourcesToExport[0], sources, sequences, stopAtDatabaseId);
  sequencesToExport.push(...parentSequences);
  sourcesToExport.push(...parentSources);

  const primerIdsToExport = getUsedPrimerIds(sourcesToExport);
  const primersToExport = primers.filter((p) => primerIdsToExport.includes(p.id));
  return { sequences: sequencesToExport, sources: sourcesToExport, primers: primersToExport, appInfo };
};

export const shiftState = (newState, oldState, skipPrimers = false) => {
  if (newState.primers === undefined || newState.sequences === undefined || newState.sources === undefined) {
    throw new Error('JSON file should contain at least keys: primers, sequences and sources');
  }
  if (newState.primers.length > 0 && skipPrimers) {
    throw new Error('Primers cannot be loaded when skipping primers');
  }

  return shiftStateIds(newState, oldState, skipPrimers);
};

export function getGraftSequenceId(parentState) {
  const sequenceIdsThatAreInput = parentState.sources.reduce((result, source) => result.concat(source.input), []);
  const sequenceIdsThatAreNotInput = parentState.sequences.filter((sequence) => !sequenceIdsThatAreInput.includes(sequence.id)).map((seq) => seq.id);
  const sourcesWithoutOutput = parentState.sources.filter((source) => source.output === null);

  if (sourcesWithoutOutput.length === 0 && sequenceIdsThatAreNotInput.length === 1) {
    return sequenceIdsThatAreNotInput[0];
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
        const sameDatabaseId = (!Boolean(p1.database_id) && !Boolean(p2.database_id)) || p1.database_id === p2.database_id;
        if (p1.sequence === p2.sequence && sameDatabaseId) {
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
  const { shiftedState: shiftedParentState, idShift } = shiftState(parentState, childState);

  const graftSequenceId = getGraftSequenceId(shiftedParentState);
  if (graftSequenceId === null) {
    throw new Error('Invalid parent state');
  }
  const graftSequenceInParent = shiftedParentState.sequences.find((seq) => seq.id === graftSequenceId);

  const parentGraftSource = shiftedParentState.sources.find((source) => source.id === graftSequenceId);
  const childGraftSource = childState.sources.find((source) => source.id === graftSourceId);
  const graftSequenceInChild = childState.sequences.find((seq) => seq.id === childGraftSource.id);
  const mergedSource = { ...parentGraftSource, id: childGraftSource.id };

  const parentSources = shiftedParentState.sources.filter((source) => source.id !== parentGraftSource.id);
  const parentSequences = shiftedParentState.sequences.filter((seq) => seq.id !== graftSequenceId);
  const childSources = childState.sources.filter((source) => source.id !== childGraftSource.id);

  let childSequences = [...childState.sequences];
  if (graftSequenceInChild && graftSequenceInChild.type === 'TemplateSequence') {
    const updatedSequence = { ...graftSequenceInParent, id: graftSequenceInChild.id };
    childSequences = childSequences.filter((seq) => seq.id !== graftSequenceInChild.id);
    childSequences.push(updatedSequence);
  }

  let mergedState = {
    sources: [...parentSources, ...childSources, mergedSource],
    sequences: [...parentSequences, ...childSequences],
    primers: [...shiftedParentState.primers, ...childState.primers],
    files: [...shiftedParentState.files, ...childState.files],
  };
  mergedState = mergePrimersInState(mergedState);
  return { mergedState, idShift };
}

export const mergeStates = (newState, oldState, skipPrimers = false) => {
  const { shiftedState, idShift } = shiftState(newState, oldState, skipPrimers);
  let mergedState = {
    sources: [...oldState.sources, ...shiftedState.sources],
    sequences: [...oldState.sequences, ...shiftedState.sequences],
    primers: [...oldState.primers, ...shiftedState.primers],
    files: [...oldState.files, ...shiftedState.files],
  };
  if (!skipPrimers) {
    mergedState = mergePrimersInState(mergedState);
  }
  return { mergedState, idShift };
};
