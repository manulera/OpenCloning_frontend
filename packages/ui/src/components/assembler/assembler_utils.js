import { getComplementSequenceString, getAminoAcidFromSequenceTriplet, getDigestFragmentsForRestrictionEnzymes, getReverseComplementSequenceString } from '@teselagen/sequence-utils';
import { openCycleAtNode, partsToEdgesGraph } from './graph_utils';
import { allSimplePaths } from 'graphology-simple-path';

function tripletsToTranslation(triplets) {
  if (!triplets) return ''
  return triplets.map(triplet =>
    /[^ACGT]/i.test(triplet) ? ' - ' :
      getAminoAcidFromSequenceTriplet(triplet).threeLettersName.replace('Stop', '***')
  ).join('')
}

export function partDataToDisplayData(data) {
  const {
    left_codon_start: leftCodonStart,
    right_codon_start: rightCodonStart,
    left_overhang: leftOverhang,
    right_overhang: rightOverhang,
    left_inside: leftInside,
    right_inside: rightInside,
    glyph
  } = data
  const leftOverhangRc = getComplementSequenceString(leftOverhang)
  const rightOverhangRc = getComplementSequenceString(rightOverhang)
  const leftInsideRc = getComplementSequenceString(leftInside)
  const rightInsideRc = getComplementSequenceString(rightInside)
  let leftTranslationOverhang = ''
  let leftTranslationInside = ''
  if (leftCodonStart) {
    const triplets = (leftOverhang + leftInside).slice(leftCodonStart - 1).match(/.{3}/g)
    const padding = ' '.repeat(leftCodonStart - 1)
    const translationLeft = padding + tripletsToTranslation(triplets)
    leftTranslationOverhang = translationLeft.slice(0, leftOverhang.length)
    leftTranslationInside = translationLeft.slice(leftOverhang.length)
  }
  let rightTranslationOverhang = ''
  let rightTranslationInside = ''
  if (rightCodonStart) {
    const triplets = (rightInside + rightOverhang).slice(rightCodonStart - 1).match(/.{3}/g)
    const padding = ' '.repeat(rightCodonStart - 1)
    const translationRight = padding + tripletsToTranslation(triplets)
    rightTranslationInside = translationRight.slice(0, rightInside.length)
    rightTranslationOverhang = translationRight.slice(rightInside.length)
  }
  return {
    leftTranslationOverhang,
    leftTranslationInside,
    rightTranslationOverhang,
    rightTranslationInside,
    leftOverhangRc,
    rightOverhangRc,
    leftInsideRc,
    rightInsideRc,
  }
}


export function simplifyDigestFragment({cut1, cut2}) {
  return {
    left: {ovhg: cut1.overhangBps.toUpperCase(), forward: cut1.forward},
    right: {ovhg: cut2.overhangBps.toUpperCase(), forward: cut2.forward},
  };
};

export function reverseComplementSimplifiedDigestFragment({left, right}) {
  return {
    left: {ovhg: getReverseComplementSequenceString(right.ovhg), forward: !right.forward},
    right: {ovhg: getReverseComplementSequenceString(left.ovhg), forward: !left.forward},
  };
}

export function getSimplifiedDigestFragments(sequence, circular, enzymes) {
  const digestFragments = getDigestFragmentsForRestrictionEnzymes(
    sequence,
    circular,
    enzymes,
  );
  const simplifiedDigestFragments = digestFragments.map(simplifyDigestFragment);
  const simplifiedDigestFragmentsRc = simplifiedDigestFragments.map(reverseComplementSimplifiedDigestFragment);
  return simplifiedDigestFragments.concat(simplifiedDigestFragmentsRc);
}

export function assignSequenceToSyntaxPart(sequence, circular, enzymes, parts) {
  const simplifiedDigestFragments = getSimplifiedDigestFragments(sequence, circular, enzymes);
  const graph = partsToEdgesGraph(parts)
  openCycleAtNode(graph, parts[0].left_overhang);
  const foundParts = [];
  simplifiedDigestFragments
    .filter(f => f.left.forward && !f.right.forward && graph.hasNode(f.left.ovhg) && graph.hasNode(f.right.ovhg))
    .forEach(fragment => {
      const paths = allSimplePaths(graph, fragment.left.ovhg, fragment.right.ovhg);
      if (paths.length > 0) {
        foundParts.push({left_overhang: fragment.left.ovhg, right_overhang: fragment.right.ovhg});
      }
    });
  return foundParts;
}
