import React, { useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import ElabFTWResourceSelect from '../../form/eLabFTW/ElabFTWResourceSelect';
import ElabFTWCategorySelect from '../../form/eLabFTW/ElabFTWCategorySelect';
import './styles.css';

const apiKey = import.meta.env.VITE_ELABFTW_API_KEY;

function ImportPrimersFromDatabaseButton({ addPrimer }) {
  const existingNames = useSelector((state) => state.cloning.primers.map((p) => p.name), shallowEqual);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPrimer, setSelectedPrimer] = useState(null);
  const [error, setError] = useState('');

  const handleResourceSelect = async (resource) => {
    try {
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
        });
      }
    } catch (e) {
      setSelectedPrimer(null);
      setError(e.message);
    }
  };

  const handleImportClick = () => {
    if (selectedPrimer) {
      addPrimer(selectedPrimer);
      setOpenDialog(false);
      setSelectedPrimer(null);
      setSelectedCategory(null);
      setError('');
    }
  };

  const handleClose = () => {
    setOpenDialog(false);
    setSelectedPrimer(null);
    setSelectedCategory(null);
    setError('');
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpenDialog(true)}
      >
        Import from database
      </Button>

      <Dialog
        open={openDialog}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Primers from Database</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <ElabFTWCategorySelect
              setCategory={setSelectedCategory}
              apiKey={apiKey}
            />

            {selectedCategory && (
              <ElabFTWResourceSelect
                setResource={handleResourceSelect}
                categoryId={selectedCategory.id}
                apiKey={apiKey}
              />
            )}

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            {selectedPrimer && (
              <Box sx={{
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
              >
                <h3 style={{ margin: '0 0 1rem 0' }}>Selected Primer</h3>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Name:</strong>
                  {' '}
                  {selectedPrimer.name}
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Sequence:</strong>
                  {' '}
                  {selectedPrimer.sequence}
                </p>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            variant="outlined"
            color="error"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleImportClick}
            disabled={!selectedPrimer}
          >
            Import Primer
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ImportPrimersFromDatabaseButton;
