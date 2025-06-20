import { useStore } from 'react-redux';
import { updateEditor, addAlignment } from '@teselagen/ove';
import { getPCRPrimers, getPrimerLinks } from '../store/cloning_utils';
import { getTeselaJsonFromBase64 } from '../utils/readNwrite';
import { syncChromatogramDataWithAlignment } from '../utils/sequenceManipulation';

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
        const aTracks = [
          {
            sequenceData,
            alignmentData: {
              // the alignmentData just needs the sequence < TODO this has to be changed to be the largest ---
              sequence: alignmentFiles[0].alignment[0],
            },
          },
          ...await Promise.all(alignmentFiles.map(async (aln) => {
            let { chromatogramData } = await getTeselaJsonFromBase64(sessionStorage.getItem(`verification-${id}-${aln.file_name}`), aln.file_name);
            if (chromatogramData) {
              chromatogramData = syncChromatogramDataWithAlignment(chromatogramData, aln.alignment[1]);
            }
            return {
              sequenceData: {
                name: aln.file_name,
                sequence: aln.alignment[1].replaceAll('-', ''),
              },
              alignmentData: {
                sequence: aln.alignment[1],
              },
              chromatogramData,
            };
          })),
        ];
        console.log('aTracks', aTracks);
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
              let { chromatogramData } = await getTeselaJsonFromBase64(sessionStorage.getItem(`verification-${id}-${aln.file_name}`), aln.file_name);
              if (chromatogramData) {
                chromatogramData = syncChromatogramDataWithAlignment(chromatogramData, aln.alignment[1]);
              }
              return {
                sequenceData: {
                  name: aln.file_name,
                  sequence: aln.alignment[1].replaceAll('-', ''),
                },
                alignmentData: {
                  sequence: aln.alignment[1],
                },
                chromatogramData,
              };
            })),
          ],
        });
        panelsShown = [[
          // ...panelsShown[0].filter((p) => p.id !== 'simpleAlignment'),
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
      updateEditor(store, editorName, { sequenceData: {}, selectionLayer: {}, panelsShown });
    }
  };

  return { updateStoreEditor };
}
