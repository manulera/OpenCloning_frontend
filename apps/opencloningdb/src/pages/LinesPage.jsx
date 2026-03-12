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
  Box,
} from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import SequenceTypeChip from '../components/SequenceTypeChip';
import { SequenceLink, LineLink, CommaSeparatorWrapper } from '../components/EntityLinks';

function LinesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const { data, isLoading, error } = useQuery({
    queryKey: ['lines', { page: page + 1, size: rowsPerPage }],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get(endpoints.lines, {
        params: { page: page + 1, size: rowsPerPage },
      });
      return res;
    },
    placeholderData: keepPreviousData,
  });

  const items = data?.items ?? [];

  if (isLoading && !data) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load lines'}</Alert>;

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Lines
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>UID</TableCell>
              <TableCell>Genotype</TableCell>
              <TableCell>Plasmids</TableCell>
              <TableCell>Parents</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((line) => {
              const alleles = line.sequences_in_line?.filter((sil) => sil.sequence_type === 'allele') ?? [];
              const plasmids = line.sequences_in_line?.filter((sil) => sil.sequence_type === 'plasmid') ?? [];
              const renderSeqCell = (sils, showType = false) =>
                sils.length ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                    {sils.map((sil) => (
                      <Box
                        key={sil.id}
                        component="span"
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mr: 1 }}
                      >
                        <Typography
                          component="span"
                          sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/sequences/${sil.sequence_id}`);
                          }}
                        >
                          {sil.name ?? sil.sequence_id}
                        </Typography>
                        {showType && <SequenceTypeChip sequenceType={sil.sequence_type} />}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  '—'
                );
              return (
                <TableRow key={line.id} hover>
                  <TableCell>
                    <LineLink id={line.id} name={line.uid} />
                  </TableCell>
                  <TableCell>{renderSeqCell(alleles, false)}</TableCell>
                  <TableCell>{renderSeqCell(plasmids, true)}</TableCell>
                  <TableCell>
                    {line.parent_ids?.length ? (
                      <CommaSeparatorWrapper>
                        {line.parent_ids.map((parentId) => (
                          <LineLink key={parentId} id={parentId} />
                        ))}
                      </CommaSeparatorWrapper>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
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

export default LinesPage;
