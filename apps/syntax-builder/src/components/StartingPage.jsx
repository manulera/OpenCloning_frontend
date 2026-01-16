import React from 'react';
import { Box, Typography, Paper, Container, Alert } from '@mui/material';
import { readSubmittedTextFile } from '@opencloning/utils/readNwrite';
import { useFormData, defaultFields } from '../context/FormDataContext';
import { delimitedFileToJson } from '@opencloning/utils/fileParsers';

function validateSubmittedData(data) {
  if (!Array.isArray(data)) {
    throw new Error('Data should be an array');
  }
  data.forEach(part => {
    defaultFields.forEach(field => {
      if (part[field] === undefined) {
        throw new Error(`Part is missing ${field} field`);
      }
    });
  });
  return data;
}

function StartingPage({ setOverhangsStep }) {
  const { setParts, addDefaultPart } = useFormData();
  const fileInputRef = React.useRef(null);
  const [submissionError, setSubmissionError] = React.useState(null);
  const onFileChange = async (event) => {
    try {
      const file = event.target.files[0];
      let data;
      if (file.name.endsWith('.json')) {
        data = JSON.parse(await readSubmittedTextFile(file));
      } else if (file.name.endsWith('.tsv') || file.name.endsWith('.csv')) {
        data = await delimitedFileToJson(file, defaultFields);
      } else {
        throw new Error('Invalid file type');
      }
      data.forEach((part, index) => {
        part.left_codon_start = parseInt(part.left_codon_start) || 0;
        part.right_codon_start = parseInt(part.right_codon_start) || 0;
        part.id = index + 1;
      });
      validateSubmittedData(data);
      setParts(data);
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
      title: 'Importing parts from file',
      description: 'Import parts from a file (JSON, FASTA, or GenBank format)',
    },
    {
      id: 'direct',
      title: 'Define parts directly',
      description: 'Manually define parts with all their properties',
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
    </Container>
  );
}

export default StartingPage;

