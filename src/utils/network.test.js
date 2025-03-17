import { mockSources, mockEntities, mockPrimers } from '../../tests/mockNetworkData';
import { collectParentEntitiesAndSources, getSubState } from './network';

describe('collectParentEntitiesAndSources', () => {
  it('should collect all parent entities and sources recursively', () => {
    const entitiesToExport = [];
    const sourcesToExport = [];

    collectParentEntitiesAndSources(
      mockSources.find((s) => s.output === 1),
      mockSources,
      mockEntities,
      entitiesToExport,
      sourcesToExport,
    );

    expect(entitiesToExport).toEqual([
      { id: 2, name: 'Entity2' },
      { id: 3, name: 'Entity3' },
      { id: 4, name: 'Entity4' },
      { id: 5, name: 'Entity5' },
    ]);

    expect(sourcesToExport).toEqual([
      mockSources.find((s) => s.output === 2),
      mockSources.find((s) => s.output === 3),
      mockSources.find((s) => s.output === 4),
      mockSources.find((s) => s.output === 5),
    ]);
  });

  it('should stop collecting when stopAtDatabaseId is true and a source with database_id is found', () => {
    const entitiesToExport = [];
    const sourcesToExport = [];

    collectParentEntitiesAndSources(
      mockSources.find((s) => s.output === 1),
      mockSources,
      mockEntities,
      entitiesToExport,
      sourcesToExport,
      true,
    );

    expect(entitiesToExport).toEqual([
      { id: 2, name: 'Entity2' },
      { id: 3, name: 'Entity3' },
    ]);

    expect(sourcesToExport).toEqual([
      mockSources.find((s) => s.output === 2),
      mockSources.find((s) => s.output === 3),
    ]);
  });

  it('should handle sources with no input', () => {
    const entitiesToExport = [];
    const sourcesToExport = [];

    collectParentEntitiesAndSources(
      mockSources.find((s) => s.output === 4),
      mockSources,
      mockEntities,
      entitiesToExport,
      sourcesToExport,
    );

    expect(entitiesToExport).toEqual([]);
    expect(sourcesToExport).toEqual([]);
  });
});

describe('getSubState', () => {
  it('should throw an error if the entity is not found', () => {
    const state = {
      cloning: {
        entities: [],
        sources: [],
      },
    };

    expect(() => getSubState(state, 1)).toThrow('Entity with id 1 not found');
  });

  it('should throw an error if the source is not found', () => {
    const state = {
      cloning: {
        entities: [{ id: 1 }],
        sources: [],
      },
    };

    expect(() => getSubState(state, 1)).toThrow('Source with output id 1 not found');
  });
  it('should return the correct substate with used primers only', () => {
    const state = {
      cloning: {
        entities: mockEntities,
        sources: mockSources,
        primers: mockPrimers,
      },
    };

    const substate = getSubState(state, 1);

    // Unlike the entitiesToExport, the substate includes the entity with id and its source
    expect(substate.entities).toEqual([
      { id: 1, name: 'Entity1' },
      { id: 2, name: 'Entity2' },
      { id: 3, name: 'Entity3' },
      { id: 4, name: 'Entity4' },
      { id: 5, name: 'Entity5' },
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
        entities: mockEntities,
        sources: mockSources,
        primers: mockPrimers,
      },
    };

    const substate = getSubState(state, 1, true);

    expect(substate.entities).toEqual([
      { id: 1, name: 'Entity1' },
      { id: 2, name: 'Entity2' },
      { id: 3, name: 'Entity3' },
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
