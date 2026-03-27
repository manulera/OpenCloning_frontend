import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Typography, CircularProgress, Alert, Box, IconButton, TableContainer, Paper } from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { convertToTeselaJson, downloadBlob, file2base64, getTeselaJsonFromBase64 } from '@opencloning/utils/readNwrite';
import SequenceViewer from '@opencloning/ui/components/SequenceViewer';
import ResourceDetailHeader from '../components/ResourceDetailHeader';
import SequenceTypeChip from '../components/SequenceTypeChip';
import EditSequenceNameAndType from '../components/EditSequenceNameAndType';
import DetailPageSection from '../components/DetailPageSection';
import SequenceTable from '../components/SequenceTable';
import PrimersTable from '../components/PrimersTable';
import PageContainer from '../components/PageContainer';
import TopButtonSection from '../components/TopButtonSection';
import AddToCloningButton from '../components/AddToCloningButton';
import { List, ListItem, ListItemText } from '@mui/material';
import { OpenCloningDBInterface } from '@opencloning/opencloningdb';
import { Download as DownloadIcon, Visibility as VisibilityIcon, AddCircle as AddCircleIcon, Delete as DeleteIcon } from '@mui/icons-material';
import DetailPageSectionAction from '../components/DetailPageSectionAction';
import { ImportSequencingFilesInput } from '@opencloning/ui/components/verification';
import useAppAlerts from '../hooks/useAppAlerts';
import useSequencingAlignment from '@opencloning/ui/hooks/useSequencingAlignment';
import { QueryStatusWrapper } from '@opencloning/ui';
import SequenceSamplesSection from '../components/SequenceSamplesSection';

const { getSequencingFiles, submitSequencingFileToDatabase } = OpenCloningDBInterface;

function DeleteSequencingFileButton({ sequenceId, fileId }) {
  const { addAlert } = useAppAlerts();
  const queryClient = useQueryClient();

  const deleteSequencingFileMutation = useMutation({
    mutationFn: () => openCloningDBHttpClient.delete(endpoints.sequenceSequencingFileDelete(sequenceId, fileId)),
    onSuccess: () => {
      addAlert({ message: 'Sequencing file deleted successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sequence', sequenceId, 'cloning_strategy'] });
      queryClient.invalidateQueries({ queryKey: ['sequence', sequenceId, 'sequencing_files'] });
    },
    onError: (error) => {
      addAlert({
        message: error?.response?.data?.detail || error?.message || 'Error deleting sequencing file',
        severity: 'error',
      });
    },
  });

  return (
    <IconButton
      onClick={() => deleteSequencingFileMutation.mutate()}
      disabled={deleteSequencingFileMutation.isLoading}
    >
      <DeleteIcon />
    </IconButton>
  );
}

function SequencingFileSectionActions({ sequencingFiles, databaseId, onSeeAlignments, alignmentLoading }) {
  const fileInputRef = React.useRef(null);
  const { addAlert } = useAppAlerts();
  const queryClient = useQueryClient();
  const sequencingFileNames = React.useMemo(() => sequencingFiles.map((file) => file.name), [sequencingFiles]);

  const mutation = useMutation({
    mutationFn: (files) => submitSequencingFileToDatabase({ databaseId, sequencingFiles: files }),
    onSuccess: () => {
      addAlert({ message: 'Sequencing files submitted successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sequence', databaseId, 'cloning_strategy'] });
      queryClient.invalidateQueries({ queryKey: ['sequence', databaseId, 'sequencing_files'] });
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
        <DetailPageSectionAction
          icon={alignmentLoading ? <CircularProgress size={24} /> : <VisibilityIcon />}
          onClick={onSeeAlignments}
          title="See alignments"
          disabled={alignmentLoading}
        />
      )}
    </>
  )
}

