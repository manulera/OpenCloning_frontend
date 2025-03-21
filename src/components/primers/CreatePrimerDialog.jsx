import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material';
import React from 'react';
import { shallowEqual, useDispatch, useSelector, useStore } from 'react-redux';
import { updateEditor } from '@teselagen/ove';
import { expandOrContractRangeByLength } from '@teselagen/range-utils';
import { cloningActions } from '../../store/cloning';
import useStoreEditor from '../../hooks/useStoreEditor';
import CreatePrimerFromSequenceForm from './CreatePrimerFromSequenceForm';
import DraggableDialogPaper from '../DraggableDialogPaper';
import './CreatePrimerDialog.css';

function CreatePrimerDialog({ primerSequence, setPrimerSequence, position, setPosition }) {
  const [name, setName] = React.useState('');
  const store = useStore();
  const existingPrimerNames = useSelector((state) => state.cloning.primers.map((p) => p.name), shallowEqual);
  const sequenceData = useSelector((state) => state.cloning.teselaJsonCache[state.cloning.mainSequenceId]);
  const { addPrimerAndLinkToSequence } = cloningActions;
  const { updateStoreEditor } = useStoreEditor();
  const dispatch = useDispatch();
  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(addPrimerAndLinkToSequence({ primer: { name, sequence: primerSequence }, sequenceId: sequenceData.id, position }));
    setPrimerSequence('');
    setPosition(null);
    setName('');
    updateStoreEditor('mainEditor', sequenceData.id);
  };
  const clearDummyPrimer = () => {
    const editorState = store.getState().VectorEditor.mainEditor;
    delete editorState.sequenceData.primers.opencloningDummyPrimer;
    updateEditor(store, 'mainEditor', editorState);
  };

  React.useEffect(() => {
    if (primerSequence && position) {
      const editorState = store.getState().VectorEditor.mainEditor;
      const forward = position.strand === 1;
      const endPos = forward ? { start: position.end, end: position.end } : { start: position.start, end: position.start };
      const primerPosition = expandOrContractRangeByLength(endPos, primerSequence.length - 1, forward, sequenceData.sequence.length);
      // If the 5' of the primer extends beyond the start of the sequence in a linear sequence, we need to adjust the position
      const bases = primerSequence;
      if (!sequenceData.circular && primerPosition.start > primerPosition.end) {
        primerPosition.start = 0;
      }

      editorState.caretPosition = primerPosition.end + 1;
      editorState.selectionLayer = { start: -1, end: -1 };

      const dummyPrimer = {
        id: 'opencloningDummyPrimer',
        name,
        ...primerPosition,
        type: 'primer_bind',
        primerBindsOn: '3prime',
        forward,
        bases,
      };
      editorState.sequenceData.primers.opencloningDummyPrimer = dummyPrimer;
      editorState.panelsShown[0].forEach((p) => {
        if (p.id === 'sequence') {
          p.active = true;
        } else { p.active = false; }
      });
      updateEditor(store, 'mainEditor', editorState);
      // Scroll to the bottom of the screen
      window.scrollTo(0, document.body.scrollHeight);
    }
  }, [primerSequence, position]);

  return (
    <Dialog
      className="create-primer-dialog"
      aria-labelledby="draggable-dialog-title"
      open={primerSequence !== ''}
      onClose={() => { setPrimerSequence(''); setPosition(null); clearDummyPrimer(); }}
      PaperComponent={DraggableDialogPaper}
      slotProps={{ backdrop: { style: { backgroundColor: 'transparent' } } }}
    >
      <DialogTitle sx={{ textAlign: 'center', fontSize: 'x-large', cursor: 'move' }}> Create primer </DialogTitle>
      <DialogContent sx={{ minWidth: '600px' }}>
        <form onSubmit={onSubmit}>
          <CreatePrimerFromSequenceForm
            primer={{ name, sequence: primerSequence }}
            setName={setName}
            setSequence={setPrimerSequence}
            existingPrimerNames={existingPrimerNames}
          />
          <div style={{ textAlign: 'center' }}>
            {name && !existingPrimerNames.includes(name) && (
            <Button variant="contained" type="submit">Save primer</Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreatePrimerDialog;
