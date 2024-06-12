import React from 'react';
import FormHelperText from '@mui/material/FormHelperText';
import MultipleOutputsSelector from './MultipleOutputsSelector';
import useBackendAPI from '../../hooks/useBackendAPI';
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';

// A component providing an interface to import a file
function SourceFile({ source }) {
  const { id: sourceId } = source;
  const { requestStatus, sources, entities, sendPostRequest } = useBackendAPI();
  const onChange = (event) => {
    const files = Array.from(event.target.files);
    const requestData = new FormData();
    requestData.append('file', files[0]);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    sendPostRequest({ endpoint: 'read_from_file', requestData, config, source });
  };

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()}>
        <SubmitButtonBackendAPI
          component="label"
          requestStatus={requestStatus}
        >
          Select File
          <input
            type="file"
            hidden
            onChange={onChange}
          />
        </SubmitButtonBackendAPI>
        <FormHelperText>Supports .gb, .dna and fasta</FormHelperText>
      </form>
      <MultipleOutputsSelector {...{
        sources, entities, sourceId,
      }}
      />
    </>
  );
}

export default SourceFile;
