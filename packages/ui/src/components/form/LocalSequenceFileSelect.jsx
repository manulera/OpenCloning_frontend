import React from 'react'
import useLocalFiles from '../../hooks/useLocalFiles';
import RequestStatusWrapper from './RequestStatusWrapper';
import { Alert, Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

function LocalSequenceFileSelect({ onFileSelected, multiple = false }) {
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedSequenceIndex, setSelectedSequenceIndex] = React.useState('');
  const [error, setError] = React.useState(null);

  const { categories, sequences, indexRequestStatus, indexRetry, requestFile } = useLocalFiles();

  const onSubmit = React.useCallback(async (e) => {
    e.preventDefault();
    const selectedSequence = sequences[selectedSequenceIndex];
    if (!selectedSequence.path) {
      setError('Malformatted sequence, must have a path');
      return;
    }
    let fileContent = null;
    try {
      fileContent = await requestFile(selectedSequence.path);
    } catch (error) {
      setError('Error requesting file');
      return;
    }

    const file = new File([fileContent], selectedSequence.path, { type: 'text/plain' });

    onFileSelected(file);

  }, [selectedSequenceIndex, requestFile, sequences, onFileSelected]);

  const availableSequences = React.useMemo(() => {
    if (selectedCategory === '') {
      return sequences;
    }
    return sequences.filter((sequence) => sequence.categories?.includes(selectedCategory));
  }, [sequences, selectedCategory]);

  const onCategoryChange = React.useCallback((e) => {
    setSelectedSequenceIndex('');
    setSelectedCategory(e.target.value);
  }, []);

  const buttonDisabled = selectedSequenceIndex === '';

  return (
    <RequestStatusWrapper requestStatus={indexRequestStatus} retry={indexRetry}>
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={onSubmit}>
        <FormControl fullWidth>
          <InputLabel id="category-label">Category</InputLabel>
          <Select
            label="Category"
            labelId="category-label"
            id="category-select"
            value={selectedCategory}
            onChange={onCategoryChange}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {categories.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="sequence-label">Sequence</InputLabel>
          <Select
            label="Sequence"
            labelId="sequence-label"
            id="sequence-select"
            value={selectedSequenceIndex}
            onChange={(e) => setSelectedSequenceIndex(e.target.value)}
          >
            {availableSequences.map((sequence, index) => <MenuItem key={index} value={index}>{sequence.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <Button disabled={buttonDisabled} type="submit" variant="contained" color="primary">Submit</Button>
        </FormControl>
      </form>
    </RequestStatusWrapper>
  );
}

export default LocalSequenceFileSelect
