import React, { useCallback } from 'react';
import ELabFTWCategorySelect from './ELabFTWCategorySelect';
import ELabFTWResourceSelect from './ELabFTWResourceSelect';

function GetPrimerComponent({ primer, setPrimer, setError }) {
  const [category, setCategory] = React.useState(null);

  React.useEffect(() => {
    if (category === null) {
      setPrimer(null);
    }
  }, [category]);

  const handleResourceSelect = useCallback(async (resource) => {
    if (resource === null) {
      setPrimer(null);
      return;
    }
    let sequence;
    try {
      sequence = JSON.parse(resource.metadata).extra_fields?.sequence?.value;
      if (!sequence) {
        setError('No sequence found in metadata');
        return;
      }
    } catch (e) {
      setError('No sequence found in metadata');
      return;
    }

    setPrimer({ name: resource.title, sequence, database_id: resource.id });
  }, [setPrimer, setError]);

  return (
    <>
      <ELabFTWCategorySelect
        setCategory={setCategory}
        fullWidth
      />

      {category && (
      <ELabFTWResourceSelect
        setResource={handleResourceSelect}
        categoryId={category.id}
        fullWidth
      />
      )}
    </>
  );
}

export default GetPrimerComponent;
