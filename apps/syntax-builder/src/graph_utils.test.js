import { pathToMSA} from './graph_utils.js';

const paths = [
  ["CCCT", "AACG", "TATG", "ATCC", "GCTG", "TACA", "GAGT", "CCGA", "CGCT", "CCCT"],
  ["TATG","TTCT","ATCC"],
  ["TATG","AAAA","CCCC","ATCC"],
  ["ATCC","TGGC","GCTG","CCGA","CAAT","CCCT"],
]

// Debug: see all paths
const msa = pathToMSA(paths);
msa.forEach(row => {
  console.log(row.join(' | '));
});

describe('graph_utils', () => {
  it('should convert paths to MSA', () => {
    const msa = pathToMSA(paths);
    expect(msa).toEqual(msa);
  });
});
