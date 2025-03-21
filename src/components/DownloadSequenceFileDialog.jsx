import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { isEqual } from 'lodash-es';
import { downloadSequence } from '../utils/readNwrite';
import { exportSubStateThunk } from '../utils/thunks';
import { getPCRPrimers, getPrimerLinks } from '../store/cloning_utils';

// You can override the downloadSequence function by passing a downloadCallback that takes the fileName and sequence as arguments
function DownloadSequenceFileDialog({ id, dialogOpen, setDialogOpen, downloadCallback }) {
  const [fileName, setFileName] = React.useState('');
  const [extension, setExtension] = React.useState('.gb');
  const sequenceData = useSelector(({ cloning }) => cloning.teselaJsonCache[id], isEqual);
  const seqCopy = structuredClone(sequenceData);
  const linkedPrimers = useSelector(({ cloning }) => getPrimerLinks(cloning, id), isEqual);
  const pcrPrimers = useSelector(({ cloning }) => getPCRPrimers(cloning, id), isEqual);
  // To be able to use this function for non-state sequences
  if (seqCopy) {
    seqCopy.primers = [...seqCopy.primers, ...linkedPrimers, ...pcrPrimers];
  }
  const dispatch = useDispatch();

  React.useEffect(() => {
    if (sequenceData) {
      setFileName(sequenceData.name);
    }
  }, [sequenceData]);

  return (
    <Dialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      PaperProps={{
        component: 'form',
        onSubmit: (event) => {
          event.preventDefault();
          setDialogOpen(false);
          if (downloadCallback) {
            downloadCallback(fileName + extension, seqCopy);
          } else if (extension === '.json') {
            dispatch(exportSubStateThunk(fileName + extension, id));
          } else {
            downloadSequence(fileName + extension, seqCopy);
          }
        },
      }}
    >
      <DialogTitle>Save sequence to file</DialogTitle>
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
          <FormLabel id="save-file-radio-group-label">File format</FormLabel>
          <RadioGroup
            aria-labelledby="save-file-radio-group-label"
            value={extension}
            variant="standard"
            onChange={(e) => setExtension(e.target.value)}
          >
            <FormControlLabel value=".gb" control={<Radio />} label="genbank" />
            <FormControlLabel value=".fasta" control={<Radio />} label="fasta" />
            <FormControlLabel value=".json" control={<Radio />} label="json (sequence + history)" />
          </RadioGroup>
        </FormControl>

      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setDialogOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button type="submit">Save file</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DownloadSequenceFileDialog;
