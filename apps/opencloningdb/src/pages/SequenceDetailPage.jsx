import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Typography, Button, CircularProgress, Alert, Box, Chip, Link, List, ListItem } from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { convertToTeselaJson } from '@opencloning/utils/readNwrite';
import SequenceViewer from '@opencloning/ui/components/SequenceViewer';


function SequenceDetailPage() {
  const { id: idString } = useParams();
  const id = parseInt(idString);
  const navigate = useNavigate();

  const {
    data: data,
    isLoading: isLoading,
    error: error,
  } = useQuery({
    retry: false,
    queryKey: ['sequence', id, 'cloning_strategy'],
    queryFn: async () => {
      const { data: cloningStrategy } = await openCloningDBHttpClient.get(endpoints.sequenceCloningStrategy(id));
      const { data: sequenceInDb} = await openCloningDBHttpClient.get(endpoints.sequence(id));
      const parentSource = cloningStrategy.sources.find((source) => source.database_id === id);

      const sequenceModel = cloningStrategy.sequences.find((sequence) => sequence.id === parentSource.id);
      const parentSequenceIds = cloningStrategy.sources.map((source) => source.database_id).filter((dbId) => dbId !== id);
      const parentSequencesData = await Promise.all(parentSequenceIds.map((sequenceId) => openCloningDBHttpClient.get(endpoints.sequence(sequenceId))));
      return { parentSequences : parentSequencesData.map((r) => r.data), parentSource, sequenceModel, sequenceInDb };
    },
    enabled: Boolean(id),
  });
  const { parentSequences, parentSource, sequenceModel, sequenceInDb } = React.useMemo(() => data ?? {}, [data]);
  const sequenceData = React.useMemo(() => sequenceModel ? convertToTeselaJson(sequenceModel) : null, [sequenceModel]);
  const tags = React.useMemo(() => sequenceInDb?.tags ?? [], [sequenceInDb]);


  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load sequence'}</Alert>;

  return (
    <>
      <Button onClick={() => navigate('/sequences')} sx={{ mb: 2 }}>
        Back to Sequences
      </Button>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {sequenceInDb?.name}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Sequence details
        </Typography>
        <Typography color="text.secondary">Type: {sequenceInDb?.sequence_type ?? '—'}</Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Tags
        </Typography>
        {tags.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {tags.map((tag) => (
              <Chip key={tag.id} label={tag.name} size="small" variant="outlined" />
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">No tags for this sequence.</Typography>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Parents
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 1 }}>
          Parent source type: {parentSource?.type ?? '—'}
        </Typography>
        {parentSequences?.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <List>
              {parentSequences.map((parent) => (
                <ListItem key={parent.id}>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => navigate(`/sequences/${parent.id}`)}
                    sx={{ textDecoration: 'underline' }}
                  >
                    {parent.name ?? `Sequence ${parent.id}`}
                  </Link>
                </ListItem>
              ))}
            </List>
          </Box>
        ) : (
          <Typography color="text.secondary">No parents for this sequence.</Typography>
        )}
        
      </Box>

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
