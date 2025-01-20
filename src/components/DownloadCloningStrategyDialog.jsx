import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';
import React from 'react';
import { useSelector, useStore } from 'react-redux';
import { downloadStateAsJson, downloadStateAsZip } from '../utils/readNwrite';

// You can override the downloadSequence function by passing a downloadCallback that takes the fileName and entity as arguments
function DownloadCloningStrategyDialog({ open, setOpen }) {
  const [fileName, setFileName] = React.useState('cloning_strategy');
  const [extension, setExtension] = React.useState('.json');
  const hasVerificationFiles = useSelector(({ cloning }) => cloning.files.length > 0);

  const store = useStore();

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      PaperProps={{
        component: 'form',
        onSubmit: (event) => {
          event.preventDefault();
          setOpen(false);
          const cloningState = store.getState().cloning;
          if (extension === '.zip') {
            downloadStateAsZip(cloningState, fileName + extension);
          } else {
            downloadStateAsJson(cloningState, fileName + extension);
          }
        },
      }}
    >
      <DialogTitle>Save cloning strategy to file</DialogTitle>
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
          {hasVerificationFiles && (
            <>
              <FormLabel id="save-file-radio-group-label">File format</FormLabel>
              <RadioGroup
                aria-labelledby="save-file-radio-group-label"
                value={extension}
                variant="standard"
                onChange={(e) => setExtension(e.target.value)}
              >
                <FormControlLabel value=".json" control={<Radio />} label="json (cloning strategy)" />
                <FormControlLabel value=".zip" control={<Radio />} label="zip (cloning strategy + verification files)" />
              </RadioGroup>
            </>
          )}
        </FormControl>

      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button type="submit">Save file</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DownloadCloningStrategyDialog;
