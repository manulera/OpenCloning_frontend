import React from 'react';
import { Box, Typography, TextField } from '@mui/material';
import { useFormData } from '../context/FormDataContext';

function SubmissionInformation() {
  const { formData, updateSubmission } = useFormData();
  const { submission } = formData;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Submission Information
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '600px' }}>
        <TextField
          label="Submitter Name"
          value={submission.name || ''}
          onChange={(e) => updateSubmission({ name: e.target.value })}
          fullWidth
          required
        />
        <TextField
          label="ORCID"
          value={submission.orcid || ''}
          onChange={(e) => updateSubmission({ orcid: e.target.value })}
          fullWidth
          placeholder="0000-0000-0000-0000"
          helperText="Enter your ORCID identifier (optional)"
        />
        <TextField
          label="DOI"
          value={submission.doi || ''}
          onChange={(e) => updateSubmission({ doi: e.target.value })}
          fullWidth
          placeholder="10.1234/example.doi"
          helperText="DOI of related publication (optional)"
        />
      </Box>
    </Box>
  );
}

export default SubmissionInformation;
