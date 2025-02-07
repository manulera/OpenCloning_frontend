import React, { useState, useCallback } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import Alert from '@mui/material/Alert';
import { Button, TextField } from '@mui/material';
import ElabFTWResourceSelect from '../../form/eLabFTW/ElabFTWResourceSelect';
import ElabFTWCategorySelect from '../../form/eLabFTW/ElabFTWCategorySelect';
import './styles.css';

const apiKey = import.meta.env.VITE_ELABFTW_API_KEY;

function PrimerDatabaseImportForm({ submitPrimer, cancelForm }) {
  const existingNames = useSelector((state) => state.cloning.primers.map((p) => p.name), shallowEqual);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPrimer, setSelectedPrimer] = useState(null);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (selectedCategory === null) {
      setSelectedPrimer(null);
    }
  }, [selectedCategory]);

  const handleResourceSelect = useCallback(async (resource) => {
    try {
      if (resource === null) {
        setSelectedPrimer(null);
        return;
      }
      let sequence;
      try {
        sequence = JSON.parse(resource.metadata).extra_fields?.sequence?.value;
        if (!sequence) {
          throw new Error('No sequence found in metadata');
        }
      } catch (e) {
        throw new Error('No sequence found in metadata');
      }
      if (!/^[ACGT]+$/.test(sequence.toUpperCase())) {
        throw new Error('Sequence contains invalid characters');
      }

      if (existingNames.includes(resource.title)) {
        setError(`A primer with name "${resource.title}" already exists`);
        setSelectedPrimer(null);
      } else {
        setError('');
        setSelectedPrimer({
          name: resource.title,
          sequence,
          database_id: resource.id,
        });
      }
    } catch (e) {
      setSelectedPrimer(null);
      setError(e.message);
    }
  }, [existingNames]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (selectedPrimer) {
      submitPrimer(selectedPrimer);
      setSelectedPrimer(null);
    }
  };

  return (
    <form className="primer-row" onSubmit={onSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1em', width: '80%', margin: 'auto' }}>
        <div style={{ display: 'flex', gap: '2em', alignItems: 'center', justifyContent: 'center' }}>
          <ElabFTWCategorySelect
            setCategory={setSelectedCategory}
            apiKey={apiKey}
            fullWidth
          />

          {selectedCategory && (
            <ElabFTWResourceSelect
              setResource={handleResourceSelect}
              categoryId={selectedCategory.id}
              apiKey={apiKey}
              fullWidth
            />
          )}
        </div>
        {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
        )}
        {selectedPrimer && (
          <div style={{ display: 'flex', gap: '1em', alignItems: 'center' }}>
            <TextField
              label="Sequence"
              value={selectedPrimer.sequence}
              className="sequence"
              disabled
              fullWidth
              InputProps={{
                sx: {
                  fontFamily: 'monospace',
                },
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '1em', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            color="error"
            onClick={cancelForm}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            disabled={!selectedPrimer}
          >
            Import Primer
          </Button>
        </div>

      </div>

      {selectedPrimer && (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '1em' }} />
      )}

    </form>
  );
}

export default PrimerDatabaseImportForm;
