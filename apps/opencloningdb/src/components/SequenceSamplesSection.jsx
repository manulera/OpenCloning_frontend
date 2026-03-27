import React from 'react';
import { Typography, List, ListItem, ListItemText } from '@mui/material';
import { AddCircle as AddCircleIcon, SwapHoriz as SwapHorizIcon } from '@mui/icons-material';
import DetailPageSection from './DetailPageSection';
import DetailPageSectionAction from './DetailPageSectionAction';
import CreateSampleDialog from './CreateSampleDialog';
import TransferSampleDialog from './TransferSampleDialog';

function SequenceSamplesSectionActions({ onCreateOpen, onTransferOpen }) {
  return (
    <>
      
    </>
  );
}

function SequenceSamplesSection({ sequenceId, sampleUids }) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [transferOpen, setTransferOpen] = React.useState(false);

  return (
    <>
      <DetailPageSection
        title="Sequence samples"
        actions={
          <>
            <DetailPageSectionAction icon={<AddCircleIcon />} onClick={() => setCreateOpen(true)} title="Create new UIDs" />
            <DetailPageSectionAction icon={<SwapHorizIcon />} onClick={() => setTransferOpen(true)} title="Transfer UID" />
          </>
        }
      >
        {sampleUids.length > 0 ? (
          <List sx={{ margin: 0, paddingLeft: 2 }}>
            {sampleUids.map((uid) => (
              <ListItem key={uid} disableGutters sx={{ pl: 0 }}>
                <ListItemText primary={uid} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography color="text.secondary">
            No UIDs linked
          </Typography>
        )}
      </DetailPageSection>
      <CreateSampleDialog sequenceId={sequenceId} open={createOpen} onClose={() => setCreateOpen(false)} />
      <TransferSampleDialog sequenceId={sequenceId} open={transferOpen} onClose={() => setTransferOpen(false)} />
    </>
  );
}

export default SequenceSamplesSection;
