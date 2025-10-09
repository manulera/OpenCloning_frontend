import { cloneDeep } from 'lodash-es';
import { base64ToBlob, downloadStateAsJson, downloadStateAsZip, loadFilesToSessionStorage } from './readNwrite';
import { cloningActions } from '../store/cloning';
import { collectParentSequencesAndSources, getSubState, mergeStates } from './network';
import { getVerificationFileName } from '../store/cloning_utils';

const { setState: setCloningState } = cloningActions;

export const exportSubStateThunk = (fileName, sequenceId, format = 'json') => async (dispatch, getState) => {
  // Download the subHistory for a given sequence
  const state = getState();
  const substate = getSubState(state, sequenceId);
  if (format === 'json') {
    downloadStateAsJson({ ...substate, description: '' }, fileName);
  } else if (format === 'zip') {
    downloadStateAsZip({ ...substate, description: '' }, fileName);
  } else {
    throw new Error(`Invalid format: ${format}`);
  }
};

export const CopySequenceThunk = (sequenceId) => async (dispatch, getState) => {
  const state = getState();
  const { sequences, sources } = state.cloning;
  const sequencesToCopy = sequences.filter((e) => e.id === sequenceId);
  const sourcesToCopy = sources.filter((s) => s.id === sequenceId);
  const { parentSequences, parentSources } = collectParentSequencesAndSources(sourcesToCopy[0], sources, sequences);
  sequencesToCopy.push(...parentSequences);
  sourcesToCopy.push(...parentSources);
  const sequenceIds = sequencesToCopy.map((e) => e.id);
  const filesToCopy = state.cloning.files.filter((f) => sequenceIds.includes(f.sequence_id));
  const newState = cloneDeep({
    sequences: sequencesToCopy,
    sources: sourcesToCopy,
    primers: [],
    files: filesToCopy,
  });
  const files = filesToCopy.map((f) => new File(
    [base64ToBlob(sessionStorage.getItem(getVerificationFileName(f)))],
    getVerificationFileName(f),
    { type: 'application/octet-stream' },
  ));
  const { mergedState, idShift } = mergeStates(newState, state.cloning, true);
  dispatch(setCloningState(mergedState));
  await loadFilesToSessionStorage(files, idShift);
};
