import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Paper, Typography, Button, CircularProgress, Alert, Box } from '@mui/material';
import { openCloningDBHttpClient } from '@opencloning/opencloningdb';

function SequenceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['sequence', id],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get(`/sequence/${id}`);
      return res;
    },
  });

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load sequence'}</Alert>;

  return (
    <>
      <Button onClick={() => navigate('/sequences')} sx={{ mb: 2 }}>
        Back to Sequences
      </Button>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Sequence {data.id}
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2">Format: {data.sequence_file_format}</Typography>
        <Box
          component="pre"
          sx={{ mt: 1, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem' }}
        >
          {data.file_content}
        </Box>
      </Paper>
    </>
  );
}

export default SequenceDetailPage;
