import { getComplementSequenceString, getAminoAcidFromSequenceTriplet } from '@teselagen/sequence-utils';

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

