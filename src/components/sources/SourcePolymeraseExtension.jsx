import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { Alert } from '@mui/material';
import useBackendAPI from '../../hooks/useBackendAPI';
import { getInputEntitiesFromSourceId } from '../../store/cloning_utils';
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';

function SourcePolymeraseExtension({ sourceId }) {
  const inputEntities = useSelector((state) => getInputEntitiesFromSourceId(state, sourceId), shallowEqual);
  const { overhang_crick_3prime, overhang_watson_3prime } = inputEntities[0].sequence;
  const invalidInput = (overhang_crick_3prime >= 0) && (overhang_watson_3prime >= 0);
  const { requestStatus, sendPostRequest } = useBackendAPI(sourceId);
  const onSubmit = (event) => {
    event.preventDefault();

    const requestData = {
      sequences: inputEntities,
      source: { input: inputEntities.map((e) => e.id) },
    };
    sendPostRequest('polymerase_extension', requestData);
  };
  // No need for MultipleOutputsSelector, since there is only one output
  return (
    <div className="polymerase_extension">
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
