import { getReverseComplementSequenceAndAnnotations, getReverseComplementSequenceString, getSequenceDataBetweenRange, insertSequenceDataAtPositionOrRange } from '@teselagen/sequence-utils';
import { convertBasePosTraceToPerBpTrace, fastaToJson } from '@teselagen/bio-parsers';

function getSpacerSequence(spacer, spacerFeatureName = 'spacer') {
  if (!spacer) {
    return null;
  }
  const spacerSequence = fastaToJson(spacer)[0].parsedSequence;
  // Add a feature spanning the length of the spacer
  spacerSequence.features = [{
    start: 0,
    end: spacer.length - 1,
    type: 'misc_feature',
    name: spacerFeatureName,
    strand: 1,
    forward: true,
  }];
  return spacerSequence;
}

export function joinSequencesIntoSingleSequence(sequences, locations, orientations, spacers, circularAssembly, spacerFeatureName = 'spacer') {
  // Turn the spacers into sequences by parsing them as FASTA with fastaToJson
  const spacerSequences = spacers.map((spacer) => getSpacerSequence(spacer, spacerFeatureName));
  // Intercalate the spacers into the sequences
  const sequences2join = [];
  const locations2join = [];
  const orientations2join = [];

  if (!circularAssembly) {
    const firstSpacer = spacerSequences.shift();
    if (firstSpacer) {
      sequences2join.push(firstSpacer);
      locations2join.push({ start: 0, end: firstSpacer.sequence.length - 1 });
      orientations2join.push('forward');
    }
  }

  for (let i = 0; i < sequences.length; i++) {
    sequences2join.push(sequences[i]);
    locations2join.push(locations[i]);
    orientations2join.push(orientations[i]);
    if (spacerSequences[i]) {
      sequences2join.push(spacerSequences[i]);
      locations2join.push({ start: 0, end: spacerSequences[i].sequence.length - 1 });
      orientations2join.push('forward');
    }
  }

  const fragments = sequences2join.map((sequence, index) => {
    const seq = getSequenceDataBetweenRange(sequence, locations2join[index]);
    if (orientations2join[index] === 'reverse') {
      return getReverseComplementSequenceAndAnnotations(seq);
    }
    return seq;
  });
  // Concatenate all fragments
  let outputSequence = fragments[0];
  for (let i = 1; i < fragments.length; i++) {
    outputSequence = insertSequenceDataAtPositionOrRange(fragments[i], outputSequence, outputSequence.sequence.length);
  }
  return outputSequence;
}

export function simulateHomologousRecombination(templateSequence, targetSequence, rois, invertFragment, spacers) {
  const [amplifyRangeSelection, insertionRangeSelection] = rois;

  const amplifyRange = amplifyRangeSelection.selectionLayer;

  const insertionRangeOrPosition = insertionRangeSelection.caretPosition === -1 ? insertionRangeSelection.selectionLayer : insertionRangeSelection.caretPosition;

  let templateFragment = getSequenceDataBetweenRange(templateSequence, amplifyRange);
  if (invertFragment) {
    templateFragment = getReverseComplementSequenceAndAnnotations(templateFragment);
  }

  const spacerSequences = spacers.map(getSpacerSequence);

  let templateWithSpacers = spacerSequences[0] || templateFragment;
  if (spacerSequences[0]) {
    templateWithSpacers = insertSequenceDataAtPositionOrRange(templateFragment, templateWithSpacers, templateWithSpacers.sequence.length);
  }
  if (spacerSequences[1]) {
    templateWithSpacers = insertSequenceDataAtPositionOrRange(spacerSequences[1], templateWithSpacers, templateWithSpacers.sequence.length);
  }

  return insertSequenceDataAtPositionOrRange(templateWithSpacers, targetSequence, insertionRangeOrPosition);
}

export function findRotation(str1, str2) {
  const query1 = str1.toUpperCase();
  const query2 = str2.toUpperCase();
  // Check if strings are identical
  if (query1 === query2) return 0;
  // Check if they're the same length
  if (query1.length !== query2.length) return -1;

  // Double the first string and search for the second string
  const doubled = query1 + query1;
  const rotation = doubled.indexOf(query2);
  return rotation === -1 ? -1 : rotation;
}

export function rotateChromatogramData(chromatogramData, rotation) {
if (rotation === 0) {
  return {...chromatogramData};
}
const {aTrace, baseCalls, basePos, baseTraces, cTrace, gTrace, qualNums, tTrace} = chromatogramData;
const rotateTrace = rotation * 4;
return {
  aTrace: [...aTrace.slice(rotateTrace), ...aTrace.slice(0, rotateTrace)],
  cTrace: [...cTrace.slice(rotateTrace), ...cTrace.slice(0, rotateTrace)],
  gTrace: [...gTrace.slice(rotateTrace), ...gTrace.slice(0, rotateTrace)],
  tTrace: [...tTrace.slice(rotateTrace), ...tTrace.slice(0, rotateTrace)],
  baseCalls: [...baseCalls.slice(rotation), ...baseCalls.slice(0, rotation)],
  basePos: [...basePos.slice(rotation), ...basePos.slice(0, rotation)],
  baseTraces: [...baseTraces.slice(rotation), ...baseTraces.slice(0, rotation)],
  qualNums: [...qualNums.slice(rotation), ...qualNums.slice(0, rotation)],
}};

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
  chromatogramData.qualNums = reverseComplementArray(chromatogramData.qualNums);

  return chromatogramData;
}

export function syncChromatogramDataWithAlignment(chromatogramData, alignmentString) {
  // If possible, syncs the chromatogram data with the alignment sequence, otherwise
  // returns the original chromatogram data

  const alignmentSequence = alignmentString.replaceAll('-', '');

  const originalChromatogramData = structuredClone(chromatogramData);
  let newChromatogramData = originalChromatogramData;
  const originalSequence = chromatogramData.baseCalls.join('');
  // Find the rotation of the alignment sequence relative to the original sequence
  let rotation = findRotation(originalSequence, alignmentSequence);
  // If the rotation is -1, it may be reverse complemented
  const reverseComplemented = rotation === -1;;
  if (reverseComplemented) {
    rotation = findRotation(originalSequence, getReverseComplementSequenceString(alignmentSequence));
    newChromatogramData = reverseComplementChromatogramData(newChromatogramData);
  }
  console.log('rotation', rotation, reverseComplemented);
  if (rotation !== -1) {
    rotation = reverseComplemented ? originalSequence.length - rotation : rotation;
    newChromatogramData = rotateChromatogramData(newChromatogramData, rotation);

    return newChromatogramData;
  }
  return originalChromatogramData;
}
