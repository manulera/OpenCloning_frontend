import { Dialog, DialogContent, DialogTitle, List, ListItem, ListItemText } from '@mui/material';
import React from 'react';
import useBackendRoute from '../../hooks/useBackendRoute';
import useHttpClient from '../../hooks/useHttpClient';

function VersionDialog({ open, setOpen }) {
  const backendRoute = useBackendRoute();
  const [backendVersion, setBackendVersion] = React.useState(null);
  const [schemaVersion, setSchemaVersion] = React.useState(null);
  const frontendVersion = process?.env?.GIT_TAG;
  const httpClient = useHttpClient();
  React.useEffect(() => {
    if (open) {
      const url = backendRoute('/version');
      httpClient.get(url).then(({ data }) => {
        setBackendVersion(data.backend_version);
        setSchemaVersion(data.schema_version);
      });
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      className="version-dialog"
    >
      <DialogTitle sx={{ textAlign: 'center' }}> App version </DialogTitle>
      <DialogContent>
        <List>
          <ListItem fullWidth>
            <ListItemText primary="Frontend" secondary={frontendVersion || 'N.A.'} />
          </ListItem>
          <ListItem fullWidth>
            <ListItemText primary="Backend" secondary={backendVersion || 'N.A.'} />
          </ListItem>
          <ListItem fullWidth>
            <ListItemText primary="Schema" secondary={schemaVersion || 'N.A.'} />
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
}

export default VersionDialog;
