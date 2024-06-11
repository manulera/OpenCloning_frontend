import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { Alert } from '@mui/material';
import useBackendAPI from '../../hooks/useBackendAPI';
import { getInputEntitiesFromSourceId } from '../../store/cloning_utils';
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';

function SourcePolymeraseExtension({ source }) {
  const { id: sourceId } = source;
  const inputSequences = useSelector((state) => getInputEntitiesFromSourceId(state, sourceId), shallowEqual);
  const { overhang_crick_3prime, overhang_watson_3prime } = inputSequences[0];
  const invalidInput = (overhang_crick_3prime >= 0) && (overhang_watson_3prime >= 0);
  const { requestStatus, sendPostRequest } = useBackendAPI();
  const onSubmit = (event) => {
    event.preventDefault();

    const requestData = {
      sequences: inputSequences,
      source: { id: sourceId, input: inputSequences.map((e) => e.id) },
    };
    sendPostRequest({ endpoint: 'polymerase_extension', requestData, source });
  };
  // No need for MultipleOutputsSelector, since there is only one output
  return (
    <div className="PolymeraseExtensionSource">
      <form onSubmit={onSubmit}>
        {invalidInput ? (
          <Alert severity="error">
            <strong>Invalid input:</strong>
            {' '}
            no 5&apos; overhangs.
          </Alert>
        ) : (
          <SubmitButtonBackendAPI requestStatus={requestStatus}>
            Extend with polymerase
          </SubmitButtonBackendAPI>
        )}
      </form>
    </div>
  );
}

export default SourcePolymeraseExtension;
