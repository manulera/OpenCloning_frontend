import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import React from 'react';
import { useDispatch } from 'react-redux';
import { addHistory, loadData } from '../utils/readNwrite';
import useBackendRoute from '../hooks/useBackendRoute';
import useAlerts from '../hooks/useAlerts';

function HistoryLoadedDialog({ loadedHistory, setLoadedHistory }) {
  const [selectedOption, setSelectedOption] = React.useState('replace');
  const dispatch = useDispatch();
  const backendRoute = useBackendRoute();
  const { addAlert } = useAlerts();
  return (
    <Dialog
      open={loadedHistory !== null}
      onClose={() => setLoadedHistory(null)}
      PaperProps={{
        component: 'form',
        onSubmit: (event) => {
          event.preventDefault();
          if (selectedOption === 'replace') {
            loadData(loadedHistory, false, dispatch, addAlert, backendRoute('validate'));
          } else {
            addHistory(loadedHistory, dispatch, addAlert, backendRoute('validate'));
          }
          setLoadedHistory(null);
        },
      }}
      className="history-loaded-dialog"
    >
      <DialogTitle>History loaded</DialogTitle>
      <DialogContent>
        <FormControl fullWidth>
          <RadioGroup
            value={selectedOption}
            variant="standard"
            onChange={(e) => setSelectedOption(e.target.value)}
          >
            <FormControlLabel value="replace" control={<Radio />} label="Replace existing" />
            <FormControlLabel value="add" control={<Radio />} label="Add to existing" />
          </RadioGroup>
        </FormControl>

      </DialogContent>
      <DialogActions>
        <Button onClick={() => { setLoadedHistory(null); }}>
          Cancel
        </Button>
        <Button type="submit">Select</Button>
      </DialogActions>
    </Dialog>
  );
}

export default HistoryLoadedDialog;
