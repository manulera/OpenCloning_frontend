import React from 'react'
import useLocalFiles from '../../hooks/useLocalFiles';
import RequestStatusWrapper from './RequestStatusWrapper';
import { Alert, Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

function LocalFileSelect({ onFileSelected, multiple = false, type = 'sequence' }) {
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedOptionIndex, setSelectedOptionIndex] = React.useState(multiple ? [] : '');
  const [error, setError] = React.useState(null);

  const localFiles = useLocalFiles();
  const{ index, indexRequestStatus, indexRetry, requestFile } = localFiles;

  const options = React.useMemo(() => {
    if (index === null) return [];
    if (type !== 'sequence') {
      return index.syntaxes;
    }
    if (selectedCategory === '') {
      return index.sequences;
    }
    return index.sequences.filter((sequence) => sequence.categories?.includes(selectedCategory));
  }, [type, index, selectedCategory]);

  const optionToFile = React.useCallback(async (option) => {
    if (!option.path) {
      throw new Error('Malformatted option, must have a path');
    }
    let fileContent = null;
    try {
      fileContent = await requestFile(option.path);
    } catch (error) {
      throw new Error(`Error requesting file: ${error.message}`);
    }
    if (typeof fileContent !== 'string') {
      fileContent = JSON.stringify(fileContent);
    }
    const file = new File([fileContent], option.path, { type: 'text/plain' });
    return file;
  }, [requestFile]);

  const onSubmit = React.useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (!multiple) {
        const file = await optionToFile(options[selectedOptionIndex]);
        onFileSelected(file);
      } else {
        const files = await Promise.all(selectedOptionIndex.map((index) => optionToFile(options[index])));
        onFileSelected(files);
      }
    } catch (error) {
      setError(error.message);
    }
  }, [multiple, selectedOptionIndex, options, onFileSelected, optionToFile]);

  const onCategoryChange = React.useCallback((e) => {
    setSelectedOptionIndex(multiple ? [] : '');
    setSelectedCategory(e.target.value);
  }, [multiple]);

  const buttonDisabled = multiple ? selectedOptionIndex.length === 0 : selectedOptionIndex === '';

  const label = type === 'sequence' ? 'Sequence' : 'Syntax';
  return (
    <RequestStatusWrapper requestStatus={indexRequestStatus} retry={indexRetry}>
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={onSubmit}>
        {type === 'sequence' && (
          <FormControl fullWidth sx={{ my: 1 }}>
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
              {index?.categories?.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        <FormControl fullWidth sx={{ my: 1 }}>
          <InputLabel id="option-label">{label}</InputLabel>
          <Select
            label={label}
            labelId="option-label"
            id="option-select"
            multiple={multiple}
            value={selectedOptionIndex}
            onChange={(e) => setSelectedOptionIndex(e.target.value)}
          >
            {options.map((option, index) => <MenuItem key={index} value={index}>{option.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <Button disabled={buttonDisabled} type="submit" variant="contained" color="primary">Submit</Button>
        </FormControl>
      </form>
    </RequestStatusWrapper>
  );
}

export default LocalFileSelect
