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
  Chip,
} from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { SequenceLink, LineLink } from '../components/EntityLinks';

function LineDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['line', id],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get(endpoints.line(id));
      return res;
    },
  });

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load line'}</Alert>;

  const sequences = data?.sequences_in_line ?? [];
  const alleles = sequences.filter((s) => s.sequence_type === 'allele');
  const plasmids = sequences.filter((s) => s.sequence_type === 'plasmid');
  const parentIds = data?.parent_ids ?? [];

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
                {seq.tags?.length ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {seq.tags.map((tag) => (
                      <Chip key={tag.id} label={tag.name} size="small" variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  '—'
                )}
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
        Back to Lines
      </Button>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {data.uid ?? `Line ${data.id}`}
      </Typography>

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

      {parentIds.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Parent lines
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {parentIds.map((parentId) => (
              <LineLink key={parentId} id={parentId} />
            ))}
          </Box>
        </Box>
      )}

      {alleles.length === 0 && plasmids.length === 0 && parentIds.length === 0 && (
        <Typography color="text.secondary">No genotype, plasmids, or parents for this line.</Typography>
      )}
    </>
  );
}

export default LineDetailPage;
