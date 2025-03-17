export const mockEntities = [
  { id: 1, name: 'Entity1' },
  { id: 2, name: 'Entity2' },
  { id: 3, name: 'Entity3' },
  { id: 4, name: 'Entity4' },
  { id: 5, name: 'Entity5' },
  { id: 6, name: 'unrelated' },
];

export const mockSources = [
  { id: 'source1', input: [2], output: 1 },
  { id: 'source2', input: [3], output: 2, type: 'OligoHybridizationSource', forward_oligo: 1, reverse_oligo: 2 },
  { id: 'source3', input: [4, 5], output: 3, database_id: 100 },
  { id: 'source4', input: [], output: 4 },
  { id: 'source5', input: [], output: 5, type: 'OligoHybridizationSource', forward_oligo: 3, reverse_oligo: 4 },
  { id: 'source6', input: [], output: 6 },
];

export const mockPrimers = [
  { id: 1, name: 'Primer1' },
  { id: 2, name: 'Primer2', database_id: 123 },
  { id: 3, name: 'Primer3' },
  { id: 4, name: 'Primer4' },
  { id: 5, name: 'unused' },
];

export const mockTeselaJsonCache = {
  1: { name: 'Entity1' },
  2: { name: 'Entity2' },
  3: { name: 'Entity3' },
  4: { name: 'Entity4' },
  5: { name: 'Entity5' },
  6: { name: 'unrelated' },
};
