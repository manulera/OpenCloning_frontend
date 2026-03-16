import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Typography, Button, CircularProgress, Alert, Box, Chip, List, ListItem } from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { SequenceLink } from '../components/EntityLinks';
import { convertToTeselaJson } from '@opencloning/utils/readNwrite';
import SequenceViewer from '@opencloning/ui/components/SequenceViewer';
import ResourceDetailHeader from '../components/ResourceDetailHeader';
import SequenceTypeChip from '../components/SequenceTypeChip';
import DetailPageSection from '../components/DetailPageSection';
import SequenceTable from '../components/SequenceTable';


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

      const { data: children } = await openCloningDBHttpClient.get(endpoints.sequenceChildren(id));
      const parentSource = cloningStrategy.sources.find((source) => source.database_id === id);

      const sequenceModel = cloningStrategy.sequences.find((sequence) => sequence.id === parentSource.id);
      const parentSequenceIds = cloningStrategy.sources.map((source) => source.database_id).filter((dbId) => dbId !== id);
      const parentSequencesData = await Promise.all(parentSequenceIds.map((sequenceId) => openCloningDBHttpClient.get(endpoints.sequence(sequenceId))));
      return { parentSequences : parentSequencesData.map((r) => r.data), parentSource, sequenceModel, sequenceInDb, children };
    },
    enabled: Boolean(id),
  });
  const { parentSequences, parentSource, sequenceModel, sequenceInDb, children } = React.useMemo(() => data ?? {}, [data]);
  const sequenceData = React.useMemo(() => sequenceModel ? convertToTeselaJson(sequenceModel) : null, [sequenceModel]);
  const tags = React.useMemo(() => sequenceInDb?.tags ?? [], [sequenceInDb]);


  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load sequence'}</Alert>;

  return (
    <>
      <ResourceDetailHeader
        title={<> {sequenceInDb?.name} <SequenceTypeChip sequenceType={sequenceInDb?.sequence_type} /></>}
        tags={tags}
        onBack={() => navigate('/sequences')}
        backTitle="Back to Sequences" />


      <DetailPageSection title="Provenance">
        <Typography color="text.secondary" sx={{ mb: 1 }}>
          {parentSource.type}
        </Typography>
        {parentSequences?.length > 0  && (
          <SequenceTable sequences={parentSequences} />
        )}
      </DetailPageSection>

      {children?.length > 0 && (
        <DetailPageSection title="Children">
          <SequenceTable sequences={children} />
        </DetailPageSection>
      )}


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
