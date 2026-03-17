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
} from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { LineLink } from '../components/EntityLinks';
import { Dialog, DialogTitle } from '@mui/material';
import SequenceSelect from '../components/SequenceSelect';
import NewLineUID from '../components/NewLineUID';
import ResourceDetailHeader from '../components/ResourceDetailHeader';
import SequenceTable from '../components/SequenceTable';
import DetailPageSection from '../components/DetailPageSection';
import PageContainer from '../components/PageContainer';



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

function LineDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: line, isLoading, error } = useQuery({
    queryKey: ['line', id],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get(endpoints.line(id));
      const parentLinesData = await Promise.all(res.parent_ids.map((parentId) => openCloningDBHttpClient.get(endpoints.line(parentId))));
      const parentLines = parentLinesData?.map((r) => r.data) ?? [];
      return { ...res, parentLines };
    },
  });

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load line'}</Alert>;

  const sequences = line?.sequences_in_line ?? [];
  const alleles = sequences.filter((s) => s.sequence_type === 'allele');
  const plasmids = sequences.filter((s) => s.sequence_type === 'plasmid');
  const {parentLines } = line;

  return (
    <PageContainer>
      <ResourceDetailHeader
        title={line.uid}
        tags={line.tags}
        onBack={() => navigate('/lines')}
        backTitle="Back to Lines" />

      <Box sx={{ mb: 3 }}>
        <TransformButton line={line} />
      </Box>

      {alleles.length > 0 && (
        <DetailPageSection title="Genotype">
          <SequenceTable sequences={alleles} showType={false} />
        </DetailPageSection>
      )}

      {plasmids.length > 0 && (
        <DetailPageSection title="Plasmids">
          <SequenceTable sequences={plasmids} showType={false} />
        </DetailPageSection>
      )}

      {parentLines.length > 0 && (
        <DetailPageSection title="Parent lines">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {parentLines.map((parentLine) => (
              <LineLink key={parentLine.id} {...parentLine} />
            ))}
          </Box>
        </DetailPageSection>
      )}

      {alleles.length === 0 && plasmids.length === 0 && parentLines.length === 0 && (
        <Typography color="text.secondary">No genotype, plasmids, or parents for this line.</Typography>
      )}
    </PageContainer>
  );
}

export default LineDetailPage;
