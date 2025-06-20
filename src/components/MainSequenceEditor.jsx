import React from 'react';
import { Editor, updateEditor } from '@teselagen/ove';
import { useDispatch, useStore } from 'react-redux';
import { getReverseComplementSequenceString, getSequenceDataBetweenRange } from '@teselagen/sequence-utils';
import defaultMainEditorProps from '../config/defaultMainEditorProps';
import { cloningActions } from '../store/cloning';

function MainSequenceEditor({ onCreatePrimer }) {
  const dispatch = useDispatch();
  const store = useStore();
  const { setMainSequenceSelection } = cloningActions;
  const editorName = 'mainEditor';
  const extraProp = {
    onSelectionOrCaretChanged: (a) => dispatch(setMainSequenceSelection(a)),
    selectionLayer: {},
    sequenceData: {},
    rightClickOverrides: {
      selectionLayerRightClicked: (items, { annotation }, props) => {
        const items2keep = items.filter((i) => i.text === 'Copy');
        const { start, end } = annotation;
        return [
          ...items2keep,
          {
            text: 'Create',
            submenu: [
              {
                text: 'Primer from selection',
                onClick: () => {
                  onCreatePrimer({
                    sequence: getSequenceDataBetweenRange(props.sequenceData, annotation).sequence,
                    position: { start, end, strand: 1 },
                  });
                },
              },
              {
                text: 'Primer from reverse complement',
                onClick: () => onCreatePrimer({
                  sequence: getReverseComplementSequenceString(getSequenceDataBetweenRange(props.sequenceData, annotation).sequence),
                  position: { start, end, strand: -1 },
                }),

              },
            ],
          },
        ];
      },
    },
  };

  React.useEffect(() => {
    updateEditor(store, editorName, { ...defaultMainEditorProps, ...extraProp });
  }, []);

  return (
    <div style={{ textAlign: 'left' }}>
      <Editor {...{ editorName, ...defaultMainEditorProps, ...extraProp, height: '800' }} />
    </div>
  );
}
export default React.memo(MainSequenceEditor);
