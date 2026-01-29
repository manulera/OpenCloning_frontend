import { aliasedEnzymesByName, getDigestFragmentsForRestrictionEnzymes, getReverseComplementSequenceString, getComplementSequenceString } from "@teselagen/sequence-utils";
import { assignSequenceToSyntaxPart, simplifyDigestFragment, reverseComplementSimplifiedDigestFragment, tripletsToTranslation, partDataToDisplayData, arrayCombinations } from "./assembler_utils";
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

    // Features are picked up
    const sequenceDataWithFeatures = {
      sequence: sequenceBsaI3,
      circular: true,
      features: [
        {start: 15, end: 30, type: 'misc_feature', name: 'feature1'},
        {start: 2, end: 45, type: 'misc_feature', name: 'feature2'}
      ]};

    const result6 = assignSequenceToSyntaxPart(sequenceDataWithFeatures, enzymes, graph);
    const {start, end, type, name} = result6[0].longestFeature;
    expect(start).toBe(15);
    expect(end).toBe(30);
    expect(type).toBe('misc_feature');
    expect(name).toBe('feature1');
  });
});

describe('tripletsToTranslation', () => {
  it('returns empty string for falsy input', () => {
    expect(tripletsToTranslation(null)).toBe('');
    expect(tripletsToTranslation(undefined)).toBe('');
    expect(tripletsToTranslation(false)).toBe('');
  });

  it('returns empty string for empty array', () => {
    expect(tripletsToTranslation([])).toBe('');
  });

  it('translates valid triplets to amino acid codes', () => {
    // ATG = Methionine (Met)
    expect(tripletsToTranslation(['ATG'])).toBe('Met');
    
    // TTT = Phenylalanine (Phe)
    expect(tripletsToTranslation(['TTT'])).toBe('Phe');
    
    // Multiple triplets
    expect(tripletsToTranslation(['ATG', 'TTT', 'GCA'])).toBe('MetPheAla');
  });

  it('replaces Stop codons with ***', () => {
    // TAA, TAG, TGA are stop codons
    const stopCodons = ['TAA', 'TAG', 'TGA'];
    const result = tripletsToTranslation(stopCodons);
    expect(result).toBe('*********');
  });

  it('returns " - " for triplets with non-ACGT characters', () => {
    expect(tripletsToTranslation(['ATN'])).toBe(' - ');
    expect(tripletsToTranslation(['XYZ'])).toBe(' - ');
    expect(tripletsToTranslation(['AT-'])).toBe(' - ');
  });

  it('handles mixed valid and invalid triplets', () => {
    const result = tripletsToTranslation(['ATG', 'XYZ', 'TTT']);
    expect(result).toBe('Met - Phe');
  });
});

describe('partDataToDisplayData', () => {
  it('computes reverse complements for all sequences and returns empty translations when no codon starts provided', () => {
    const data = {
      left_overhang: 'ATGC',
      right_overhang: 'CGTA',
      left_inside: 'TTAA',
      right_inside: 'AATT'
    };
    
    const result = partDataToDisplayData(data);
    
    expect(result.leftOverhangRc).toBe(getComplementSequenceString('ATGC'));
    expect(result.rightOverhangRc).toBe(getComplementSequenceString('CGTA'));
    expect(result.leftInsideRc).toBe(getComplementSequenceString('TTAA'));
    expect(result.rightInsideRc).toBe(getComplementSequenceString('AATT'));

    expect(result.leftTranslationOverhang).toBe('');
    expect(result.leftTranslationInside).toBe('');
    expect(result.rightTranslationOverhang).toBe('');
    expect(result.rightTranslationInside).toBe('');
  });

  it('computes left translation when left_codon_start is provided', () => {
    const data = {
      left_overhang: 'AT',
      left_inside: 'GCGCA',
      left_codon_start: 1,
      right_overhang: '',
      right_inside: ''
    };
    
    const result = partDataToDisplayData(data);
    
    // ATG CGC A... should translate to Met Arg...
    expect(result.leftTranslationOverhang).toBe('Me');
    expect(result.leftTranslationInside).toBe('tArg');

    const data2 = {
      left_overhang: 'ATTT',
      left_inside: 'GCGCA',
      left_codon_start: 3,
      right_overhang: '',
      right_inside: ''
    };
    const result2 = partDataToDisplayData(data2);
    expect(result2.leftTranslationOverhang).toBe('  Le');
    expect(result2.leftTranslationInside).toBe('uArg');
  });

});

describe('arrayCombinations', () => {
  it('returns null for empty array', () => {
    expect(arrayCombinations([])).toBe(null);
  });

  it('returns array of arrays for single array', () => {
    expect(arrayCombinations([[1, 2, 3]])).toEqual([[1], [2], [3]]);
  });

  it('returns array of arrays for multiple arrays', () => {
    expect(arrayCombinations([[1, 2], [3, 4], [5, 6]])).toEqual([[1, 3, 5], [1, 3, 6], [1, 4, 5], [1, 4, 6], [2, 3, 5], [2, 3, 6], [2, 4, 5], [2, 4, 6]]);
  });
});
