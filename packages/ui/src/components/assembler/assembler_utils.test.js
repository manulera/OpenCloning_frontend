import { aliasedEnzymesByName, getDigestFragmentsForRestrictionEnzymes, getReverseComplementSequenceString } from "@teselagen/sequence-utils";
import { assignSequenceToSyntaxPart, simplifyDigestFragment, reverseComplementSimplifiedDigestFragment } from "./assembler_utils";


const sequenceBsaI  = 'tgggtctcaTACTagagtcacacaggactactaAATGagagacctac';
const sequenceBsaI2 = 'tgggtctcaAATGagagtcacacaggactactaAGGTagagacctac'

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
    const partKeys = ['TACT-AATG', 'AATG-AGGT'];

    for (const reverseComplement of [false, true]) {
      const seq1 = reverseComplement ? getReverseComplementSequenceString(sequenceBsaI) : sequenceBsaI;
      const seq2 = reverseComplement ? getReverseComplementSequenceString(sequenceBsaI2) : sequenceBsaI2;
      const seq3 = reverseComplement ? getReverseComplementSequenceString(sequenceBsaI + sequenceBsaI2) : sequenceBsaI + sequenceBsaI2;

      const result = assignSequenceToSyntaxPart(seq1, true, enzymes, partKeys);
      expect(result).toEqual(['TACT-AATG']);

      const result2 = assignSequenceToSyntaxPart(seq2, true, enzymes, partKeys);
      expect(result2).toEqual(['AATG-AGGT']);

      const result3 = assignSequenceToSyntaxPart(seq3, true, enzymes, partKeys);
      expect(result3).toEqual(['TACT-AATG', 'AATG-AGGT']);
    }
    const result4 = assignSequenceToSyntaxPart('', true, enzymes, partKeys);
    expect(result4).toEqual([])

    const result5 = assignSequenceToSyntaxPart('AACGTAGACAGATTA', true, enzymes, partKeys);
    expect(result5).toEqual([])
  });

});
