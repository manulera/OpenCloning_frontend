import React from 'react';
import { Box, Typography, Paper, Container, Alert } from '@mui/material';
import { useFormData } from '../context/FormDataContext';
import useUploadData from './useUploadData';
import ExistingSyntaxDialog from './ExistingSyntaxDialog';



function StartingPage({ setOverhangsStep }) {
  const { addDefaultPart } = useFormData();
  const { uploadData } = useUploadData();
  const fileInputRef = React.useRef(null);
  const [submissionError, setSubmissionError] = React.useState(null);
  const [existingSyntaxDialogOpen, setExistingSyntaxDialogOpen] = React.useState(false);
  const onFileChange = async (event) => {
    try {
      const file = event.target.files[0];
      uploadData(file);
    } catch (error) {
      setSubmissionError(error.message);
    } finally {
      fileInputRef.current.value = '';
    }
  };
  const onSelectOption = (id) => {
    if (id === 'overhangs') {
      setOverhangsStep(true);
    } else if (id === 'import') {
      fileInputRef.current.click();
    } else if (id === 'example') {
      setExistingSyntaxDialogOpen(true);
    } else {
      addDefaultPart();
    }
  };

  const options = [
    {
      id: 'overhangs',
      title: 'Defining parts from overhangs',
      description: 'Start by entering overhangs to automatically generate parts',
    },
    {
      id: 'import',
      title: 'Importing parts or syntax from file',
      description: 'Import parts or syntax from a file (tsv or JSON)',
    },
    {
      id: 'direct',
      title: 'Defining parts directly',
      description: 'Manually define parts with all their properties',
    },
    {
      id: 'example',
      title: 'Loading an example',
      description: 'Load an example syntax (MoClo YTK)',
    },
  ];

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 1 }}>
          How would you like to start?
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Choose a method to begin creating your parts
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {options.map((option) => (
            <Paper
              key={option.id}
              elevation={2}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  elevation: 4,
                  transform: 'translateY(-2px)',
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => onSelectOption(option.id)}
            >
              {option.id === 'import' && <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={onFileChange} accept=".json,.tsv,.csv" />}
              <Typography variant="h6" gutterBottom>
                {option.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {option.description}
              </Typography>
              {option.id === 'import' && submissionError && <Alert severity="error" sx={{ mt: 2 }}>{submissionError}</Alert>}
            </Paper>
          ))}
        </Box>
      </Box>
      <ExistingSyntaxDialog setSubmissionError={setSubmissionError} open={existingSyntaxDialogOpen} onClose={() => setExistingSyntaxDialogOpen(false)} />
    </Container>
  );
}

export default StartingPage;

