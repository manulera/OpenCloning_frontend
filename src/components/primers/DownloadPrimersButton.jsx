import React from 'react';

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, TextField } from '@mui/material';
import primersToTabularFile from './primersToTabularFile';

function DownloadPrimersButton({ primers }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [fileName, setFileName] = React.useState('primers');
  const [extension, setExtension] = React.useState('.csv');

  const handleDownload = () => {
    const fullFileName = fileName + extension;
    const separator = extension === '.csv' ? ',' : '\t';
    const fileContent = primersToTabularFile(primers, separator);

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fullFileName;
    link.click();

    setDialogOpen(false);
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setDialogOpen(true)}
      >
        Download Primers
      </Button>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            handleDownload();
          },
        }}
      >
        <DialogTitle>Save Primers to File</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <TextField
              autoFocus
              required
              id="file_name"
              label="File name"
              variant="standard"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormLabel id="save-primers-radio-group-label">File format</FormLabel>
            <RadioGroup
              aria-labelledby="save-primers-radio-group-label"
              value={extension}
              variant="standard"
              onChange={(e) => setExtension(e.target.value)}
            >
              <FormControlLabel value=".csv" control={<Radio />} label="csv" />
              <FormControlLabel value=".tsv" control={<Radio />} label="tsv" />
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">Save file</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default DownloadPrimersButton;
