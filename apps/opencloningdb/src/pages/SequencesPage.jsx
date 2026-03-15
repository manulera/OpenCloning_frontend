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
  IconButton,
  Button,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import useLoadDatabaseFile from '@opencloning/ui/hooks/useLoadDatabaseFile';
import useAlerts from '@opencloning/ui/hooks/useAlerts';
import SequenceTypeChip from '../components/SequenceTypeChip';
import { CommaSeparatorWrapper, SequenceLink } from '../components/EntityLinks';
import TagChip from '../components/TagChip';
import { parseSequenceParams, applySequenceParamsToSearchParams } from '../utils/query_utils';
import SearchBar from '../components/SearchBar';
import TagMultiSelect from '../components/TagMultiSelect';
import SequenceTypeMultiSelect from '../components/SequenceTypeMultiSelect';
import { UrlParamsForm } from '../components/urlParamsForm';

const MIN_WIDTH = 200;

function SequenceQueryFields({ pendingParams, setPendingParams }) {
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
        label="Name"
        placeholder="Search by name"
        value={pendingParams.name ?? ''}
        onChange={(value) => setPendingParams((p) => ({ ...p, name: value }))}
        sx={{ minWidth: MIN_WIDTH }}
      />
      <SequenceTypeMultiSelect
        value={pendingParams.sequence_types ?? []}
        onChange={(value) => setPendingParams((p) => ({ ...p, sequence_types: value }))}
        sx={{ minWidth: MIN_WIDTH }}
      />
      <TagMultiSelect
        value={pendingParams.tags ?? []}
        onChange={(value) => setPendingParams((p) => ({ ...p, tags: value }))}
        sx={{ minWidth: MIN_WIDTH }}
      />
      <FormControlLabel
        control={
          <Switch
            checked={pendingParams.with_uid ?? false}
            onChange={(value) => setPendingParams((p) => ({ ...p, with_uid: !p.with_uid }))}
          />
        }
        label="With UID"
        labelPlacement="top"
      />
      <Button variant="contained" color="primary" type="submit">
        Search
      </Button>
    </>
  )}


function SequencesPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchParams] = useSearchParams();
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


  const filters = useMemo(
    () => parseSequenceParams(searchParams),
    [searchParams],
  );
  const filtersForApi = {
    ...filters,
    uid: filters.uid
  };


  const { data, isLoading, error } = useQuery({
    queryKey: ['sequences', { page: page + 1, size: rowsPerPage, ...filters }],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get(endpoints.sequences, {
        params: {
          page: page + 1,
          size: rowsPerPage,
          ...filtersForApi,
        },
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
      <UrlParamsForm
        parse={parseSequenceParams}
        applyToSearchParams={applySequenceParamsToSearchParams}
        component={SequenceQueryFields}
      />
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>UID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell padding="none" width={48} />
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((seq) => (
              <TableRow key={seq.id} hover>
                <TableCell>{seq.sample_uids?.join(', ') ?? '—'}</TableCell>
                <TableCell>
                  <SequenceLink id={seq.id} name={seq.name} />
                </TableCell>
                <TableCell>
                  <SequenceTypeChip sequenceType={seq.sequence_type} />
                </TableCell>
                <TableCell>
                  {seq.tags?.length ? (
                    <CommaSeparatorWrapper>
                      {seq.tags.map((tag) => (
                        <TagChip key={tag.id} tag={tag} />
                      ))}
                    </CommaSeparatorWrapper>
                  ) : (
                    '—'
                  )}
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
