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
} from '@mui/material';
import { openCloningDBHttpClient } from '@opencloning/opencloningdb';

function SequencesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const { data, isLoading, error } = useQuery({
    queryKey: ['sequences', { page: page + 1, size: rowsPerPage }],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get('/sequences', {
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
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((seq) => (
              <TableRow
                key={seq.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/sequences/${seq.id}`)}
              >
                <TableCell>{seq.id}</TableCell>
                <TableCell>{seq.name ?? '—'}</TableCell>
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
