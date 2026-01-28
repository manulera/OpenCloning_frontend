import React from 'react'
import { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, ListItemButton } from '@mui/material'
import getHttpClient from '@opencloning/utils/getHttpClient';

const httpClient = getHttpClient();
const baseURL = 'https://assets.opencloning.org/syntaxes/syntaxes/';
httpClient.defaults.baseURL = baseURL;

function ExistingSyntaxDialog({ onClose, onSyntaxSelect }) {
  const [syntaxes, setSyntaxes] = React.useState([]);

  React.useEffect(() => {
    httpClient.get('index.json').then((response) => {
      setSyntaxes(response.data);
    });
  }, []);

  const onSyntaxClick = React.useCallback(async (syntax) => {
    const { data: syntaxData } = await httpClient.get(`${syntax.path}/syntax.json`);
    const { data: plasmidsData } = await httpClient.get(`${syntax.path}/plasmids.json`);
    onSyntaxSelect(syntaxData, plasmidsData);
  }, [onSyntaxSelect]);

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Load an existing syntax</DialogTitle>
      <DialogContent>
        <List>
          {syntaxes.map((syntax) => (
            <ListItem key={syntax.path}>
              <ListItemButton onClick={() => {onSyntaxClick(syntax); onClose();}}>
                <ListItemText primary={syntax.name} secondary={syntax.description} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  )
}

export default ExistingSyntaxDialog
