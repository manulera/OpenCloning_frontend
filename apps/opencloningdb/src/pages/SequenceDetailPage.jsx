import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Typography, CircularProgress, Alert, Box, IconButton } from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { convertToTeselaJson, downloadBlob } from '@opencloning/utils/readNwrite';
import SequenceViewer from '@opencloning/ui/components/SequenceViewer';
import ResourceDetailHeader from '../components/ResourceDetailHeader';
import SequenceTypeChip from '../components/SequenceTypeChip';
import DetailPageSection from '../components/DetailPageSection';
import SequenceTable from '../components/SequenceTable';
import PageContainer from '../components/PageContainer';
import TopButtonSection from '../components/TopButtonSection';
import AddToCloningButton from '../components/AddToCloningButton';
import { List, ListItem, ListItemText } from '@mui/material';
import { OpenCloningDBInterface } from '@opencloning/opencloningdb';
import { Download as DownloadIcon, Visibility as VisibilityIcon, AddCircle as AddCircleIcon } from '@mui/icons-material';
import DetailPageSectionAction from '../components/DetailPageSectionAction';
import { ImportSequencingFilesInput } from '@opencloning/ui/components/verification';
import useAppAlerts from '../hooks/useAppAlerts';

const { getSequencingFiles, submitSequencingFileToDatabase } = OpenCloningDBInterface;

function SequencingFileSectionActions( { sequencingFiles, databaseId }) {
  const fileInputRef = React.useRef(null);
  const { addAlert } = useAppAlerts();
  const queryClient = useQueryClient();
  const sequencingFileNames = React.useMemo(() => sequencingFiles.map((file) => file.name), [sequencingFiles]);

  const mutation = useMutation({
    mutationFn: (files) => submitSequencingFileToDatabase({ databaseId, sequencingFiles: files }),
    onSuccess: () => {
      addAlert({ message: 'Sequencing files submitted successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sequence', databaseId, 'cloning_strategy'] });
    },
    onError: (error) => {
      addAlert({
        message: error?.response?.data?.detail || error?.message || 'Error submitting sequencing files',
        severity: 'error',
      });
    },
  });

  const handleFileChange = (files) => {
    for (const file of files) {
      if (sequencingFileNames.includes(file.name)) {
        addAlert({ message: `File ${file.name} already exists`, severity: 'error' });
        return;
      }
    }
    mutation.mutate(files);
  };
  return (
    <>
      <ImportSequencingFilesInput onFileChange={handleFileChange} fileInputRef={fileInputRef} />
      <DetailPageSectionAction icon={<AddCircleIcon />} onClick={ () => fileInputRef.current?.click()} title="Add sequencing files" />
      {sequencingFiles?.length > 0 && (
        <DetailPageSectionAction icon={<VisibilityIcon />} onClick={ () => {}} title="See alignments" />
      )}
    </>
  )
}

function SequenceDetailPage() {
  const { id: idString } = useParams();
  const id = parseInt(idString);
  const navigate = useNavigate();
  const onGetFile = async (fileGetter) => {
    const file = await fileGetter();
    downloadBlob(file, file.name);
  }

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
      const sequencingFiles = await getSequencingFiles(id);
      return { parentSequences : parentSequencesData.map((r) => r.data), parentSource, sequenceModel, sequenceInDb, children, sequencingFiles };
    },
    enabled: Boolean(id),
  });
  const { parentSequences, parentSource, sequenceModel, sequenceInDb, children, sequencingFiles } = React.useMemo(() => data ?? {}, [data]);
  const sequenceData = React.useMemo(() => sequenceModel ? convertToTeselaJson(sequenceModel) : null, [sequenceModel]);
  const tags = React.useMemo(() => sequenceInDb?.tags ?? [], [sequenceInDb]);

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load sequence'}</Alert>;

  return (
    <PageContainer>
      <Box sx={{ position: 'relative'}}>
        <Box sx={{ position: 'absolute', top: 0, right: 0, fontFamily: 'monospace' }}>
          {sequenceInDb?.seguid}
        </Box>
      </Box>
      <ResourceDetailHeader
        title={<> {sequenceInDb?.name} <SequenceTypeChip sequenceType={sequenceInDb?.sequence_type} /></>}
        tags={tags}
        onBack={() => navigate('/sequences')}
        backTitle="Back to Sequences" />

      <TopButtonSection>
        <AddToCloningButton selectedEntities={[sequenceModel]} entityType="sequence">
          Add to Design Tab
        </AddToCloningButton>
      </TopButtonSection>
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

      <DetailPageSection title="Sequencing files" actions={
        <SequencingFileSectionActions sequencingFiles={sequencingFiles} databaseId={id} />
      }>
        <List sx={{ margin: 0, paddingLeft: 2 }}>
          {sequencingFiles.map((file) => (
            <ListItem key={file.name} disableGutters sx={{ pl: 0 }}>
              <IconButton onClick={() => onGetFile(file.getFile)}><DownloadIcon /></IconButton>
              <ListItemText primary={file.name} />
            </ListItem>
          ))}
        </List>
      </DetailPageSection>



      <Box sx={{ mt: 2 }}>
        {sequenceData ? (
          <SequenceViewer sequenceData={sequenceData} />
        ) : (
          <Alert severity="warning">Could not parse sequence for display.</Alert>
        )}
      </Box>
    </PageContainer>
  );
}

export default SequenceDetailPage;