function SequenceDetailPage() {
  const { id: idString } = useParams();
  const id = parseInt(idString);
  const navigate = useNavigate();
  const { addAlert } = useAppAlerts();
  const alignmentMutation = useSequencingAlignment({ onError: (e) => addAlert({ message: e?.message || 'Alignment failed', severity: 'error' }) });
  const onGetFile = async (fileGetter) => {
    const file = await fileGetter();
    downloadBlob(file, file.name);
  }

  const { data: data, isLoading: isLoading, error: error} = useQuery({
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
  const sequencingFilesQuery = useQuery({
    retry: false,
    queryKey: ['sequence', id, 'sequencing_files'],
    queryFn: () => getSequencingFiles(id),
    enabled: Boolean(id),
  });
  const primersQuery = useQuery({
    retry: false,
    queryKey: ['sequence', id, 'primers'],
    queryFn: async () => {
      const { data: primers } = await openCloningDBHttpClient.get(endpoints.sequencePrimers(id));
      return { templates: primers.templates, products: primers.products };
    },
    enabled: Boolean(id),
  });
  const { data: primers } = primersQuery;

  const { data: sequencingFiles = [] } = sequencingFilesQuery;
  const { parentSequences, parentSource, sequenceModel, sequenceInDb, children } = React.useMemo(() => data ?? {}, [data]);
  const sequenceData = React.useMemo(() => sequenceModel ? convertToTeselaJson(sequenceModel) : null, [sequenceModel]);
  const tags = React.useMemo(() => sequenceInDb?.tags ?? [], [sequenceInDb]);

  const handleSeeAlignmentsMutation = useMutation({
    mutationFn: async () => {
      const parsedFiles = await Promise.all(sequencingFiles.map(async (file) => {
        const fileBlob = await file.getFile();
        const base64str = await file2base64(fileBlob);
        const fileContent = await getTeselaJsonFromBase64(base64str, file.name);
        return { fileName: file.name, fileContent };
      }));
      return parsedFiles;
    },
    onSuccess: (parsedFiles) => {
      alignmentMutation.mutate({ sequenceModel, sequenceData, parsedFiles });
    },
    onError: (e) => {
      addAlert({ message: e?.message || 'Failed to load sequencing files', severity: 'error' });
    },
  });

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
        title={sequenceInDb?.name}
        afterTitle={<SequenceTypeChip sequenceType={sequenceInDb?.sequence_type} sx={{ fontSize: '1.2rem' }} />}
        tags={tags}
        entityId={id}
        entityType="input_entities"
        onBack={() => navigate('/sequences')}
        backTitle="Back to Sequences"
        editorComponent={EditSequenceNameAndType}
        editorComponentProps={{ sequenceData, sequenceInDb }}
        editorIconToolTipText="Edit name and type"
      />

      <TopButtonSection>
        <AddToCloningButton selectedEntities={[sequenceModel]} entityType="sequence" size="small">
          Add to Design Tab
        </AddToCloningButton>
      </TopButtonSection>
      <SequenceSamplesSection sequenceId={id} sampleUids={sequenceInDb?.sample_uids ?? []} />
      <DetailPageSection title="Provenance">
        <Typography color="text.secondary" sx={{ mb: 1 }}>
          {parentSource.type}
        </Typography>
        {parentSequences?.length > 0  && (
          <TableContainer component={Paper} sx={{ maxWidth: 800 }}>
            <SequenceTable sequences={parentSequences} />
          </TableContainer>
        )}
      </DetailPageSection>

      {children?.length > 0 && (
        <DetailPageSection title="Children">
          <TableContainer component={Paper} sx={{ maxWidth: 800 }}>
            <SequenceTable sequences={children} />
          </TableContainer>
        </DetailPageSection>
      )}

      <QueryStatusWrapper queryResult={primersQuery}>
        {primers.templates.length > 0 || primers.products.length > 0 && (
          <DetailPageSection title="Linked primers">
            <TableContainer component={Paper} sx={{ maxWidth: 800 }}>
              <PrimersTable primers={[...primers.templates, ...primers.products]} withCheckbox={false} />
            </TableContainer>
          </DetailPageSection>
        )}
      </QueryStatusWrapper>


      <DetailPageSection title="Sequencing files" actions={
        <SequencingFileSectionActions
          sequencingFiles={sequencingFiles}
          databaseId={id}
          onSeeAlignments={() => handleSeeAlignmentsMutation.mutate()}
          alignmentLoading={handleSeeAlignmentsMutation.isPending || alignmentMutation.isPending}
        />
      }>
        <QueryStatusWrapper queryResult={sequencingFilesQuery}>
          <List sx={{ margin: 0, paddingLeft: 2 }}>
            {sequencingFiles.map((file) => (
              <ListItem key={file.name} disableGutters sx={{ pl: 0 }}>
                <DeleteSequencingFileButton sequenceId={id} fileId={file.id} />
                <IconButton onClick={() => onGetFile(file.getFile)}><DownloadIcon /></IconButton>
                <ListItemText primary={file.name} />
              </ListItem>
            ))}
          </List>
          {sequencingFiles.length === 0 && (
            <Typography color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            No sequencing files linked
            </Typography>
          )}
        </QueryStatusWrapper>
      </DetailPageSection>
      
      <Box sx={{ mt: 2 }}>
        {sequenceData ? (
          <SequenceViewer sequenceData={sequenceData} alignmentData={alignmentMutation.data ?? null} />
        ) : (
          <Alert severity="warning">Could not parse sequence for display.</Alert>
        )}
      </Box>
    </PageContainer>
  );
}

export default SequenceDetailPage;
