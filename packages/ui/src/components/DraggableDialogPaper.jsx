import { Paper } from '@mui/material';
import React from 'react';
import Draggable from 'react-draggable';

function DraggableDialogPaper(props) {
  return (
    <Draggable
      handle="#draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
}

export default DraggableDialogPaper;
