import React from 'react'
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';

function SourceKnownGenomeRegion({ source, requestStatus, sendPostRequest }) {
  // A source where we pass a complete GenomeCoordinatesSource, so we just have to make the request
  const [connectAttempt, setConnectAttempt] = React.useState(0);
  React.useEffect(() => {
    const requestData = {
      ...source,
      type: 'GenomeCoordinatesSource',
    };
    sendPostRequest({ endpoint: 'genome_coordinates', requestData, source });
  }, [connectAttempt]);

  if (requestStatus.status === 'error') {

    return (
      <div>
      <div style={{ marginBottom: '1em', marginTop: '2em' }}>Could not retrieve genome sequence.</div>
      <SubmitButtonBackendAPI requestStatus={requestStatus} onClick={() => setConnectAttempt(connectAttempt + 1)}>Retry</SubmitButtonBackendAPI>
      </div>
  )
  }
  if (requestStatus.status === 'loading') {
    return <div style={{ marginBottom: '1em', marginTop: '2em' }}>Loading genome sequence...</div>
  }
  return null;
}

export default SourceKnownGenomeRegion;
