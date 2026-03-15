import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Typography,
  Button,
  CircularProgress,
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  DialogContent,
  FormControl,
} from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { SequenceLink, LineLink } from '../components/EntityLinks';
import TagChipList from '../components/TagChipList';
import { Dialog, DialogTitle } from '@mui/material';
import AlleleSelect from '../components/AlleleSelect';
import {ArrowBack as ArrowBackIcon} from '@mui/icons-material';
import NewLineUID from '../components/NewLineUID';

function TransformationDialog({ line, open, onClose }) {
  const [alleles, setAlleles] = React.useState([]);
  const [lineUID, setLineUID] = React.useState('');

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Transformation of {line.uid ?? `Line ${line.id}`}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1 }}>
          <NewLineUID value={lineUID} onChange={setLineUID} />
        </FormControl>
        <FormControl fullWidth sx={{ mt: 1 }}>
        <AlleleSelect multiple value={alleles} onChange={setAlleles} />
        </FormControl>

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

  const renderSeqTable = (items) => (
    <TableContainer component={Paper} sx={{ maxWidth: 800 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Tags</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((seq) => (
            <TableRow key={seq.id}>
              <TableCell>
                <SequenceLink id={seq.sequence_id} name={seq.name} />
              </TableCell>
              <TableCell>
                <TagChipList tags={seq.tags} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      <Button onClick={() => navigate('/lines')} sx={{ mb: 2 }}>
        <ArrowBackIcon fontSize="small" sx={{ mr: 1 }} /> Back to Lines
      </Button>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {line.uid ?? `Line ${line.id}`}
      </Typography>
      <Box sx={{ mb: 3 }}>
        <TransformButton line={line} />
      </Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Tags
        </Typography>
        <TagChipList tags={line.tags} />
      </Box>


      {alleles.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Genotype
          </Typography>
          {renderSeqTable(alleles)}
        </Box>
      )}

      {plasmids.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Plasmids
          </Typography>
          {renderSeqTable(plasmids)}
        </Box>
      )}

      {parentLines.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Parent lines
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {parentLines.map((parentLine) => (
              <LineLink key={parentLine.id} {...parentLine} />
            ))}
          </Box>
        </Box>
      )}

      {alleles.length === 0 && plasmids.length === 0 && parentLines.length === 0 && (
        <Typography color="text.secondary">No genotype, plasmids, or parents for this line.</Typography>
      )}
    </>
  );
}

export default LineDetailPage;
