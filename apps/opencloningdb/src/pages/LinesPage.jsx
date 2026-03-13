import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
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
  Button,
} from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { LineLink, CommaSeparatorWrapper, SequenceInLineLink } from '../components/EntityLinks';
import { parseLinesParams, applyLinesParamsToSearchParams } from '../utils/query_utils';
import SearchBar from '../components/SearchBar';
import TagMultiSelect from '../components/TagMultiSelect';
import { UrlParamsForm } from '../components/urlParamsForm';

function SeqCell({ sils }) {
  return (
    sils.length ? (
      <CommaSeparatorWrapper>
        {sils.map((sil) => (
          <SequenceInLineLink key={sil.id} {...sil} />
        ))}
      </CommaSeparatorWrapper>
    ) : (
      '—'
    )
  );
}

const MIN_WIDTH = 200;

function LinesQueryFields({ pendingParams, setPendingParams }) {
  return (
    <>
      <SearchBar
        label="UID"
        placeholder="Search by UID"
        value={pendingParams.uid ?? ''}
        onChange={(value) => setPendingParams((p) => ({ ...p, uid: value }))}
        sx={{ minWidth: MIN_WIDTH }}
      />
      <SearchBar
        label="Genotype"
        placeholder="Search by allele names (space = AND)"
        value={pendingParams.genotype ?? ''}
        onChange={(value) => setPendingParams((p) => ({ ...p, genotype: value }))}
        sx={{ minWidth: MIN_WIDTH * 1.5 }}
      />
      <SearchBar
        label="Plasmid"
        placeholder="Search by plasmid (space = AND)"
        value={pendingParams.plasmid ?? ''}
        onChange={(value) => setPendingParams((p) => ({ ...p, plasmid: value }))}
        sx={{ minWidth: MIN_WIDTH * 1.5 }}
      />
      <TagMultiSelect
        value={pendingParams.tags ?? []}
        onChange={(value) => setPendingParams((p) => ({ ...p, tags: value }))}
        sx={{ minWidth: MIN_WIDTH }}
      />
      <Button variant="contained" color="primary" type="submit">
        Search
      </Button>
    </>
  );
}

function LinesPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchParams] = useSearchParams();

  const filters = useMemo(
    () => parseLinesParams(searchParams),
    [searchParams],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['lines', { page: page + 1, size: rowsPerPage, ...filters }],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get(endpoints.lines, {
        params: {
          page: page + 1,
          size: rowsPerPage,
          ...filters,
        },
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
      <UrlParamsForm
        parse={parseLinesParams}
        applyToSearchParams={applyLinesParamsToSearchParams}
        component={LinesQueryFields}
      />
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>UID</TableCell>
              <TableCell>Genotype</TableCell>
              <TableCell>Plasmids</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((line) => {
              const alleles = line.sequences_in_line?.filter((sil) => sil.sequence_type === 'allele') ?? [];
              const plasmids = line.sequences_in_line?.filter((sil) => sil.sequence_type === 'plasmid') ?? [];
              return (
                <TableRow key={line.id} hover>
                  <TableCell>
                    <LineLink {...line} />
                  </TableCell>
                  <TableCell><SeqCell sils={alleles} /></TableCell>
                  <TableCell><SeqCell sils={plasmids} /></TableCell>
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
