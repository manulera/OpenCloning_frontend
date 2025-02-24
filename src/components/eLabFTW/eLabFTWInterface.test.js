import { vi } from 'vitest';
import eLabFTWInterface from './eLabFTWInterface';

vi.mock('./envValues', () => ({
  readApiKey: '',
  writeApiKey: '',
  baseUrl: '',
}));

// Mock the component imports
vi.mock('@mui/icons-material/Save', () => ({ default: 'SaveIcon' }));
vi.mock('@mui/icons-material/Link', () => ({ default: 'LinkIcon' }));
vi.mock('./GetSequenceFileAndDatabaseIdComponent', () => ({ default: 'GetSequenceFileAndDatabaseIdComponent' }));
vi.mock('./SubmitToDatabaseComponent', () => ({ default: 'SubmitToDatabaseComponent' }));
vi.mock('./PrimersNotInDatabaseComponent', () => ({ default: 'PrimersNotInDatabaseComponent' }));
vi.mock('./GetPrimerComponent', () => ({ default: 'GetPrimerComponent' }));
vi.mock('./LoadHistoryComponent', () => ({ default: 'LoadHistoryComponent' }));

let mockedScenarios;

beforeEach(() => {
  mockedScenarios = [];
});

afterEach(() => {
  // Check that all scenarios were used
  if (mockedScenarios.length > 0) {
    throw new Error(
      `Unused scenarios: ${JSON.stringify(mockedScenarios, null, 2)}`,
    );
  }
});

function getScenario(method, url, data, config) {
  const index = mockedScenarios.findIndex((s) => (
    s.method === method
    && s.url === url
    && JSON.stringify(s.data) === JSON.stringify(data)
    && JSON.stringify(s.config) === JSON.stringify(config)
  ));
  if (index === -1) {
    throw new Error(`Scenario not found: ${JSON.stringify({ method, url, data, config }, null, 2)}`);
  }
  return mockedScenarios.splice(index, 1)[0];
}

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockImplementation((url, data, config) => {
      const scenario = getScenario('post', url, data, config);

      expect(scenario).toBeDefined();
      return Promise.resolve(scenario.response);
    }),
    patch: vi.fn().mockImplementation((url, data, config) => {
      const scenario = getScenario('patch', url, data, config);
      expect(scenario).toBeDefined();
      return Promise.resolve(scenario.response);
    }),
  },
}));

const {
  name,
  getSequenceLink,
  getPrimerLink,
  submitPrimerToDatabase,
} = eLabFTWInterface;

describe('test name and links', () => {
  it('test name', () => {
    expect(name).toBe('eLabFTW');
  });
  it('test getSequenceLink', () => {
    expect(getSequenceLink(1)).toBe('/database.php?mode=view&id=1');
  });
  it('test getPrimerLink', () => {
    expect(getPrimerLink(1)).toBe('/database.php?mode=view&id=1');
  });
});

const mockPrimerCreate = {
  method: 'post',
  url: '/api/v2/items',
  data: {
    category_id: 2,
    tags: [],
  },
  config: { headers: {} },
  response: { headers: { location: '/api/v2/items/1' } },
};
const mockPrimerUpdate = {
  method: 'patch',
  url: '/api/v2/items/1',
  data: {
    title: 'test',
    metadata: JSON.stringify({
      extra_fields: {
        sequence: {
          type: 'text',
          value: 'ACGT',
          group_id: null,
        },
      },
    }),
  },
  config: { headers: {} },
  response: {},
};
const mockPrimerLink = {
  method: 'post',
  url: '/api/v2/items/24/items_links/1',
  data: {},
  config: { headers: {} },
  response: {},
};

describe('test submitPrimerToDatabase', () => {
  it('without linked sequence', async () => {
    mockedScenarios.push(mockPrimerCreate);
    mockedScenarios.push(mockPrimerUpdate);

    const result = await submitPrimerToDatabase({
      submissionData: {
        title: 'test',
        categoryId: 2,
      },
      primer: {
        sequence: 'ACGT',
      },
    });
    expect(result).toBe(1);
  });
  it('with linked sequence', async () => {
    mockedScenarios.push(mockPrimerCreate);
    mockedScenarios.push(mockPrimerUpdate);
    mockedScenarios.push(mockPrimerLink);

    const result = await submitPrimerToDatabase({
      submissionData: {
        title: 'test',
        categoryId: 2,
      },
      primer: { sequence: 'ACGT' },
      linkedSequenceId: 24,
    });
    expect(result).toBe(1);
  });
});
