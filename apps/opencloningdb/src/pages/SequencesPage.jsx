import React, { useState, useEffect, useMemo } from 'react';
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
  Box,
  Button,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import useLoadDatabaseFile from '@opencloning/ui/hooks/useLoadDatabaseFile';
import useAlerts from '@opencloning/ui/hooks/useAlerts';
import SequenceTypeChip from '../components/SequenceTypeChip';
import { CommaSeparatorWrapper, SequenceLink } from '../components/EntityLinks';
import TagChip from '../components/TagChip';
import { parseBoolean, parseString, parseIntArray } from '../utils/query_utils';
import SearchBar from '../components/SearchBar';
import ChipMultiSelect from '../components/ChipMultiSelect';

function SequencesPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchParams, setSearchParams] = useSearchParams();
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


  const appliedTags = useMemo(
    () => parseIntArray(searchParams.getAll('tags')),
    [searchParams],
  );
  const appliedInstantiated = parseBoolean(searchParams.get('instantiated'));
  const appliedSequenceType = parseString(searchParams.get('sequence_type'));
  const appliedName = parseString(searchParams.get('name')) ?? '';

  const filters = {
    tags: appliedTags,
    instantiated: appliedInstantiated,
    sequence_type: appliedSequenceType,
    name: appliedName || undefined,
  };

  const [pendingName, setPendingName] = useState(appliedName);
  const [pendingTagIds, setPendingTagIds] = useState(appliedTags);

  useEffect(() => {
    setPendingName(appliedName);
  }, [appliedName]);

  useEffect(() => {
    setPendingTagIds(appliedTags);
  }, [appliedTags]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['sequences', { page: page + 1, size: rowsPerPage, ...filters }],
    queryFn: async () => {
      const { data: res } = await openCloningDBHttpClient.get(endpoints.sequences, {
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


  const onSearchSubmit = (event) => {
    event.preventDefault();
    const nextParams = new window.URLSearchParams(searchParams);

    const cleanName = pendingName.trim();
    if (cleanName) {
      nextParams.set('name', cleanName);
    } else {
      nextParams.delete('name');
    }

    if (pendingTagIds.length) {
      nextParams.delete('tags');
      nextParams.set('tags', pendingTagIds.join(','));
    } else {
      nextParams.delete('tags');
    }

    nextParams.delete('page');

    setSearchParams(nextParams);
  };

  if (isLoading && !data) return <CircularProgress />;
  if (error) return <Alert severity="error">{error?.response?.data?.detail || error?.message || 'Failed to load sequences'}</Alert>;

  return (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Sequences
      </Typography>
      <Box
        component="form"
        onSubmit={onSearchSubmit}
        sx={{
          mb: 2,
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <SearchBar
          label="Name"
          placeholder="Search by name"
          value={pendingName}
          onChange={setPendingName}
        />
        <ChipMultiSelect
          label="Tags"
          options={tagOptions}
          value={pendingTagIds}
          onChange={setPendingTagIds}
        />
        <Button
          variant="contained"
          color="primary"
          type="submit"
        >
          Search
        </Button>
      </Box>
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
