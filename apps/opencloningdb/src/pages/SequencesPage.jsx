import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  Alert,
  Typography,
  IconButton,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import useLoadDatabaseFile from '@opencloning/ui/hooks/useLoadDatabaseFile';
import useAlerts from '@opencloning/ui/hooks/useAlerts';
import SequenceTypeChip from '../components/SequenceTypeChip';

function SequencesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const { addAlert } = useAlerts();
  const setHistoryFileError = (e) => addAlert({ message: e, severity: 'error' });
  const { loadDatabaseFile } = useLoadDatabaseFile({ source: null, sendPostRequest: null, setHistoryFileError });

  const handleAddSequence = async (seqId) => {
    try {
      const { data: sequence } = await openCloningDBHttpClient.get(endpoints.sequenceTextFile(seqId));
      const source = { id: 1, input: [], database_id: seqId, type: 'DatabaseSource' };
      sequence.id = 1;
      const cloningStrategy = { sources: [source], sequences: [sequence], primers: [] };
      const file = new File([JSON.stringify(cloningStrategy)], 'cloning_strategy.json', { type: 'application/json' });
      await loadDatabaseFile(file, seqId);
    } catch (error) {
      setHistoryFileError(error?.response?.data?.detail || error?.message || 'Failed to add sequence');
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['sequences', { page: page + 1, size: rowsPerPage }],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get(endpoints.sequences, {
        params: { page: page + 1, size: rowsPerPage },
      });
      return res;
    },
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];

  if (isLoading && !data) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load sequences'}</Alert>;

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Sequences
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>UID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell padding="none" width={48} />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((seq) => (
              <TableRow key={seq.id} hover>
                <TableCell>{seq.uids?.length ? seq.uids.join(', ') : seq.uid ?? '—'}</TableCell>
                <TableCell
                  sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => navigate(`/sequences/${seq.id}`)}
                >
                  {seq.name ?? '—'}
                </TableCell>
                <TableCell>
                  <SequenceTypeChip sequenceType={seq.sequence_type} />
                </TableCell>
                <TableCell padding="none">
                  <IconButton size="small" onClick={() => handleAddSequence(seq.id)} aria-label="Add">
                    <AddIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={data?.total ?? 0}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </TableContainer>
    </>
  );
}

export default SequencesPage;
