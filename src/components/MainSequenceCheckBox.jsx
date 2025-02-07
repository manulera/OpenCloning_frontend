import React from 'react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Rule';
import Tooltip from '@mui/material/Tooltip';
import SaveIcon from '@mui/icons-material/Save';
import { useDispatch, useSelector } from 'react-redux';
import { cloningActions } from '../store/cloning';
import useStoreEditor from '../hooks/useStoreEditor';
import DownloadSequenceFileDialog from './DownloadSequenceFileDialog';
import EditSequenceNameDialog from './EditSequenceNameDialog';
import VerificationFileDialog from './verification/VerificationFileDialog';
import DialogSubmitToElab from './form/eLabFTW/DialogSubmitToElab';
import { getSourceDatabaseId } from '../store/cloning_utils';

function MainSequenceCheckBox({ id }) {
  const [downloadDialogOpen, setDownloadDialogOpen] = React.useState(false);
  const [editNameDialogOpen, setEditNameDialogOpen] = React.useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = React.useState(false);
  const [eLabDialogOpen, setELabDialogOpen] = React.useState(false);
  const dispatch = useDispatch();
  const { updateStoreEditor } = useStoreEditor();
  const { setMainSequenceId, setCurrentTab } = cloningActions;
  const mainSequenceId = useSelector((state) => state.cloning.mainSequenceId);
  const hasVerificationFiles = useSelector((state) => state.cloning.files.some((file) => file.sequence_id === id));
  const hasDatabaseId = useSelector((state) => getSourceDatabaseId(state.cloning.sources, id) !== undefined);

  const toggleMain = () => {
    dispatch(setMainSequenceId(id));
    dispatch(setCurrentTab(3));
    updateStoreEditor('mainEditor', id);
    // TODO: ideally this should be done with a ref
    document.getElementById('opencloning-app-tabs')?.scrollIntoView();
  };
  const tooltipText = <div className="tooltip-text">See sequence in main editor</div>;

  return (
    <div className="node-corner">
      {downloadDialogOpen && <DownloadSequenceFileDialog {...{ id, dialogOpen: downloadDialogOpen, setDialogOpen: setDownloadDialogOpen }} />}
      {editNameDialogOpen && <EditSequenceNameDialog {...{ id, dialogOpen: editNameDialogOpen, setDialogOpen: setEditNameDialogOpen }} />}
      {verificationDialogOpen && <VerificationFileDialog {...{ id, dialogOpen: verificationDialogOpen, setDialogOpen: setVerificationDialogOpen }} />}
      {eLabDialogOpen && <DialogSubmitToElab {...{ id, dialogOpen: eLabDialogOpen, setDialogOpen: setELabDialogOpen, resourceType: 'sequence' }} />}
      <Tooltip title={hasDatabaseId ? 'Saved to eLabFTW' : 'Submit to eLabFTW'} arrow placement="top">
        <SaveIcon
          onClick={() => !hasDatabaseId && setELabDialogOpen(true)}
          type="button"
          className="node-corner-icon"
          sx={{
            color: hasDatabaseId ? 'success.main' : 'gray',
            cursor: hasDatabaseId ? 'default' : 'pointer',
            '&:hover': {
              filter: hasDatabaseId ? 'none' : 'brightness(70%)',
            },
          }}
        />
      </Tooltip>
      <Tooltip title="Verification files" arrow placement="top">
        <CheckIcon onClick={() => setVerificationDialogOpen(true)} type="button" className="node-corner-icon" sx={{ color: hasVerificationFiles ? '#2e7d32' : 'gray', cursor: 'pointer', '&:hover': { filter: 'brightness(70%)' } }} />
      </Tooltip>
      <Tooltip title="Change name" arrow placement="top">
        <EditIcon onClick={() => setEditNameDialogOpen(true)} type="button" className="node-corner-icon" sx={{ color: 'gray', cursor: 'pointer', '&:hover': { filter: 'brightness(70%)' } }} />
      </Tooltip>
      <Tooltip title={tooltipText} arrow placement="top">
        <VisibilityIcon onClick={toggleMain} type="button" className="node-corner-icon" sx={{ cursor: 'pointer', color: (id === mainSequenceId) ? '#2e7d32' : 'gray', '&:hover': { filter: 'brightness(70%)' } }} />
      </Tooltip>
      <Tooltip title="Download sequence" arrow placement="top">
        <DownloadIcon onClick={() => setDownloadDialogOpen(true)} type="button" className="node-corner-icon" sx={{ color: 'gray', cursor: 'pointer', '&:hover': { filter: 'brightness(70%)' } }} />
      </Tooltip>

    </div>
  );
}

export default MainSequenceCheckBox;
