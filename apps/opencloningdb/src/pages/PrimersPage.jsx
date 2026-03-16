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
import { parsePrimersParams, applyPrimersParamsToSearchParams } from '../utils/query_utils';
import { PrimerLink } from '../components/EntityLinks';
import SearchBar from '../components/SearchBar';
import TagMultiSelect from '../components/TagMultiSelect';
import { UrlParamsForm } from '../components/urlParamsForm';
import TagChipList from '../components/TagChipList';
import TagEntitiesButton from '../components/TagEntitiesButton';
import TopButtonSection from '../components/TopButtonSection';
import AddToCloningButton from '../components/AddToCloningButton';
import PageContainer from '../components/PageContainer';

const MIN_WIDTH = 200;

function PrimerQueryFields({ pendingParams, setPendingParams }) {
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
      <TagMultiSelect
        value={pendingParams.tags ?? []}
        onChange={(value) => setPendingParams((p) => ({ ...p, tags: value }))}
        sx={{ minWidth: MIN_WIDTH }}
      />
      <FormControlLabel
        control={
          <Switch
            checked={pendingParams.has_uid ?? false}
            onChange={() => setPendingParams((p) => ({ ...p, has_uid: !p.has_uid }))}
          />
        }
        label="With UID"
        labelPlacement="top"
      />
      <Button variant="contained" color="primary" type="submit">
        Search
      </Button>
    </>
  );
}

function PrimersPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [searchParams] = useSearchParams();


  const filters = useMemo(
    () => parsePrimersParams(searchParams),
    [searchParams],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['primers', { page: page + 1, size: rowsPerPage, ...filters }],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get(endpoints.primers, {
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

  const toggleRow = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectedPrimers = items.filter((primer) => selectedIds.has(primer.id));

  if (isLoading && !data) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load primers'}</Alert>;

  return (
    <PageContainer>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Primers
      </Typography>
      <UrlParamsForm
        parse={parsePrimersParams}
        applyToSearchParams={applyPrimersParamsToSearchParams}
        component={PrimerQueryFields}
      />
      <TopButtonSection>
        <TagEntitiesButton
          selectedEntities={selectedPrimers}
          entityType="input_entities"
          label="Primers"
          onSuccess={() => {setSelectedIds(new Set());}}
        />
        <AddToCloningButton selectedEntities={selectedPrimers} entityType="primer">
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
              <TableCell>Tags</TableCell>
              <TableCell>Sequence</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((primer) => (
              <TableRow key={primer.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={selectedIds.has(primer.id)}
                    onChange={() => toggleRow(primer.id)}
                  />
                </TableCell>
                <TableCell>{primer.uid ?? '—'}</TableCell>
                <TableCell>
                  <PrimerLink id={primer.id} name={primer.name} />
                </TableCell>
                <TableCell>
                  <TagChipList tags={primer.tags} />
                </TableCell>
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
    </PageContainer>
  );
}

export default PrimersPage;
