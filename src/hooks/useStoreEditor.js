import { useStore } from 'react-redux';
import { updateEditor, addAlignment } from '@teselagen/ove';
import { getPCRPrimers, getPrimerLinks } from '../store/cloning_utils';
import { getTeselaJsonFromBase64 } from '../utils/readNwrite';
import { findRotation, syncChromatogramDataWithAlignment } from '../utils/sequenceManipulation';
import { getReverseComplementSequenceAndAnnotations, getReverseComplementSequenceString, rotateSequenceDataToPosition } from '@teselagen/sequence-utils';

export default function useStoreEditor() {
  const store = useStore();

  const updateStoreEditor = async (editorName, id, selectionLayer = {}) => {
    if (id === null) {
      // if id is null and selectionLayer is empty, clear the sequenceData
      if (Object.keys(selectionLayer).length === 0) {
        updateEditor(store, editorName, { sequenceData: {}, selectionLayer });
      } else {
        updateEditor(store, editorName, { selectionLayer });
      }
    } else {
      // otherwise, update the sequenceData with the new id
      const { cloning } = store.getState();
      const { teselaJsonCache } = cloning;
      const sequenceData = { ...teselaJsonCache[id] };
      const sequence = cloning.sequences.find((e) => e.id === id);
      const sequenceWithoutSequencingField = { ...sequence };
      delete sequenceWithoutSequencingField.sequencing;
      const linkedPrimers = getPrimerLinks(cloning, id);
      const pcrPrimers = getPCRPrimers(cloning, id);
      const alignmentFiles = cloning.files.filter((e) => e.sequence_id === id && e.file_type === 'Sequencing file');
      let { panelsShown } = store.getState().VectorEditor.mainEditor;
      if (alignmentFiles.length > 0) {
        addAlignment(store, {
          id: 'simpleAlignment',
          alignmentType: 'Sequencing alignment',
          name: `Seq. ${id}`,
          // set the visibilities of the annotations you'd like to see
          alignmentAnnotationVisibility: {
            features: true,
            parts: true,
            translations: true,
          },
          alignmentTracks: [
            {
              sequenceData,
              alignmentData: {
                // the alignmentData just needs the sequence < TODO this has to be changed to be the largest ---
                sequence: alignmentFiles[0].alignment[0],
              },
            },
            ...await Promise.all(alignmentFiles.map(async (aln) => {
              const fileContent = await getTeselaJsonFromBase64(sessionStorage.getItem(`verification-${id}-${aln.file_name}`), aln.file_name);
              let chromatogramData = fileContent.chromatogramData;
              let alignmentSequenceData = {
                name: aln.file_name,
                sequence: aln.alignment[1].replaceAll('-', ''),
              };
              if (chromatogramData) {
                chromatogramData = syncChromatogramDataWithAlignment(chromatogramData, aln.alignment[1]);
              }
              if (fileContent.features && fileContent.features.length > 0) {
                alignmentSequenceData = fileContent;
                let rotation = findRotation(fileContent.sequence, aln.alignment[1]);
                // If the rotation is -1, it may be reverse complemented
                const reverseComplemented = rotation === -1;;
                if (reverseComplemented) {
                  rotation = findRotation(fileContent.sequence, getReverseComplementSequenceString(aln.alignment[1]));
                  alignmentSequenceData = getReverseComplementSequenceAndAnnotations(fileContent);
                  rotateSequenceDataToPosition(alignmentSequenceData, rotation);
                }
                if (rotation !== -1 && rotation !== 0) {
                  rotation = reverseComplemented ? fileContent.sequence.length - rotation : rotation;
                  alignmentSequenceData = rotateSequenceDataToPosition(alignmentSequenceData, rotation);
                }
              }
              return {
                sequenceData: alignmentSequenceData,
                alignmentData: {
                  sequence: aln.alignment[1],
                },
                chromatogramData,
              };
            })),
          ],
        });
        panelsShown = [[
          ...panelsShown[0].filter((p) => p.id !== 'simpleAlignment'),
          {
            id: 'simpleAlignment',
            type: 'alignment',
            name: 'Alignments',
            active: true,
            isFullscreen: false,
          },
        ]];
      }
      linkedPrimers.forEach((p) => { p.color = 'lightblue'; });
      sequenceData.primers = sequenceData.primers.concat([...linkedPrimers, ...pcrPrimers]);
      updateEditor(store, editorName, { sequenceData, selectionLayer, panelsShown });
    }
  };

  return { updateStoreEditor };
}
