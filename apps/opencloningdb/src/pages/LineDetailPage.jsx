import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
  DialogContent,
  FormControl,
  TableContainer,
  Paper,
  Tooltip,
} from '@mui/material';
import { openCloningDBHttpClient, endpoints, SequenceSelect } from '@opencloning/opencloningdb';
import { Dialog, DialogTitle } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import NewLineUID from '../components/NewLineUID';
import ResourceDetailHeader from '../components/ResourceDetailHeader';
import SequenceTable from '../components/SequenceTable';
import LinesTable from '../components/LinesTable';
import DetailPageSection from '../components/DetailPageSection';
import PageContainer from '../components/PageContainer';
import TopButtonSection from '../components/TopButtonSection';
import useAppAlerts from '../hooks/useAppAlerts';
import ConfirmMutationDialog from '../components/ConfirmMutationDialog';



function TransformationDialog({ line, open, onClose }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [alleles, setAlleles] = React.useState([]);
  const [lineUID, setLineUID] = React.useState('');
  const [plasmids, setPlasmids] = React.useState([]);

  const anyTransormedSequence = alleles.length > 0 || plasmids.length > 0;

  const createLineMutation = useMutation({
    mutationFn: async (body) => {
      const { data } = await openCloningDBHttpClient.post(endpoints.postLine, body);
      return data;
    },
    onSuccess: (data) => {
      onClose();
      queryClient.invalidateQueries({ queryKey: ['lines'] });
      queryClient.invalidateQueries({ queryKey: ['line', line.id] });
      navigate(`/lines/${data.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!lineUID || !anyTransormedSequence) return;
    createLineMutation.mutate({
      uid: lineUID,
      allele_ids: alleles.map((a) => a.id),
      plasmid_ids: plasmids.map((p) => p.id),
      parent_ids: [line.id],
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Transformation of {line.uid ?? `Line ${line.id}`}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <NewLineUID onChange={setLineUID} />
          </FormControl>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <SequenceSelect multiple value={alleles} label="Alleles" onChange={setAlleles} sequenceTypes={['allele']} />
          </FormControl>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <SequenceSelect multiple value={plasmids} label="Plasmids" onChange={setPlasmids} sequenceTypes={['plasmid']} />
          </FormControl>
          {createLineMutation.isError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {createLineMutation.error?.response?.data?.detail || createLineMutation.error?.message || 'Failed to create line'}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <Button
              disabled={!lineUID || !anyTransormedSequence || createLineMutation.isPending}
              type="submit"
              variant="contained"
              color="primary"
            >
              {createLineMutation.isPending ? 'Creating…' : 'Submit'}
            </Button>
          </FormControl>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TransformButton({ line }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
        Transformation
      </Button>
      <TransformationDialog line={line} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function EditLineUID({ line, onSave }) {
  const queryClient = useQueryClient();
  const { addAlert } = useAppAlerts();
  const [nextUid, setNextUid] = React.useState(line.uid ?? '');
  const sanitizedUid = nextUid.trim();
  const canSubmit = sanitizedUid.length > 0 && sanitizedUid !== line.uid;

  const patchMutation = useMutation({
    mutationFn: async () => openCloningDBHttpClient.patch(endpoints.line(line.id), { uid: sanitizedUid }),
    onSuccess: () => {
      addAlert({ message: 'Line UID updated successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['line', line.id] });
      queryClient.invalidateQueries({ queryKey: ['lineChildren', line.id] });
      queryClient.invalidateQueries({ queryKey: ['lines'] });
      onSave();
    },
    onError: (mutationError) => {
      addAlert({
        message: mutationError?.response?.data?.detail || mutationError?.message || 'Error updating line UID',
        severity: 'error',
      });
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    patchMutation.mutate();
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <NewLineUID
        onChange={setNextUid}
        label="Line UID"
        placeholder="Edit line UID"
        excludeUid={line.uid}
        defaultValue={line.uid ?? ''}
        sx={{ minWidth: 240 }}
        size="small"
      />
      <Button
        type="submit"
        variant="contained"
        sx={{ mb: 3 }}
        disabled={!canSubmit || patchMutation.isPending}
      >
        {patchMutation.isPending ? 'Saving...' : 'Save'}
      </Button>
      <Button
        variant="text"
        color="error"
        sx={{ mb: 3 }}
        onClick={() => onSave()}
      >
        Cancel
      </Button>
    </Box>
  );
}

function LineDetailPage() {
  const { id: stringId } = useParams();
  // This is necessary because of query keys
  const id = parseInt(stringId);
  const navigate = useNavigate();
  const { addAlert } = useAppAlerts();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const { data: line, isLoading, error } = useQuery({
    queryKey: ['line', id],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get(endpoints.line(id));
      const parentLinesData = await Promise.all(res.parent_ids.map((parentId) => openCloningDBHttpClient.get(endpoints.line(parentId))));
      const parentLines = parentLinesData?.map((r) => r.data) ?? [];
      return { ...res, parentLines };
    }
  });

  const { data: children = [], isLoading: isChildrenLoading, error: childrenError} = useQuery({
    queryKey: ['lineChildren', id],
    queryFn: async () => {
      const { data } = await openCloningDBHttpClient.get(endpoints.lineChildren(id));
      return data ?? [];
    }
  });

  const deleteLineMutation = useMutation({
    mutationFn: async () => openCloningDBHttpClient.delete(endpoints.line(id)),
    onSuccess: () => {
      addAlert({ message: 'Line deleted successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['lines'] });
      navigate('/lines');
    },
    onError: (mutationError) => {
      addAlert({
        message: mutationError?.response?.data?.detail || mutationError?.message || 'Error deleting line',
        severity: 'error',
      });
      setIsDeleteOpen(false);
    },
  });

  if (isLoading || isChildrenLoading) return <CircularProgress />;
  if (error || childrenError) return <Alert severity="error">{error?.response?.data?.detail || error?.message || childrenError?.response?.data?.detail || childrenError?.message || 'Failed to load line or children'}</Alert>;

  const sequences = line?.sequences_in_line ?? [];
  const alleles = sequences.filter((s) => s.sequence_type === 'allele');
  const plasmids = sequences.filter((s) => s.sequence_type === 'plasmid');
  const {parentLines } = line;
  const hasChildren = children.length > 0;
  const deleteTooltip = hasChildren ? 'Cannot delete: line has children' : null;

  return (
    <PageContainer>
      <ResourceDetailHeader
        title={line.uid}
        tags={line.tags}
        onBack={() => navigate('/lines')}
        backTitle="Back to Lines"
        entityId={id}
        entityType="lines"
        editorComponent={EditLineUID}
        editorComponentProps={{ line }}
        editorIconToolTipText="Edit line UID"
      />

      <TopButtonSection>
        <TransformButton line={line} />
        <Tooltip title={deleteTooltip} arrow placement="right">
          <span>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setIsDeleteOpen(true)}
              disabled={hasChildren}
            >
              Delete line
            </Button>
          </span>
        </Tooltip>
      </TopButtonSection>

      {alleles.length > 0 && (
        <DetailPageSection title="Genotype" data-testid="line-genotype">
          <TableContainer component={Paper} sx={{ maxWidth: 800 }}>
            <SequenceTable sequences={alleles} showType={false} />
          </TableContainer>
        </DetailPageSection>
      )}

      {plasmids.length > 0 && (
        <DetailPageSection title="Plasmids" data-testid="line-plasmids">
          <TableContainer component={Paper} sx={{ maxWidth: 800 }}>
            <SequenceTable sequences={plasmids} showType={false} />
          </TableContainer>
        </DetailPageSection>
      )}

      {parentLines.length > 0 && (
        <DetailPageSection title="Parent lines" data-testid="line-parent-lines">
          <TableContainer component={Paper} sx={{ maxWidth: 800 }}>
            <LinesTable lines={parentLines} withCheckbox={false} />
          </TableContainer>
        </DetailPageSection>
      )}

      {alleles.length === 0 && plasmids.length === 0 && parentLines.length === 0 && (
        <Typography color="text.secondary">No genotype, plasmids, or parents for this line.</Typography>
      )}

      <ConfirmMutationDialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        mutation={deleteLineMutation}
        title="Delete line"
        content={<Typography>Are you sure you want to delete line <strong>{line.uid}</strong>?</Typography>}
        confirmButtonText="Confirm delete"
      />
    </PageContainer>
  );
}

export default LineDetailPage;
