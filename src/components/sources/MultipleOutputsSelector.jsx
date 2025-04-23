import { SimpleCircularOrLinearView } from '@teselagen/ove';
import React from 'react';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { Button, IconButton } from '@mui/material';
import { convertToTeselaJson } from '../../utils/readNwrite';
import OverhangsDisplay from '../OverhangsDisplay';
import SubSequenceDisplayer from './SubSequenceDisplayer';
import AssemblyPlanDisplayer from './AssemblyPlanDisplayer';

function MultipleOutputsSelector({ sources, sequences, sourceId, onFragmentChosen }) {
  // If the output is already set or the list of outputs is empty, do not show this element
  if (sources.length === 0) { return null; }

  // selectedOutput is a local property, until you commit the step by clicking
  const [selectedOutput, setSelectedOutput] = React.useState(0);

  // Functions called to move between outputs of a restriction reaction
  const incrementSelectedOutput = () => setSelectedOutput(
    (selectedOutput + 1) % sources.length,
  );
  const decreaseSelectedOutput = () => setSelectedOutput((selectedOutput !== 0) ? (selectedOutput - 1) : sources.length - 1);

  // The function to pick the fragment as the output, and execute the step
  const chooseFragment = (e) => {
    e.preventDefault();
    onFragmentChosen(selectedOutput);
  };

  const editorName = `source_editor_${sourceId}`;

  const seq = convertToTeselaJson(sequences[selectedOutput]);

  return (
    <div className="multiple-output-selector">
      <div className="multiple-output-selector-navigate">
        <IconButton onClick={decreaseSelectedOutput} type="button" sx={{ height: 'fit-content' }}>
          <ArrowBack />
        </IconButton>
        {selectedOutput + 1}
        {' '}
        /
        {' '}
        {sources.length}
        <IconButton onClick={incrementSelectedOutput} type="button" sx={{ height: 'fit-content' }}>
          <ArrowForward />
        </IconButton>
      </div>

      <div className="fragment-picker">
        <SubSequenceDisplayer {...{ source: sources[selectedOutput], sourceId }} />
        <AssemblyPlanDisplayer {...{ source: sources[selectedOutput] }} />
        <SimpleCircularOrLinearView {...{ sequenceData: seq, editorName, height: 'auto' }} />
        <OverhangsDisplay {...{ sequenceData: seq, sequence: sequences[selectedOutput] }} />
      </div>
      <form onSubmit={chooseFragment}>
        <Button fullWidth type="submit" variant="contained">Choose product</Button>
      </form>
    </div>
  );
}

export default React.memo(MultipleOutputsSelector);
