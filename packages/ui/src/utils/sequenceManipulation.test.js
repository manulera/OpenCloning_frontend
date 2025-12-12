import { syncChromatogramDataWithAlignment } from './sequenceManipulation';
import teselaJson from '../../cypress/test_files/example_chromatogram.json';
import { getReverseComplementSequenceString } from '@teselagen/sequence-utils';

const exampleChromatogramData = teselaJson.chromatogramData;

describe('syncChromatogramDataWithAlignment', () => {


  it('returns original data when sequences match', () => {
    const result = syncChromatogramDataWithAlignment(exampleChromatogramData, 'TTGAGATC---CTTTTTTT');
    expect(result).toEqual(exampleChromatogramData);
  });

  it('handles reverse complemented sequence', () => {
    const reverseComplementedSequence = getReverseComplementSequenceString('TTGAGATC---CTTTTTTT');
    const result = syncChromatogramDataWithAlignment(exampleChromatogramData, reverseComplementedSequence);
    expect(result.baseCalls.join('')).toEqual(getReverseComplementSequenceString('TTGAGATCCTTTTTTT'));
  });

  it('handles rotated sequence', () => {
    const result = syncChromatogramDataWithAlignment(exampleChromatogramData, 'CCTTTTTTTTTGAGAT');
    expect(result.baseCalls.join('')).toEqual('CCTTTTTTTTTGAGAT');
  });

  it('handles rotated and reverse complemented sequence', () => {
    const reverseComplementedSequence = getReverseComplementSequenceString('CCTTTTTTTTTGAGAT');
    const result = syncChromatogramDataWithAlignment(exampleChromatogramData, reverseComplementedSequence);
    expect(result.baseCalls.join('')).toEqual(getReverseComplementSequenceString('CCTTTTTTTTTGAGAT'));
  });


  it('returns original data when no match found', () => {
    const result = syncChromatogramDataWithAlignment(exampleChromatogramData, 'GGCC');
    expect(result).toEqual(exampleChromatogramData);
  });

});
