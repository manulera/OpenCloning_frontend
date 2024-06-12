import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import GitHubIcon from '@mui/icons-material/GitHub';
import { Alert, Button, Tooltip } from '@mui/material';
import './MainAppBar.css';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import ButtonWithMenu from './ButtonWithMenu';
import { exportStateThunk, loadData } from '../../utils/readNwrite';
import SelectExampleDialog from './SelectExampleDialog';
import DialogSubmitToElab from '../form/eLabFTW/DialogSubmitToElab';
import SelectTemplateDialog from './SelectTemplateDialog';

function MainAppBar() {
  const [openExampleDialog, setOpenExampleDialog] = React.useState(false);
  const [openTemplateDialog, setOpenTemplateDialog] = React.useState(false);
  const [loadedFileError, setLoadedFileError] = React.useState('');
  const [eLabDialogOpen, setELabDialogOpen] = React.useState(false);
  const dispatch = useDispatch();
  const exportData = () => {
    dispatch(exportStateThunk());
  };

  const tooltipText = <div className="tooltip-text">See in GitHub</div>;
  // Hidden input field, used to load files.
  const fileInputRef = React.useRef(null);
  const fileMenu = [
    { display: 'Save cloning history to file', onClick: exportData },
    { display: 'Load cloning history from file', onClick: () => { fileInputRef.current.click(); fileInputRef.current.value = ''; } },
    // elab-demo
    // { display: 'Submit to eLabFTW', onClick: () => setELabDialogOpen(true) },
  ];

  const handleCloseDialog = async (url, isTemplate) => {
    setOpenExampleDialog(false);
    setOpenTemplateDialog(false);
    if (url) {
      const { data } = await axios.get(url);
      if (isTemplate) {
        const segments = url.split('/');
        const kitUrl = segments[segments.length - 3];
        const rootGithubUrl = 'https://raw.githubusercontent.com/genestorian/ShareYourCloning-submission/main/submissions';
        data.sources = data.sources.map((s) => {
          if (s.image) { return { ...s, image: `${rootGithubUrl}/${kitUrl}/${s.image}` }; } return s;
        });
      }
      loadData(data, isTemplate, dispatch, setLoadedFileError);
    }
  };

  // TODO: turn these into <a> elements.
  const helpMenu = [
    { display: 'About', onClick: () => window.open('https://www.genestorian.org/') },
    { display: 'Demo video', onClick: () => window.open('https://www.youtube.com/watch?v=HRQb6s8m8_s') },
  ];

  const onFileChange = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (eventFileRead) => {
      let jsonObject = {};
      try {
        jsonObject = JSON.parse(eventFileRead.target.result);
      } catch (e) {
        setLoadedFileError('Input file should be a JSON file with the history');
        return;
      }
      loadData(jsonObject, false, dispatch, setLoadedFileError);
    };
  };

  return (
    <AppBar position="static" className="app-bar">
      {loadedFileError && (<Alert variant="filled" severity="error" sx={{ position: 'absolute', zIndex: 999 }} onClose={() => { setLoadedFileError(''); }}>{loadedFileError}</Alert>)}
      <div className="app-name">Share Your Cloning</div>
      <Container maxWidth="s">
        <Toolbar disableGutters variant="dense" sx={{ justifyContent: 'center', minHeight: 50 }}>
          <Box
            sx={{
              display: { md: 'flex', xs: 'flex' },
              flexDirection: { md: 'row', xs: 'column' },
              height: '100%',
            }}
          >
            <ButtonWithMenu menuItems={fileMenu}> File </ButtonWithMenu>
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={onFileChange} />
            <ButtonWithMenu menuItems={helpMenu}> Help </ButtonWithMenu>
            <Button onClick={() => setOpenExampleDialog(true)}>Examples</Button>
            <Button onClick={() => setOpenTemplateDialog(true)}>Templates</Button>
            <Tooltip title={tooltipText} arrow placement="right">
              <Button className="github-icon" onClick={() => window.open('https://github.com/manulera/ShareYourCloning')}>
                <GitHubIcon />
              </Button>
            </Tooltip>
          </Box>
        </Toolbar>
      </Container>
      <SelectExampleDialog onClose={handleCloseDialog} open={openExampleDialog} />
      <SelectTemplateDialog onClose={handleCloseDialog} open={openTemplateDialog} />
      {/* elab-demo */}
      {/* (
      {eLabDialogOpen && (<DialogSubmitToElab dialogOpen={eLabDialogOpen} setDialogOpen={setELabDialogOpen} />)}
      ) */}

    </AppBar>
  );
}

export default MainAppBar;
