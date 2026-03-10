import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'react-redux';
import { Editor, updateEditor } from '@teselagen/ove';
import { Paper, IconButton } from '@mui/material';
import {FullscreenIcon, FullscreenExitIcon} from '@mui/icons-material';
import defaultMainEditorProps from '../config/defaultMainEditorProps';

const EDITOR_NAME = 'sequenceViewer';

const baseViewerProps = {
  ...defaultMainEditorProps,
  readOnly: true,
  selectionLayer: {},
  sequenceData: {},
  ToolBarProps: {
    toolList: ['downloadTool', 'findTool', 'visibilityTool'],
  },
};

function SequenceViewerContent({ sequenceData }) {
  const store = useStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  const viewerProps = {
    ...baseViewerProps,
    isFullscreen,
  };

  React.useEffect(() => {
    if (sequenceData && Object.keys(sequenceData).length > 0) {
      updateEditor(store, EDITOR_NAME, {
        ...baseViewerProps,
        isFullscreen,
        sequenceData,
      });
    }
  }, [sequenceData, store, isFullscreen]);

  if (!sequenceData || !sequenceData.sequence) {
    return null;
  }

  const fullscreenExitButton = isFullscreen && createPortal(
    <IconButton
      aria-label="Exit fullscreen"
      onClick={() => setIsFullscreen(false)}
      sx={{
        position: 'fixed',
        top: 8,
        right: 8,
        zIndex: 2147483647,
        bgcolor: 'background.paper',
        boxShadow: 3,
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <FullscreenExitIcon />
    </IconButton>,
    document.body,
  );

  return (
    <Paper sx={{ p: 1, overflow: 'auto', position: 'relative' }}>
      {!isFullscreen && (
        <IconButton
          aria-label="Fullscreen"
          onClick={() => setIsFullscreen(true)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <FullscreenIcon />
        </IconButton>
      )}
      {fullscreenExitButton}
      <Editor
        editorName={EDITOR_NAME}
        {...viewerProps}
        height="800"
      />
    </Paper>
  );
}

function SequenceViewer({ sequenceData }) {
  return <SequenceViewerContent sequenceData={sequenceData} />;
}

export default React.memo(SequenceViewer);
