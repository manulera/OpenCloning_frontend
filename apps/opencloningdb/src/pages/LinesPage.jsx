import React, { useState, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
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
  Checkbox,
} from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { LineLink, CommaSeparatorWrapper, SequenceInLineLink } from '../components/EntityLinks';
import { parseLinesParams, applyLinesParamsToSearchParams } from '../utils/query_utils';
import SearchBar from '../components/SearchBar';
import TagMultiSelect from '../components/TagMultiSelect';
import { UrlParamsForm } from '../components/urlParamsForm';
import AlleleSelect from '../components/AlleleSelect';

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

function LineTransformDialog({ selectedIds, setSelectedIds }) {
  const onChange = (alleles) => {
    console.log(alleles);
  };
  return (
    <Dialog open={selectedIds.size > 0} onClose={() => setSelectedIds(new Set())}>
      <DialogTitle>Transform Lines</DialogTitle>
      <DialogContent>
        <form >
          <AlleleSelect onChange={onChange} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function LinesPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedIds, setSelectedIds] = useState(new Set());
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

  const toggleRow = (id) => setSelectedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

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
      <Button
        variant="contained"
        disabled={selectedIds.size === 0}
        sx={{ mb: 1 }}
        onClick={() => {
          // TODO: implement action for selected lines
        }}
      >
        Action{selectedIds.size > 0 ? ` (${selectedIds.size} selected)` : ''}
      </Button>
      <LineTransformDialog selectedIds={selectedIds} setSelectedIds={setSelectedIds} />
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
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
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={selectedIds.has(line.id)}
                      onChange={() => toggleRow(line.id)}
                    />
                  </TableCell>
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
          onPageChange={(_, newPage) => { setPage(newPage); setSelectedIds(new Set()); }}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
            setSelectedIds(new Set());
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </TableContainer>
    </>
  );
}

export default LinesPage;
