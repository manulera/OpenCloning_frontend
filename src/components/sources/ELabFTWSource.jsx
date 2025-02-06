import React from 'react';
import axios from 'axios';
import ElabFTWCategorySelect from '../form/eLabFTW/ElabFTWCategorySelect';
import ElabFTWResourceSelect from '../form/eLabFTW/ElabFTWResourceSelect';
import ElabFTWFileSelect from '../form/eLabFTW/ElabFTWFileSelect';
import SubmitButtonBackendAPI from '../form/SubmitButtonBackendAPI';

function ELabFTWSource({ source, requestStatus, sendPostRequest }) {
  const { id: sourceId } = source;
  const [category, setCategory] = React.useState(null);
  const [resource, setResource] = React.useState(null);
  const [fileInfo, setFileInfo] = React.useState(null);

  // Reset if category changes
  React.useEffect(() => {
    setResource(null);
    setFileInfo(null);
  }, [sourceId, category]);

  // Reset if resource changes
  React.useEffect(() => {
    setFileInfo(null);
  }, [sourceId, resource]);

  const onSubmit = async (e) => {
    e.preventDefault();
    // Read the file from eLabFTW
    const url = `https://localhost:443/api/v2/items/${resource.id}/uploads/${fileInfo.id}?format=binary`;
    const resp = await axios.get(url, { headers: { Authorization: import.meta.env.VITE_ELABFTW_API_KEY }, responseType: 'blob' });
    // Convert blob to file
    const file = new File([resp.data], fileInfo.real_name);
    const requestData = new FormData();
    requestData.append('file', file);
    const config = {
      headers: {
        'content-type': 'multipart/form-data',
      },
    };
    const modifySource = (s) => ({ ...s, database_id: { item_id: resource.id, sequence_id: fileInfo.id }, type: 'ELabFTWFileSource' });
    sendPostRequest({ endpoint: 'read_from_file', requestData, config, source, modifySource });
  };

  const apiKey = import.meta.env.VITE_ELABFTW_API_KEY;

  return (
    <form onSubmit={onSubmit}>
      <ElabFTWCategorySelect setCategory={setCategory} apiKey={apiKey} />
      {category && <ElabFTWResourceSelect setResource={setResource} categoryId={category.id} apiKey={apiKey} />}
      {resource && <ElabFTWFileSelect setFileInfo={setFileInfo} itemId={resource.id} apiKey={apiKey} />}
      {fileInfo && <SubmitButtonBackendAPI requestStatus={requestStatus}>Submit </SubmitButtonBackendAPI>}
    </form>
  );
}

export default ELabFTWSource;
