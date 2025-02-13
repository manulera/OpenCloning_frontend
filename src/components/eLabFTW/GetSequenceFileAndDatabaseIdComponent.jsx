import React from 'react';
import axios from 'axios';
import ELabFTWCategorySelect from './ELabFTWCategorySelect';
import ELabFTWResourceSelect from './ELabFTWResourceSelect';
import ELabFTWFileSelect from './ELabFTWFileSelect';

function GetSequenceFileAndDatabaseIdComponent({ setFile, setDatabaseId }) {
  const [category, setCategory] = React.useState(null);
  const [resource, setResource] = React.useState(null);
  const [fileInfo, setFileInfo] = React.useState(null);

  // Reset if category changes
  React.useEffect(() => {
    setResource(null);
    setFileInfo(null);
  }, [category]);

  // Reset if resource changes
  React.useEffect(() => {
    setFileInfo(null);
  }, [resource]);

  React.useEffect(() => {
    const loadFile = async () => {
      if (!resource || !fileInfo) return;
      const url = `https://localhost:443/api/v2/items/${resource.id}/uploads/${fileInfo.id}?format=binary`;
      const resp = await axios.get(url, { headers: { Authorization: import.meta.env.VITE_ELABFTW_API_KEY }, responseType: 'blob' });
      // Convert blob to file
      const file = new File([resp.data], fileInfo.real_name);
      setFile(file);
      setDatabaseId({ item_id: resource.id, sequence_id: fileInfo.id });
    };

    loadFile();
  }, [resource, fileInfo]);

  return (
    <>
      <ELabFTWCategorySelect fullWidth setCategory={setCategory} />
      {category && <ELabFTWResourceSelect fullWidth setResource={setResource} categoryId={category.id} />}
      {resource && <ELabFTWFileSelect fullWidth setFileInfo={setFileInfo} itemId={resource.id} />}
    </>
  );
}

export default GetSequenceFileAndDatabaseIdComponent;
