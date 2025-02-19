import { useStore } from 'react-redux';
import { updateEditor, addAlignment } from '@teselagen/ove';
import { getPCRPrimers, getPrimerLinks } from '../store/cloning_utils';
import { getTeselaJsonFromBase64 } from '../utils/readNwrite';

function reverseComplementArray(arr) {
  return arr.slice().reverse();
}

export function reverseComplementChromatogramData(chromatogramDataIn) {
  const chromatogramData = { ...chromatogramDataIn };
  const complement = { A: 'T', T: 'A', G: 'C', C: 'G', N: 'N' };
  function reverseComplementSequence(seq) {
    return seq
      .map((base) => complement[base] || base).reverse();
  }

  chromatogramData.aTrace = reverseComplementArray(chromatogramData.aTrace);
  chromatogramData.tTrace = reverseComplementArray(chromatogramData.tTrace);
  chromatogramData.gTrace = reverseComplementArray(chromatogramData.gTrace);
  chromatogramData.cTrace = reverseComplementArray(chromatogramData.cTrace);
  chromatogramData.basePos = reverseComplementArray(chromatogramData.basePos);
  chromatogramData.baseCalls = reverseComplementSequence(
    chromatogramData.baseCalls,
  );

  chromatogramData.baseTraces = reverseComplementArray(
    chromatogramData.baseTraces,
  ).map((traceObj) => ({
    aTrace: reverseComplementArray(traceObj.aTrace),
    tTrace: reverseComplementArray(traceObj.tTrace),
    gTrace: reverseComplementArray(traceObj.gTrace),
    cTrace: reverseComplementArray(traceObj.cTrace),
  }));

  return chromatogramData;
}

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
      const entity = cloning.entities.find((e) => e.id === id);
      const entityWithoutSequencing = { ...entity };
      delete entityWithoutSequencing.sequencing;
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
              const { chromatogramData } = await getTeselaJsonFromBase64(sessionStorage.getItem(`verification-${id}-${aln.file_name}`), aln.file_name);
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
