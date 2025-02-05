import React, { useState } from 'react';
import { useDispatch, useStore } from 'react-redux';
import Tooltip from '@mui/material/Tooltip';
import DeleteIcon from '@mui/icons-material/Delete';
import { cloningActions } from '../../store/cloning';
import './SourceBox.css';
import VerifyDeleteDialog from './VerifyDeleteDialog';
import useStoreEditor from '../../hooks/useStoreEditor';

function sourceHasDownstreamChildren(sources, sourceId) {
  const currentSource = sources.find((source) => source.id === sourceId);
  if (!currentSource.output) {
    return false;
  }
  return sources.find((source) => source.input.includes(currentSource.output)) !== undefined;
}

const { deleteSourceAndItsChildren, setMainSequenceId } = cloningActions;

function SourceBox({ children, sourceId }) {
  const dispatch = useDispatch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const store = useStore();
  const { updateStoreEditor } = useStoreEditor();

  const tooltipText = <div className="tooltip-text">Delete source and children</div>;

  const deleteSource = () => {
    const { mainSequenceId, sources } = store.getState().cloning;
    const source = sources.find((s) => s.id === sourceId);
    dispatch(deleteSourceAndItsChildren(sourceId));
    if (mainSequenceId && mainSequenceId === source.output) {
      updateStoreEditor('mainEditor', null);
      dispatch(setMainSequenceId(null));
    }
  };
  const onClickDeleteSource = () => {
    const state = store.getState().cloning;
    if (sourceHasDownstreamChildren(state.sources, sourceId)) {
      setDialogOpen(true);
    } else {
      deleteSource();
    }
  };
  return (
    <div className="select-source">
      <div className="icon-corner">
        <Tooltip title={tooltipText} arrow placement="top">
          <button type="submit" onClick={onClickDeleteSource}>
            <DeleteIcon sx={{ fontSize: '2em' }} />
          </button>
        </Tooltip>
      </div>
      <VerifyDeleteDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        onClickDelete={() => {
          deleteSource();
          setDialogOpen(false);
        }}
      />
      {children}
    </div>
  );
}

export default React.memo(SourceBox);
