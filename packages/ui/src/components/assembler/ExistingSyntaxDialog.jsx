import React from 'react'
import { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, ListItemButton, Alert } from '@mui/material'
import getHttpClient from '@opencloning/utils/getHttpClient';
import RequestStatusWrapper from '../form/RequestStatusWrapper';

const httpClient = getHttpClient();
const baseURL = 'https://assets.opencloning.org/syntaxes/syntaxes/';
httpClient.defaults.baseURL = baseURL;

function ExistingSyntaxDialog({ onClose, onSyntaxSelect }) {
  const [syntaxes, setSyntaxes] = React.useState([]);
  const [connectAttempt, setConnectAttempt] = React.useState(0);
  const [requestStatus, setRequestStatus] = React.useState({ status: 'loading' });
  const [loadError, setLoadError] = React.useState(null);

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

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Load an existing syntax</DialogTitle>
      <DialogContent>
        <RequestStatusWrapper requestStatus={requestStatus} retry={() => setConnectAttempt((prev) => prev + 1)}>
          {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
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
      </DialogContent>
    </Dialog>
  )
}

export default ExistingSyntaxDialog
