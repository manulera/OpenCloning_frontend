import primersToTabularFile from './primersToTabularFile';

describe('primersToTabularFile', () => {
  it('converts primers to a tabular file format with comma separator', () => {
    const primers = [
      { id: 1, name: 'Primer1', sequence: 'ATCG', database_id: 100 },
      { id: 2, name: 'Primer2', sequence: 'GCTA', database_id: null },
    ];

    const result = primersToTabularFile(primers, ',');

    const expectedOutput = 'id,name,sequence\n'
      + '1,Primer1,ATCG\n'
      + '2,Primer2,GCTA';

    expect(result).toBe(expectedOutput);
  });

  it('converts primers to a tabular file format with tab separator', () => {
    const primers = [
      { id: 3, name: 'Primer3', sequence: 'GGCC', database_id: 200 },
    ];

    const result = primersToTabularFile(primers, '\t');

    const expectedOutput = 'id\tname\tsequence\n'
      + '3\tPrimer3\tGGCC';

    expect(result).toBe(expectedOutput);
  });
});
