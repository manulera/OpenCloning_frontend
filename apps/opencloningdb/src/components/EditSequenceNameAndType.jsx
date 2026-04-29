import React from 'react';
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';

import useAppAlerts from '../hooks/useAppAlerts';
import { VALID_SEQUENCE_TYPES, CIRCULAR_SEQUENCE_TYPES, LINEAR_SEQUENCE_TYPES } from '../utils/query_utils';

function SequenceTypeSelect({ value, onChange, isCircular, helperText }) {
  return (
    <Tooltip
      title="Circular sequences can only be plasmids"
      disableHoverListener={!isCircular}
    >
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="sequence-type-label">Type</InputLabel>
        <Select
          labelId="sequence-type-label"
          label="Type"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isCircular}
          helperText={helperText}
        >
          {VALID_SEQUENCE_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {isCircular ? CIRCULAR_SEQUENCE_TYPES[t] : LINEAR_SEQUENCE_TYPES[t] ?? t}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Tooltip>
  );
}

function EditSequenceNameAndType({ sequenceData, sequenceInDb, onSave }) {
  const queryClient = useQueryClient();
  const { addAlert } = useAppAlerts();

  const sequenceId = sequenceInDb.id;
  const isCircular = sequenceData.circular;

  const [name, setName] = React.useState(sequenceInDb.name);
  const [sequenceType, setSequenceType] = React.useState(sequenceInDb.sequence_type);

  React.useEffect(() => {
    setName(sequenceInDb.name);
    setSequenceType(sequenceInDb.sequence_type);
  }, [sequenceInDb]);


  const submissionAllowed = name.trim().length > 0;

  const patchMutation = useMutation({
    mutationFn: async (payload) => openCloningDBHttpClient.patch(endpoints.sequence(sequenceId), payload),
    onSuccess: () => {
      addAlert({ message: 'Sequence updated successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['sequence', sequenceId, 'cloning_strategy'] });
      onSave();
    },
    onError: (error) => {
      addAlert({
        message: error?.response?.data?.detail || error?.message || 'Error updating sequence',
        severity: 'error',
      });
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newName = name.trim();
    if (!submissionAllowed) return;

    if (newName === sequenceInDb.name && sequenceType === sequenceInDb.sequence_type) {
      onSave();
    } else {
      patchMutation.mutate({
        name: newName,
        'sequence_type': isCircular ? undefined : sequenceType,
      });
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
    >

      <TextField
        size="small"
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={name.trim().length === 0}
        helperText={name.trim().length === 0 ? 'Name cannot be empty' : undefined}
        sx={{ minWidth: 220 }}
      />

      <SequenceTypeSelect value={sequenceType} onChange={setSequenceType} isCircular={isCircular} />

      <Button
        type="submit"
        variant="contained"
        size="small"
        disabled={!submissionAllowed || patchMutation.isLoading}
        startIcon={patchMutation.isLoading ? <CircularProgress size={16} /> : null}
      >
        {patchMutation.isLoading ? 'Submitting' : 'Save'}
      </Button>
      <Button
        variant="text"
        color="error"
        onClick={() => onSave()}
      >
        Cancel
      </Button>
    </Box>
  );
}

export default EditSequenceNameAndType;
