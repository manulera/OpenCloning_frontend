import React from 'react';
import { Editor, updateEditor } from '@teselagen/ove';
import { useDispatch, useStore } from 'react-redux';
import { getReverseComplementSequenceString, getSequenceDataBetweenRange } from '@teselagen/sequence-utils';
import defaultMainEditorProps from '../config/defaultMainEditorProps';
import { cloningActions } from '../store/cloning';
import useAlerts from '../hooks/useAlerts';

const { setMainSequenceSelection, addPrimer } = cloningActions;

function MainSequenceEditor() {
  const dispatch = useDispatch();
  const { addAlert } = useAlerts();
  const store = useStore();
  const editorName = 'mainEditor';

  const extraProp = {
    beforeAnnotationCreate: ({ annotationTypePlural, annotation, props, isEdit }) =>  { //also works for edits (!)
      console.log('beforeAnnotationCreate', { annotationTypePlural, annotation, props, isEdit });

      if (annotationTypePlural === 'primers') {
        const existingPrimerNames = store.getState().cloning.primers.map((p) => p.name);
        if (existingPrimerNames.includes(annotation.name)) {
          addAlert({
            message: `A primer with name "${annotation.name}" already exists`,
            severity: 'error',
          });
          return false;
        }
        let { sequence } = getSequenceDataBetweenRange(props.sequenceData, annotation);
        if (annotation.strand === -1) {
          sequence = getReverseComplementSequenceString(sequence);
        }
        dispatch(addPrimer({
          name: annotation.name,
          sequence: sequence,
        }));
      }
    },
    onSelectionOrCaretChanged: (a) => dispatch(setMainSequenceSelection(a)),
    selectionLayer: {},
    sequenceData: {},
    rightClickOverrides: {
      selectionLayerRightClicked: (items, { annotation }, props) => {
        const items2keep = items.filter((i) => i.text === 'Copy');
        return [
          ...items2keep,
          {
            text: 'Create',
            submenu: [
              "newFeature",
              "newPrimer",
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
