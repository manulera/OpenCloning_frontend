import { getReverseComplementSequenceAndAnnotations, getSequenceDataBetweenRange, insertSequenceDataAtPositionOrRange } from '@teselagen/sequence-utils';
import { fastaToJson } from '@teselagen/bio-parsers';

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
