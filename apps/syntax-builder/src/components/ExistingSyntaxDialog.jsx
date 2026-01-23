import React from 'react'
import { Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, ListItemButton } from '@mui/material'
import axios from 'axios';
import useUploadData from './useUploadData';
import { useLinkedPlasmids } from '../context/FormDataContext';

function ExistingSyntaxDialog({ open, onClose, setSubmissionError }) {
  const [syntaxes, setSyntaxes] = React.useState([]);
  const { uploadData } = useUploadData();
  const { setLinkedPlasmids } = useLinkedPlasmids();
  React.useEffect(() => {
    axios.get('syntax/index.json').then((response) => {
      setSyntaxes(response.data);
    });
  }, []);
  const onSyntaxClick = React.useCallback(async (syntax) => {
    axios.get(`syntax/${syntax.path}/syntax.json`, { responseType: 'blob' }).then((response) => {
      const file = new File([response.data], `${syntax.path}_syntax.json`, { type: 'application/json' });
      uploadData(file);
    }).catch((error) => {
      setSubmissionError(error.message);
    });

    const { data } = await axios.get(`syntax/${syntax.path}/plasmids.json`)
    setLinkedPlasmids(data);
  }, [uploadData, setLinkedPlasmids, setSubmissionError]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Load an existing syntax</DialogTitle>
      <DialogContent>
        <List>
          {syntaxes.map((syntax) => (
            <ListItem key={syntax.path}>
              <ListItemButton onClick={() => {onSyntaxClick(syntax); onClose();}}>
                <ListItemText primary={syntax.name} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  )
}

export default ExistingSyntaxDialog
