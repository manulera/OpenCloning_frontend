import React from 'react';
import { Editor, updateEditor } from '@teselagen/ove';
import { useDispatch, useStore } from 'react-redux';
import { getReverseComplementSequenceString, getSequenceDataBetweenRange } from '@teselagen/sequence-utils';
import defaultMainEditorProps from '../config/defaultMainEditorProps';
import { cloningActions } from '../store/cloning';
import useAlerts from '../hooks/useAlerts';
import { Alert, Button } from '@mui/material';
import { useSelector } from 'react-redux';
import useUpdateAnnotationInMainSequence from './annotation/useUpdateAnnotationInMainSequence';
import { isEqual } from 'lodash-es';
import useStoreEditor from '../hooks/useStoreEditor';

const { setMainSequenceSelection, addPrimer } = cloningActions;

function MainSequenceEditor() {
  const dispatch = useDispatch();
  const { addAlert } = useAlerts();
  const { updateStoreEditor } = useStoreEditor();
  const updateAnnotationInMainSequence = useUpdateAnnotationInMainSequence();
  const mainSequenceFeatures = useSelector((state) => state.VectorEditor.mainEditor?.sequenceData?.features, isEqual);
  const mainSequencePrimers = useSelector((state) => state.VectorEditor.mainEditor?.sequenceData?.primers, isEqual);

  const annotationChanged = useSelector(
    (state) => {
      const history = state.VectorEditor.mainEditor?.sequenceDataHistory;
      if (!history) return false;
      console.log('history', history);
      return Object.keys(history).length > 0 && history.future.length === 0;
    }
  );
  console.log('annotationChanged', annotationChanged);
  const store = useStore();
  const editorName = 'mainEditor';
  const [annotated, setAnnotated] = React.useState(false);
  const mainSequenceId = useSelector((state) => state.cloning.mainSequenceId);
  const topDivRef = React.useRef(null);

  React.useEffect(() => {
    setAnnotated(true);
    setTimeout(() => {
      topDivRef.current.scrollIntoView({ behavior: 'smooth' });
    }, 250);
  }, [mainSequenceFeatures, mainSequencePrimers]);


  React.useEffect(() => {
    setAnnotated(false);
  }, [mainSequenceId]);

  const onAnnotationChange = () => {
    updateAnnotationInMainSequence();
    setAnnotated(false);
  };

  const onAnnotationCancel = () => {
    const currentSequenceData = store.getState().VectorEditor.mainEditor.sequenceData;
    updateStoreEditor('mainEditor', mainSequenceId, { sequenceData: currentSequenceData });
    setAnnotated(false);
  };


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
        addAlert({
          message: `Primer "${annotation.name}" created`,
          severity: 'success',
        });
      } else if (annotationTypePlural !== 'features') {
        return false;
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
    <div style={{ textAlign: 'left' }} ref={topDivRef}>
      <div>annotationChanged: {annotationChanged ? 'true' : 'false'}</div>
      {annotated && 
      <Alert
        style={{maxWidth: '500px', margin: '10px auto'}}
        severity="info"
        action={
          <>
            <Button color="primary" onClick={onAnnotationChange}>
              Save
            </Button>
            <Button color="secondary" onClick={onAnnotationCancel}>
              Cancel
            </Button>
          </>
        }
      >
        <strong>Annotation Changed</strong>
      </Alert>
      }
      <Editor {...{ editorName, ...defaultMainEditorProps, ...extraProp, height: '800' }} />
    </div>
  );
}
export default React.memo(MainSequenceEditor);
