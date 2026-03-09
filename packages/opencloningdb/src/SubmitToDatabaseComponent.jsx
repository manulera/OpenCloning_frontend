import { FormControl, TextField } from '@mui/material';
import React from 'react';
import { useSelector } from 'react-redux';

function SubmitToDatabaseComponent({ id, setSubmissionData, resourceType }) {
  const name = useSelector((state) => {
    if (resourceType === 'primer') {
      return state.cloning.primers.find((p) => p.id === id).name;
    }
    return state.cloning.teselaJsonCache[id].name;
  });
  const [title, setTitle] = React.useState(name);

  React.useEffect(() => {
    setTitle(name);
  }, [name]);

  React.useEffect(() => {
    if (title) {
      setSubmissionData((prev) => ({ ...prev, title }));
    } else {
      setSubmissionData(null);
    }
  }, [title]);

  return (
    <FormControl fullWidth sx={{ mb: 2 }}>
      <TextField
        autoFocus
        required
        id="resource_title"
        label="Name"
        variant="standard"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
    </FormControl>
  );
}

export default SubmitToDatabaseComponent;
