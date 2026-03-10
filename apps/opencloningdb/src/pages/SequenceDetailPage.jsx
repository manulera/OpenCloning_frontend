import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Typography, Button, CircularProgress, Alert, Box } from '@mui/material';
import { openCloningDBHttpClient } from '@opencloning/opencloningdb';
import { convertToTeselaJson } from '@opencloning/utils/readNwrite';
import SequenceViewer from '@opencloning/ui/components/SequenceViewer';

function SequenceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['sequence', id],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get(`/sequence/${id}/cloning_strategy`);
      return res;
    },
  });

  const sequenceData = useMemo(() => {
    if (!data?.sequences?.length) return null;
    try {
      return convertToTeselaJson(data.sequences[0]);
    } catch (e) {
      console.error('Failed to parse sequence:', e);
      return null;
    }
  }, [data]);

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load sequence'}</Alert>;

  return (
    <>
      <Button onClick={() => navigate('/sequences')} sx={{ mb: 2 }}>
        Back to Sequences
      </Button>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Sequence {data.sequences?.[0]?.id ?? id}
      </Typography>
      <Box sx={{ mt: 2 }}>
        {sequenceData ? (
          <SequenceViewer sequenceData={sequenceData} />
        ) : (
          <Alert severity="warning">Could not parse sequence for display.</Alert>
        )}
      </Box>
    </>
  );
}

export default SequenceDetailPage;
