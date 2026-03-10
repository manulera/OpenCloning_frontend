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

function PrimersPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const { data, isLoading, error } = useQuery({
    queryKey: ['primers', { page: page + 1, size: rowsPerPage }],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get('/primers', {
        params: { page: page + 1, size: rowsPerPage },
      });
      return res;
    },
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];

  if (isLoading && !data) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load primers'}</Alert>;

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Primers
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Sequence</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((primer) => (
              <TableRow
                key={primer.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/primers/${primer.id}`)}
              >
                <TableCell>{primer.id}</TableCell>
                <TableCell>{primer.name ?? '—'}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{primer.sequence ?? '—'}</TableCell>
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

export default PrimersPage;
