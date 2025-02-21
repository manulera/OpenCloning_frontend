import React from 'react';
import ELabFTWCategorySelect from './ELabFTWCategorySelect';
import ELabFTWResourceSelect from './ELabFTWResourceSelect';
import ELabFTWFileSelect from './ELabFTWFileSelect';
import { getFileFromELabFTW } from './common';

function GetSequenceFileAndDatabaseIdComponent({ setFile, setDatabaseId }) {
  const [category, setCategory] = React.useState(null);
  const [resource, setResource] = React.useState(null);
  const [fileInfo, setFileInfo] = React.useState(null);

  // Reset if category changes
  React.useEffect(() => {
    setResource(null);
    setFileInfo(null);
    setFile(null);
    setDatabaseId(null);
  }, [category]);

  // Reset if resource changes
  React.useEffect(() => {
    setFileInfo(null);
    setFile(null);
    setDatabaseId(null);
  }, [resource]);

  React.useEffect(() => {
    setFile(null);
    setDatabaseId(null);
  }, [fileInfo]);

  React.useEffect(() => {
    const loadFile = async () => {
      if (!resource || !fileInfo) return;
      const file = await getFileFromELabFTW(resource.id, fileInfo);
      setFile(file);
      setDatabaseId(resource.id);
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
