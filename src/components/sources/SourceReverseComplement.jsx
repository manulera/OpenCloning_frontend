import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { getInputSequencesFromSourceId } from '../../store/cloning_utils';
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';

function SourceReverseComplement({ source, requestStatus, sendPostRequest }) {
  const { id: sourceId } = source;
  const inputSequences = useSelector((state) => getInputSequencesFromSourceId(state, sourceId), shallowEqual);
  const onSubmit = (event) => {
    event.preventDefault();

    const requestData = {
      sequences: inputSequences,
      source: { id: sourceId, input: inputSequences.map((e) => e.id) },
    };
    sendPostRequest({ endpoint: 'reverse_complement', requestData, source });
  };
    // No need for MultipleOutputsSelector, since there is only one output
  return (
    <div className="ReverseComplementSource">
      <form onSubmit={onSubmit}>
        <SubmitButtonBackendAPI requestStatus={requestStatus}>
          Reverse complement
        </SubmitButtonBackendAPI>
      </form>
    </div>
  );
}

export default SourceReverseComplement;
