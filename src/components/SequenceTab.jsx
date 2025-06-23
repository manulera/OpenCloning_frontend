import React from 'react';
import MainSequenceEditor from './MainSequenceEditor';
import PrimerDesigner from './primers/primer_design/SequenceTabComponents/PrimerDesigner';
import CreatePrimerDialog from './primers/CreatePrimerDialog';

function SequenceTab() {
  const [primerSequence, setPrimerSequence] = React.useState('');
  const [position, setPosition] = React.useState(null);
  const onCreatePrimer = ({ sequence, position: newPos }) => {
    setPrimerSequence(sequence);
    setPosition(newPos);
  };
  return (
    <>
      <PrimerDesigner />
      <MainSequenceEditor onCreatePrimer={onCreatePrimer} />
      {position && <CreatePrimerDialog {...{ primerSequence, setPrimerSequence, position, setPosition }} />}
    </>
  );
}

export default SequenceTab;
