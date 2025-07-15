import { mockSources, mockSequences, mockPrimers } from '../../tests/mockNetworkData';
import { collectParentSequencesAndSources, getSubState } from './network';

describe('collectParentSequencesAndSources', () => {
  it('should collect all parent sequences and sources recursively', () => {
    const sequencesToExport = [];
    const sourcesToExport = [];

    collectParentSequencesAndSources(
      mockSources.find((s) => s.output === 1),
      mockSources,
      mockSequences,
      sequencesToExport,
      sourcesToExport,
    );

    expect(sequencesToExport).toEqual([
      { id: 2, name: 'Seq2' },
      { id: 3, name: 'Seq3' },
      { id: 4, name: 'Seq4' },
      { id: 5, name: 'Seq5' },
    ]);

    expect(sourcesToExport).toEqual([
      mockSources.find((s) => s.output === 2),
      mockSources.find((s) => s.output === 3),
      mockSources.find((s) => s.output === 4),
      mockSources.find((s) => s.output === 5),
    ]);
  });

  it('should stop collecting when stopAtDatabaseId is true and a source with database_id is found', () => {
    const sequencesToExport = [];
    const sourcesToExport = [];

    collectParentSequencesAndSources(
      mockSources.find((s) => s.output === 1),
      mockSources,
      mockSequences,
      sequencesToExport,
      sourcesToExport,
      true,
    );

    expect(sequencesToExport).toEqual([
      { id: 2, name: 'Seq2' },
      { id: 3, name: 'Seq3' },
    ]);

    expect(sourcesToExport).toEqual([
      mockSources.find((s) => s.output === 2),
      mockSources.find((s) => s.output === 3),
    ]);
  });

  it('should handle sources with no input', () => {
    const sequencesToExport = [];
    const sourcesToExport = [];

    collectParentSequencesAndSources(
      mockSources.find((s) => s.output === 4),
      mockSources,
      mockSequences,
      sequencesToExport,
      sourcesToExport,
    );

    expect(sequencesToExport).toEqual([]);
    expect(sourcesToExport).toEqual([]);
  });
});

describe('getSubState', () => {
  it('should throw an error if the sequence is not found', () => {
    const state = {
      cloning: {
        sequences: [],
        sources: [],
      },
    };

    expect(() => getSubState(state, 1)).toThrow('Sequence with id 1 not found');
  });

  it('should throw an error if the source is not found', () => {
    const state = {
      cloning: {
        sequences: [{ id: 1 }],
        sources: [],
      },
    };

    expect(() => getSubState(state, 1)).toThrow('Source with id 1 not found');
  });
  it('should return the correct substate with used primers only', () => {
    const state = {
      cloning: {
        sequences: mockSequences,
        sources: mockSources,
        primers: mockPrimers,
      },
    };

    const substate = getSubState(state, 1);

    // Unlike the sequencesToExport, the substate includes the sequence with id and its source
    expect(substate.sequences).toEqual([
      { id: 1, name: 'Seq1' },
      { id: 2, name: 'Seq2' },
      { id: 3, name: 'Seq3' },
      { id: 4, name: 'Seq4' },
      { id: 5, name: 'Seq5' },
    ]);

    expect(substate.sources).toEqual([
      mockSources.find((s) => s.output === 1),
      mockSources.find((s) => s.output === 2),
      mockSources.find((s) => s.output === 3),
      mockSources.find((s) => s.output === 4),
      mockSources.find((s) => s.output === 5),
    ]);

    expect(substate.primers).toEqual([
      mockPrimers.find((p) => p.id === 1),
      mockPrimers.find((p) => p.id === 2),
      mockPrimers.find((p) => p.id === 3),
      mockPrimers.find((p) => p.id === 4),
    ]);
  });
  it('should work with database_id', () => {
    const state = {
      cloning: {
        sequences: mockSequences,
        sources: mockSources,
        primers: mockPrimers,
      },
    };

    const substate = getSubState(state, 1, true);

    expect(substate.sequences).toEqual([
      { id: 1, name: 'Seq1' },
      { id: 2, name: 'Seq2' },
      { id: 3, name: 'Seq3' },
    ]);

    expect(substate.sources).toEqual([
      mockSources.find((s) => s.output === 1),
      mockSources.find((s) => s.output === 2),
      mockSources.find((s) => s.output === 3),
    ]);

    expect(substate.primers).toEqual([
      mockPrimers.find((p) => p.id === 1),
      mockPrimers.find((p) => p.id === 2),
    ]);
  });
});
