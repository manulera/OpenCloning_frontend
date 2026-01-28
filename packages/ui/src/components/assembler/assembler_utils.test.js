import { aliasedEnzymesByName, getDigestFragmentsForRestrictionEnzymes, getReverseComplementSequenceString } from "@teselagen/sequence-utils";
import { assignSequenceToSyntaxPart, simplifyDigestFragment, reverseComplementSimplifiedDigestFragment } from "./assembler_utils";
import { partsToEdgesGraph } from "./graph_utils";

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
    const graph = partsToEdgesGraph(parts);

    for (const reverseComplement of [false, true]) {
      const seq1 = reverseComplement ? getReverseComplementSequenceString(sequenceBsaI) : sequenceBsaI;
      const seq2 = reverseComplement ? getReverseComplementSequenceString(sequenceBsaI2) : sequenceBsaI2;
      const seq3 = reverseComplement ? getReverseComplementSequenceString(sequenceBsaI + sequenceBsaI2) : sequenceBsaI + sequenceBsaI2;

      const sequenceData1 = { sequence: seq1, circular: true };
      const sequenceData2 = { sequence: seq2, circular: true };
      const sequenceData3 = { sequence: seq3, circular: true };

      const result = assignSequenceToSyntaxPart(sequenceData1, enzymes, graph);
      expect(result).toEqual([{left_overhang: 'TACT', right_overhang: 'AATG', longestFeature: null}]);

      const result2 = assignSequenceToSyntaxPart(sequenceData2, enzymes, graph);
      expect(result2).toEqual([{left_overhang: 'AATG', right_overhang: 'AGGT', longestFeature: null}]);

      const result3 = assignSequenceToSyntaxPart(sequenceData3, enzymes, graph);
      if (reverseComplement) {
        expect(result3).toEqual([{left_overhang: 'AATG', right_overhang: 'AGGT', longestFeature: null}, {left_overhang: 'TACT', right_overhang: 'AATG', longestFeature: null}]);
      } else {
        expect(result3).toEqual([{left_overhang: 'TACT', right_overhang: 'AATG', longestFeature: null}, {left_overhang: 'AATG', right_overhang: 'AGGT', longestFeature: null}]);
      }
    }

    // Multi-spanning fragments are also picked up
    const resultMulti = assignSequenceToSyntaxPart({ sequence: sequenceBsaI3, circular: true }, enzymes, graph);
    expect(resultMulti).toEqual([{left_overhang: 'TACT', right_overhang: 'AGGT', longestFeature: null}]);

    const result4 = assignSequenceToSyntaxPart({ sequence: '', circular: true }, enzymes, graph);
    expect(result4).toEqual([])

    const result5 = assignSequenceToSyntaxPart({ sequence: 'AACGTAGACAGATTA', circular: true }, enzymes, graph);
    expect(result5).toEqual([])
  });

});
