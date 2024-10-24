import { Dialog, DialogContent, DialogTitle, List, ListItem, ListItemText } from '@mui/material';
import React from 'react';
import axios from 'axios';
import useBackendRoute from '../../hooks/useBackendRoute';

function VersionDialog({ open, setOpen }) {
  const backendRoute = useBackendRoute();
  const [backendVersion, setBackendVersion] = React.useState(null);
  const [frontendVersion, setFrontendVersion] = React.useState(null);
  React.useEffect(() => {
    if (open) {
      const url = backendRoute('/version');
      axios.get(url).then(({ data }) => {
        const { version, commit_sha: commitSha } = data;
        setBackendVersion({ version, commitSha });
      });
      axios.get(`${import.meta.env.BASE_URL}version.json`).then(({ data }) => {
        const { version, commit_sha: commitSha } = data;
        setFrontendVersion({ version, commitSha });
      });
    }
  }, [open]);

  const backend = (
    <>
      Version: &nbsp;
      {(backendVersion && backendVersion.version)
        ? (
          <a href={`https://github.com/manulera/ShareYourCloning_backend/releases/tag/${backendVersion.version}`}>
            {backendVersion.version}
          </a>
        ) : 'N.A.'}
      <br />
      Commit: &nbsp;
      {(backendVersion && backendVersion.commitSha)
        ? (
          <a href={`https://github.com/manulera/ShareYourCloning_backend/commit/${backendVersion.commitSha}`}>
            {backendVersion.commitSha}
          </a>
        ) : 'N.A.'}
    </>
  );

  const frontend = (
    <>
      Version: &nbsp;
      {frontendVersion && frontendVersion.version
        ? (
          <a href={`https://github.com/manulera/ShareYourCloning_frontend/releases/tag/${frontendVersion.version}`}>
            {frontendVersion.version}
          </a>
        ) : 'N.A.'}
      <br />
      Commit: &nbsp;
      {(frontendVersion && frontendVersion.commitSha)
        ? (
          <a href={`https://github.com/manulera/ShareYourCloning_frontend/commit/${frontendVersion.commitSha}`}>
            {frontendVersion.commitSha}
          </a>
        ) : 'N.A.'}
    </>
  );

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
            <ListItemText primary="Frontend" secondary={frontend} />
          </ListItem>
          <ListItem fullWidth>
            <ListItemText primary="Backend" secondary={backend} />
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
}

export default VersionDialog;
