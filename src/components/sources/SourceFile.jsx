import React from 'react';
import MultipleOutputsSelector from './MultipleOutputsSelector';
import useBackendAPI from '../../hooks/useBackendAPI';

// A component provinding an interface to import a file
function SourceFile({ sourceId }) {
  const { waitingMessage, sources, entities, sendRequest } = useBackendAPI(sourceId);
  const onChange = (event) => {
    const files = Array.from(event.target.files);
    const formData = new FormData();
    formData.append('file', files[0]);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    sendRequest('read_from_file', formData, config);
  };

  return (
    <div>
      <h3 className="header-nodes">Submit a file</h3>
      <p>Ideally a '.gb' or '.dna' file with annotations, but will also take FASTA</p>
      <input type="file" onChange={onChange} />
      <div>{waitingMessage}</div>
      <MultipleOutputsSelector {...{
        sources, entities, sourceId
      }}
      />

    </div>
  );
}

export default SourceFile;
