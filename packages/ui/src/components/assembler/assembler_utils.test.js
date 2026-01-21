import { aliasedEnzymesByName, getDigestFragmentsForRestrictionEnzymes, getReverseComplementSequenceString } from "@teselagen/sequence-utils";
import { assignSequenceToSyntaxPart, simplifyDigestFragment, reverseComplementSimplifiedDigestFragment } from "./assembler_utils";


const sequenceBsaI  = 'tgggtctcaTACTagagtcacacaggactactaAATGagagacctac';
const sequenceBsaI2 = 'tgggtctcaAATGagagtcacacaggactactaAGGTagagacctac'
const sequenceBsaI3  = 'tgggtctcaTACTagagtcacacaggactactaAGGTagagacctac';

describe('reverseComplementSimplifiedDigestFragment', () => {
  it('works', () => {

    const digestFragments = getDigestFragmentsForRestrictionEnzymes(
      sequenceBsaI,
      true,
      aliasedEnzymesByName["bsai"],
    );
    const sequenceRc = getReverseComplementSequenceString(sequenceBsaI);
    const digestFragments2 = getDigestFragmentsForRestrictionEnzymes(
      sequenceRc,
      true,
      aliasedEnzymesByName["bsai"],
    );

    const simplifiedDigestFragments1 = digestFragments.map(simplifyDigestFragment);
    const simplifiedDigestFragments2 = digestFragments2.map(simplifyDigestFragment);
    const simplifiedDigestFragments3 = simplifiedDigestFragments2.map(reverseComplementSimplifiedDigestFragment);
    expect(simplifiedDigestFragments1).toEqual(simplifiedDigestFragments3);
  });
});


describe('assignSequenceToSyntaxPart', () => {
  it('works', () => {
    const enzymes = [aliasedEnzymesByName["bsai"]];
    const parts = [{left_overhang: 'TACT', right_overhang: 'AATG'}, {left_overhang: 'AATG', right_overhang: 'AGGT'}];
    const result = assignSequenceToSyntaxPart(sequenceBsaI, true, enzymes, parts);

    for (const reverseComplement of [false, true]) {
      const seq1 = reverseComplement ? getReverseComplementSequenceString(sequenceBsaI) : sequenceBsaI;
      const seq2 = reverseComplement ? getReverseComplementSequenceString(sequenceBsaI2) : sequenceBsaI2;
      const seq3 = reverseComplement ? getReverseComplementSequenceString(sequenceBsaI + sequenceBsaI2) : sequenceBsaI + sequenceBsaI2;

      const result = assignSequenceToSyntaxPart(seq1, true, enzymes, parts);
      expect(result).toEqual([{left_overhang: 'TACT', right_overhang: 'AATG'}]);

      const result2 = assignSequenceToSyntaxPart(seq2, true, enzymes, parts);
      expect(result2).toEqual([{left_overhang: 'AATG', right_overhang: 'AGGT'}]);

      const result3 = assignSequenceToSyntaxPart(seq3, true, enzymes, parts);
      if (reverseComplement) {
        expect(result3).toEqual([{left_overhang: 'AATG', right_overhang: 'AGGT'}, {left_overhang: 'TACT', right_overhang: 'AATG'}]);
      } else {
        expect(result3).toEqual([{left_overhang: 'TACT', right_overhang: 'AATG'}, {left_overhang: 'AATG', right_overhang: 'AGGT'}]);
      }
    }

    // Multi-spanning fragments are also picked up
    const resultMulti = assignSequenceToSyntaxPart(sequenceBsaI3, true, enzymes, parts);
    expect(resultMulti).toEqual([{left_overhang: 'TACT', right_overhang: 'AGGT'}]);

    const result4 = assignSequenceToSyntaxPart('', true, enzymes, parts);
    expect(result4).toEqual([])

    const result5 = assignSequenceToSyntaxPart('AACGTAGACAGATTA', true, enzymes, parts);
    expect(result5).toEqual([])
  });

});
