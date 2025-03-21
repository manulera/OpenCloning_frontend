import { cloneDeep } from 'lodash-es';
import { base64ToBlob, downloadStateAsJson, loadFilesToSessionStorage } from './readNwrite';
import { cloningActions } from '../store/cloning';
import { collectParentSequencesAndSources, getSubState, mergeStates } from './network';

const { setState: setCloningState } = cloningActions;

export const exportSubStateThunk = (fileName, sequenceId) => async (dispatch, getState) => {
  // Download the subHistory for a given sequence
  const state = getState();
  const substate = getSubState(state, sequenceId);
  downloadStateAsJson({ ...substate, description: '' }, fileName);
};

export const CopySequenceThunk = (sequenceId) => async (dispatch, getState) => {
  const state = getState();
  const { sequences, sources } = state.cloning;
  const sequencesToCopy = sequences.filter((e) => e.id === sequenceId);
  const sourcesToCopy = sources.filter((s) => s.output === sequenceId);
  collectParentSequencesAndSources(sourcesToCopy[0], sources, sequences, sequencesToCopy, sourcesToCopy);
  const sequenceIds = sequencesToCopy.map((e) => e.id);
  const filesToCopy = state.cloning.files.filter((f) => sequenceIds.includes(f.sequence_id));
  const newState = cloneDeep({
    sequences: sequencesToCopy,
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
