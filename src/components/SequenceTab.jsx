import React from 'react';
import { useSelector } from 'react-redux';
import { Alert } from '@mui/material';
import MainSequenceEditor from './MainSequenceEditor';
import PrimerDesigner from './primers/primer_design/SequenceTabComponents/PrimerDesigner';
import CreatePrimerDialog from './primers/CreatePrimerDialog';

const knownIssue = (
  <Alert sx={{ mb: 2, marginX: 'auto', width: '50%' }} severity="warning" icon={false}>
    <p><strong>Known issues:</strong></p>

    <p>Chromatogram data from Sanger sequencing traces matching the bottom strand or spanning the origin is not correctly displayed.</p>
    <p>When displaying too many Sanger sequencing traces, you cannot scroll down to see all of them. Try hiding the chromatogram lane.</p>
    <p>Peaks in Plasmidsaurus ab1 files are not aligned with the sequence.</p>

  </Alert>
);

function SequenceTab() {
  const [primerSequence, setPrimerSequence] = React.useState('');
  const [position, setPosition] = React.useState(null);
  const hasAlignment = useSelector((state) => {
    const { mainSequenceId } = state.cloning;
    if (!mainSequenceId) return false;
    return state.cloning.files.some((f) => f.sequence_id === mainSequenceId && f.alignment !== undefined);
  });
  const onCreatePrimer = ({ sequence, position: newPos }) => {
    setPrimerSequence(sequence);
    setPosition(newPos);
  };
  return (
    <>
      <PrimerDesigner />
      {hasAlignment && knownIssue}
      <MainSequenceEditor onCreatePrimer={onCreatePrimer} />
      {position && <CreatePrimerDialog {...{ primerSequence, setPrimerSequence, position, setPosition }} />}
    </>
  );
}

export default SequenceTab;
