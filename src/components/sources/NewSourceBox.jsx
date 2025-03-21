import React from 'react';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Tooltip from '@mui/material/Tooltip';
import { useDispatch } from 'react-redux';
import { IconButton } from '@mui/material';
import { cloningActions } from '../../store/cloning';

// A component that is rendered on the side of the tree to add a new source
function NewSourceBox({ inputSequencesIds = [] }) {
  const dispatch = useDispatch();
  const { addEmptySource } = cloningActions;
  const onClick = () => {
    dispatch(addEmptySource(inputSequencesIds));
    setTimeout(() => {
      const tabPanelsContainer = document.querySelector('.tab-panels-container');
      if (tabPanelsContainer) {
        tabPanelsContainer.scrollTo({
          left: tabPanelsContainer.scrollWidth,
          behavior: 'instant',
        });
      }
    }, 100);
  };
  const tooltipText = <div className="tooltip-text">Add source</div>;
  return (
    <IconButton type="submit" sx={{ height: 'fit-content' }} onClick={onClick}>
      <Tooltip title={tooltipText} arrow placement="bottom">
        <AddCircleIcon sx={{ fontSize: '1.8em' }} className="node-corner-icon" color="success" />
      </Tooltip>
    </IconButton>
  );
}

export default NewSourceBox;
