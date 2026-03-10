import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Paper, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { openCloningDBHttpClient } from '@opencloning/opencloningdb';

function PrimerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['primer', id],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get(`/primer/${id}`);
      return res;
    },
  });

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load primer'}</Alert>;

  return (
    <>
      <Button onClick={() => navigate('/primers')} sx={{ mb: 2 }}>
        Back to Primers
      </Button>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {data.name ?? `Primer ${data.id}`}
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2">ID: {data.id}</Typography>
        <Typography sx={{ mt: 1, fontFamily: 'monospace' }}>{data.sequence}</Typography>
      </Paper>
    </>
  );
}

export default PrimerDetailPage;
