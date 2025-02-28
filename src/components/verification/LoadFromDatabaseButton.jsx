import React from 'react';
import { Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel } from '@mui/material';
import useDatabase from '../../hooks/useDatabase';
import useAlerts from '../../hooks/useAlerts';

function LoadFromDatabaseButton({ databaseId, handleFileUpload }) {
  const database = useDatabase();
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState([]);
  const [selectedFiles, setSelectedFiles] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const addAlert = useAlerts();
  React.useEffect(() => {
    async function getFiles() {
      setLoading(true);
      setFiles(await database.getSequencingFiles(databaseId));
      setLoading(false);
    }
    if (open) {
      getFiles();
    }
  }, [open]);

  const handleSubmit = async () => {
    setOpen(false);
    try {
      const filesToLoad = await Promise.all(selectedFiles.map((file) => files.find((f) => f.name === file).getFile()));
      handleFileUpload(filesToLoad);
    } catch (error) {
      addAlert({
        message: 'Error loading files',
        severity: 'error',
      });
    }
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
      >
        {`Load from ${database.name}`}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Select sequencing files to load</DialogTitle>
        <DialogContent>
          {loading && <CircularProgress />}
          {!loading && files.length > 0 && (
            <div>
              {files.map((file, index) => (
                <div key={file.name}>
                  <FormControlLabel
                    control={(
                      <Checkbox
                        checked={selectedFiles.includes(file.name)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles([...selectedFiles, file.name]);
                          } else {
                            setSelectedFiles(selectedFiles.filter((f) => f !== file.name));
                          }
                        }}
                      />
                    )}
                    label={file.name}
                  />
                </div>
              ))}
            </div>
          )}
          {!loading && files.length === 0 && (
            <DialogContentText>
              No sequencing files found in the database.
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Load</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default LoadFromDatabaseButton;
