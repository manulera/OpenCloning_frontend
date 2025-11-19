import React from 'react';
import { useDispatch, useStore } from 'react-redux';
import useAlerts from '../../hooks/useAlerts';
import { jsonToGenbank } from '@teselagen/bio-parsers';
import { cloningActions } from '../../store/cloning';

const { updateSequence } = cloningActions;

export default function useUpdateAnnotationInMainSequence() {
  const store = useStore();
  const { addAlert } = useAlerts();
  const dispatch = useDispatch();

  const updateFunction = React.useCallback(() => {
    const state = store.getState();
    const mainSequenceId = state.cloning.mainSequenceId;
    const currentSequenceData = state.cloning.teselaJsonCache[mainSequenceId];
    const newSequenceData = state.VectorEditor.mainEditor.sequenceData;
    const mainSequence = state.cloning.sequences.find((s) => s.id === mainSequenceId);
    const newSequence = { ...mainSequence, file_content: jsonToGenbank(newSequenceData) };
    if (currentSequenceData.sequence.toUpperCase() === newSequenceData.sequence.toUpperCase()) {
      addAlert({
        message: 'Annotation updated',
        severity: 'success',
      });
      dispatch(updateSequence(newSequence));
    } else {
      addAlert({
        message: 'Sequences are different!',
        severity: 'error',
      });
    }
  }, [store, addAlert, dispatch]);
  return updateFunction;
};
