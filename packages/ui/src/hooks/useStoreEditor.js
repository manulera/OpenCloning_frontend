import { useStore } from 'react-redux';
import { updateEditor, addAlignment } from '@teselagen/ove';
import { getPCRPrimers } from '@opencloning/store/cloning_utils';
import { getTeselaJsonFromBase64 } from '@opencloning/utils/readNwrite';
import { findRotation, syncChromatogramDataWithAlignment } from '@opencloning/utils/sequenceManipulation';
import { getReverseComplementSequenceAndAnnotations, getReverseComplementSequenceString, rotateSequenceDataToPosition } from '@teselagen/sequence-utils';

export default function useStoreEditor() {
  const store = useStore();

  const updateStoreEditor = async (editorName, id, selectionLayer = {}) => {
    if (id === null) {
      // if id is null and selectionLayer is empty, clear the sequenceData
      if (Object.keys(selectionLayer).length === 0) {
        updateEditor(store, editorName, { sequenceData: {}, selectionLayer, sequenceDataHistory: {} });
      } else {
        updateEditor(store, editorName, { selectionLayer, sequenceDataHistory: {} });
      }
    } else {
      // otherwise, update the sequenceData with the new id
      const { cloning } = store.getState();
      const { teselaJsonCache } = cloning;
      const sequenceData = { ...teselaJsonCache[id] };
      const sequence = cloning.sequences.find((e) => e.id === id);
      const sequenceWithoutSequencingField = { ...sequence };
      delete sequenceWithoutSequencingField.sequencing;
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
                name: sequenceData.name
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
                const alignmentSequence = aln.alignment[1].replaceAll('-', '');
                let rotation = findRotation(fileContent.sequence, alignmentSequence);
                // If the rotation is -1, it may be reverse complemented
                const reverseComplemented = rotation === -1;
                if (reverseComplemented) {
                  rotation = findRotation(fileContent.sequence, getReverseComplementSequenceString(alignmentSequence));
                  alignmentSequenceData = getReverseComplementSequenceAndAnnotations(fileContent);
                }
                if (rotation !== -1 && rotation !== 0) {
                  rotation = reverseComplemented ? fileContent.sequence.length - rotation : rotation;
                  alignmentSequenceData = rotateSequenceDataToPosition(alignmentSequenceData, rotation);
                }
              }
              return {
                sequenceData: {...alignmentSequenceData, name: aln.file_name},
                alignmentData: {
                  sequence: aln.alignment[1],
                  name: aln.file_name
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
      sequenceData.primers = sequenceData.primers.concat([...pcrPrimers]);
      updateEditor(store, editorName, { sequenceData, selectionLayer, panelsShown, sequenceDataHistory: {} });
    }
  };

  return { updateStoreEditor };
}
