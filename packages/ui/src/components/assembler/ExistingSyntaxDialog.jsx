import React from 'react'
import { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, ListItemButton, Alert, Button, Box, ButtonGroup } from '@mui/material'
import getHttpClient from '@opencloning/utils/getHttpClient';
import RequestStatusWrapper from '../form/RequestStatusWrapper';
import { useConfig } from '../../providers';
import ServerStaticFileSelect from '../form/ServerStaticFileSelect';
import { readSubmittedTextFile } from '@opencloning/utils/readNwrite';

const httpClient = getHttpClient();
const baseURL = 'https://assets.opencloning.org/syntaxes/syntaxes/';
httpClient.defaults.baseURL = baseURL;

function LocalSyntaxDialog({ onClose, onSyntaxSelect }) {

  const onFileSelected = React.useCallback(async (file) => {
    const text = await readSubmittedTextFile(file);
    const syntaxData = JSON.parse(text);
    onSyntaxSelect(syntaxData, []);
    onClose();
  }, [onSyntaxSelect, onClose]);
  return (
    <Dialog data-testid="local-syntax-dialog" open onClose={onClose}>
      <DialogTitle>Load syntax from local server</DialogTitle>
      <DialogContent sx={{ minWidth: '400px' }}>
        <ServerStaticFileSelect onFileSelected={onFileSelected} type="syntax" />
      </DialogContent>
    </Dialog>
  )
}

function ExistingSyntaxDialog({ staticContentPath, onClose, onSyntaxSelect }) {
  const [syntaxes, setSyntaxes] = React.useState([]);
  const [connectAttempt, setConnectAttempt] = React.useState(0);
  const [requestStatus, setRequestStatus] = React.useState({ status: 'loading' });
  const [loadError, setLoadError] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const [localDialogOpen, setLocalDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setRequestStatus({ status: 'loading' });
    const fetchData = async () => {
      try {
        const { data } = await httpClient.get('index.json');
        setRequestStatus({ status: 'success' });
        setSyntaxes(data);
      } catch {
        setRequestStatus({ status: 'error', message: 'Could not load syntaxes' });
      }
    };
    fetchData();
  }, [connectAttempt]);

  const onSyntaxClick = React.useCallback(async (syntax) => {
    setLoadError(null);
    let loadingErrorPart = 'syntax'
    try {
      const { data: syntaxData } = await httpClient.get(`${syntax.path}/syntax.json`);
      loadingErrorPart = 'plasmids'
      const { data: plasmidsData } = await httpClient.get(`${syntax.path}/plasmids.json`);
      onSyntaxSelect(syntaxData, plasmidsData);
      onClose();
    } catch {
      setLoadError(`Failed to load ${loadingErrorPart} data. Please try again.`);
    }
  }, [onSyntaxSelect, onClose]);

  const handleFileUpload = React.useCallback(async (event) => {
    setLoadError(null);
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const syntaxData = JSON.parse(text);

      // Uploaded JSON files contain only syntax data, no plasmids
      onSyntaxSelect(syntaxData, []);
      onClose();
    } catch (error) {
      setLoadError(`Failed to parse JSON file: ${error.message}`);
    } finally {
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [onSyntaxSelect, onClose]);

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Load an existing syntax</DialogTitle>
      <DialogContent>
        {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
        <RequestStatusWrapper requestStatus={requestStatus} retry={() => setConnectAttempt((prev) => prev + 1)}>
          <List>
            {syntaxes.map((syntax) => (
              <ListItem key={syntax.path}>
                <ListItemButton onClick={() => {onSyntaxClick(syntax)}}>
                  <ListItemText primary={syntax.name} secondary={syntax.description} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </RequestStatusWrapper>
        <Box sx={{ mb: 2 }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <ButtonGroup sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              onClick={() => fileInputRef.current?.click()}
            >
                Upload syntax from JSON file
            </Button>
            {staticContentPath && (
              <Button
                onClick={() => setLocalDialogOpen(true)}
              >
                Load syntax from local server
              </Button>
            )}
          </ButtonGroup>
          {localDialogOpen && <LocalSyntaxDialog onClose={() => {setLocalDialogOpen(false); onClose()}} onSyntaxSelect={onSyntaxSelect} />}
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default ExistingSyntaxDialog
