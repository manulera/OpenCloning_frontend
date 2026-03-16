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
  Switch,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import SequenceTypeChip from '../components/SequenceTypeChip';
import { SequenceLink } from '../components/EntityLinks';
import { parseSequenceParams, applySequenceParamsToSearchParams } from '../utils/query_utils';
import SearchBar from '../components/SearchBar';
import TagMultiSelect from '../components/TagMultiSelect';
import SequenceTypeMultiSelect from '../components/SequenceTypeMultiSelect';
import { UrlParamsForm } from '../components/urlParamsForm';
import TagEntitiesButton from '../components/TagEntitiesButton';
import TagChipList from '../components/TagChipList';
import TopButtonSection from '../components/TopButtonSection';
import AddToCloningButton from '../components/AddToCloningButton';
import PageContainer from '../components/PageContainer';

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
            checked={pendingParams.has_uid ?? false}
            onChange={(value) => setPendingParams((p) => ({ ...p, has_uid: !p.has_uid }))}
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
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchParams] = useSearchParams();


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

  const toggleRow = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedSequences = items.filter((seq) => selectedIds.has(seq.id));

  if (isLoading && !data) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load sequences'}</Alert>;

  return (
    <PageContainer>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Sequences
      </Typography>
      <UrlParamsForm
        parse={parseSequenceParams}
        applyToSearchParams={applySequenceParamsToSearchParams}
        component={SequenceQueryFields}
      />
      <TopButtonSection>
        <TagEntitiesButton
          selectedEntities={selectedSequences}
          entityType="input_entities"
          label="Sequences"
          onSuccess={() => {setSelectedIds(new Set());}}
        />
        <AddToCloningButton selectedEntities={selectedSequences} entityType="sequence">
          Add to Cloning Tab
        </AddToCloningButton>
      </TopButtonSection>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>UID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Tags</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((seq) => (
              <TableRow key={seq.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={selectedIds.has(seq.id)}
                    onChange={() => toggleRow(seq.id)}
                  />
                </TableCell>
                <TableCell>{seq.sample_uids?.join(', ') ?? '—'}</TableCell>
                <TableCell>
                  <SequenceLink id={seq.id} name={seq.name} />
                </TableCell>
                <TableCell>
                  <SequenceTypeChip sequenceType={seq.sequence_type} />
                </TableCell>
                <TableCell>
                  <TagChipList tags={seq.tags} />
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
    </PageContainer>
  );
}

export default SequencesPage;
