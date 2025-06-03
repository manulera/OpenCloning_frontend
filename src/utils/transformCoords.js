import { parseFeatureLocation } from '@teselagen/bio-parsers';
import { flipContainedRange, getRangeLength, isRangeWithinRange, translateRange } from '@teselagen/range-utils';
import { isEqual } from 'lodash-es';

export default function getTransformCoords({ assembly, type: sourceType }, parentSequenceData, productLength) {
  if (!assembly) {
    return () => null;
  }

  const fragments = sourceType !== 'PCRSource' ? structuredClone(assembly) : [structuredClone(assembly[1])];

  let count = 0;
  if (sourceType === 'PCRSource') {
    // Primer is linear sequence, so no need to pass location
    const fwdPrimerAnnealingPart = parseFeatureLocation(assembly[0].right_location, 0, 0, 0, 1, null)[0];
    count = fwdPrimerAnnealingPart.start;
  }

  fragments.forEach((f) => {
    const sequence = parentSequenceData.find((e) => e.id === f.sequence);
    const { size } = sequence;
    const { left_location: left, right_location: right } = f;
    const leftLocation = left ? parseFeatureLocation(left, 0, 0, 0, 1, size)[0] : null;
    const rightLocation = right ? parseFeatureLocation(right, 0, 0, 0, 1, size)[0] : null;
    const leftStart = leftLocation?.start || 0;
    const rightStart = rightLocation?.start || 0;
    const rightEnd = rightLocation?.end || size;

    // Handle special case for circular sequences with left_location and right_location being identical (insertion)
    let rangeLength = isEqual(leftLocation, rightLocation) ? size : getRangeLength({ start: leftStart, end: rightEnd }, size);
    // Handle special case for circular sequences are excised
    if (rangeLength > productLength) {
      rangeLength = productLength;
    }
    f.rangeInAssembly = translateRange({ start: 0, end: rangeLength - 1 }, count, productLength);
    f.size = size;
    count += getRangeLength({ start: leftStart, end: rightStart - 1 }, size);
  });
  const rangeInParent = (selection, id) => {
    if (selection.start === -1) {
      return null;
    }

    // In insertion assemblies, more than one fragment has the same id,
    // so we filter instead of find
    const possibleOut = fragments.filter((f) => f.sequence === id).map((fragment) => {
      const { rangeInAssembly, left_location: left, reverse_complemented, size } = fragment;
      const leftLocation = left ? parseFeatureLocation(left, 0, 0, 0, 1, size)[0] : null;
      const startInParent = leftLocation?.start || 0;
      if (isRangeWithinRange(selection, rangeInAssembly, productLength)) {
        const selectionShifted = selection.start <= selection.end ? selection : { start: selection.start, end: selection.end + productLength };
        const outRange = translateRange(selectionShifted, -rangeInAssembly.start + startInParent, size);
        if (reverse_complemented) {
          return flipContainedRange(outRange, { start: 0, end: size - 1 }, size);
        }
        return outRange;
      }
      return null;
    });
    return possibleOut.find((out) => out !== null) || null;
  };
  return rangeInParent;
}
