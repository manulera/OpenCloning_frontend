import { vi } from 'vitest';
import { isEqual } from 'lodash-es';
import eLabFTWInterface from './eLabFTWInterface';
import { makeSequenceMetadata } from './common';
import { error2String } from './utils';

const {
  name,
  getSequenceLink,
  getPrimerLink,
  submitPrimerToDatabase,
  getPrimer,
  getSequenceName,
  getSequencingFiles,
  loadSequenceFromUrlParams,
  isSubmissionDataValid,
  submitSequenceToDatabase,
} = eLabFTWInterface;

// For testing purposes, we need an empty metadata object
export const emptyMetadata = JSON.stringify({ extra_fields: {} });

const getFileText = async (file) => {
  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsText(file);
  });
};

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

afterEach(({ error }) => {
  // Check that all scenarios were used
  if (!error) {
    return;
  }
  if (mockedScenarios.length > 0) {
    console.log(mockedScenarios);
  }
  expect(mockedScenarios).toHaveLength(0);
});

async function getScenario(method, url, data, config) {
  let index = -1;
  for (let i = 0; i < mockedScenarios.length; i++) {
    const s = mockedScenarios[i];
    console.log(s);
    if (s.method !== method || s.url !== url || !isEqual(s.config, config)) {
      continue;
    }
    console.log('passed 1');
    if (s.data instanceof FormData && data instanceof FormData) {
      const commentsAreEqual = s.data.get('comment') === data.get('comment');
      console.log('passed 2', s.data.get('comment'), data.get('comment'));
      const scenarioFile = s.data.get('file');
      const requestFile = data.get('file');
      const scenarioFileText = await getFileText(scenarioFile);
      const requestFileText = await getFileText(requestFile);
      let filesAreEqual;
      try {
        // The history file has a different format for the entities field
        // so we need to normalize it before comparing
        const scenarioHistory = JSON.parse(scenarioFileText);
        const requestHistory = JSON.parse(requestFileText);
        requestHistory.entities = requestHistory.sequences;
        delete requestHistory.sequences;
        filesAreEqual = isEqual(scenarioHistory, requestHistory);
        console.log('passed 3', filesAreEqual);
      } catch (e) {
        filesAreEqual = scenarioFileText === requestFileText;
        console.log('passed 4', filesAreEqual);
      }
      if (commentsAreEqual && filesAreEqual) {
        console.log('passed 5');
        index = i;
        break;
      }
    } else if (isEqual(s.data, data)) {
      console.log('passed 6');
      index = i;
      break;
    }
  }

  if (index === -1) {
    // reset the mocked scenarios to not fail the afterEach
    mockedScenarios = [];
    throw new Error(`Scenario not found: ${JSON.stringify({ method, url, data, config }, null, 2)}`);
  }
  return mockedScenarios.splice(index, 1)[0];
}

function requestMocker(method) {
  return async (...args) => {
    let url;
    let data;
    let config;
    if (method === 'get') {
      [url, config] = args;
      data = undefined;
    } else if (method === 'delete') {
      [url, config] = args;
      data = config.data;
      config = { headers: config.headers };
    } else {
      [url, data, config] = args;
    }
    const scenario = await getScenario(method, url, data, config);
    expect(scenario).toBeDefined();
    if (scenario.code === undefined && (scenario.response.status === undefined || scenario.response.status === 200)) {
      return Promise.resolve(scenario.response);
    }
    return Promise.reject(scenario);
  };
}

vi.mock('./common', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    eLabFTWHttpClient: {
      post: requestMocker('post'),
      patch: requestMocker('patch'),
      get: requestMocker('get'),
      delete: requestMocker('delete'),
    },
  };
});

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
const mockPrimerCreateNetworkError = {
  ...mockPrimerCreate,
  response: { },
  code: 'ERR_NETWORK',
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
const mockPrimerUpdateNetworkError = {
  ...mockPrimerUpdate,
  response: { },
  code: 'ERR_NETWORK',
};
const mockPrimerLink = {
  method: 'post',
  url: '/api/v2/items/24/items_links/1',
  data: {},
  config: { headers: {} },
  response: {},
};
const mockPrimerLinkFail = {
  method: 'post',
  url: '/api/v2/items/24/items_links/1',
  data: {},
  config: { headers: {} },
  response: { status: 403, data: { description: 'Not found' } },
  code: 'hello',
};
const mockPrimerLinkFailNetwork = {
  method: 'post',
  url: '/api/v2/items/24/items_links/1',
  data: {},
  config: { headers: {} },
  response: undefined,
  code: 'ERR_NETWORK',
};
const mockPrimerDelete = {
  method: 'delete',
  url: '/api/v2/items/1',
  data: {},
  config: { headers: {
    'Content-Type': 'application/json',
  } },
  response: {},
};
const mockPrimerDeleteNetworkError = {
  ...mockPrimerDelete,
  response: undefined,
  code: 'ERR_NETWORK',
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
  it('linking to missing sequence', async () => {
    mockedScenarios.push(mockPrimerCreate);
    mockedScenarios.push(mockPrimerUpdate);
    mockedScenarios.push(mockPrimerLinkFail);
    mockedScenarios.push(mockPrimerDelete);

    const result = submitPrimerToDatabase({
      submissionData: {
        title: 'test',
        categoryId: 2,
      },
      primer: { sequence: 'ACGT' },
      linkedSequenceId: 24,
    });
    expect(result).rejects.toThrow('Error linking to sequence: Not found');
  });
  it('fail linking network error', async () => {
    mockedScenarios.push(mockPrimerCreate);
    mockedScenarios.push(mockPrimerUpdate);
    mockedScenarios.push(mockPrimerLinkFailNetwork);
    mockedScenarios.push(mockPrimerDelete);
    const result = submitPrimerToDatabase({
      submissionData: {
        title: 'test',
        categoryId: 2,
      },
      primer: { sequence: 'ACGT' },
      linkedSequenceId: 24,
    });
    expect(result).rejects.toThrow('Error linking to sequence: Network error: Cannot connect to eLabFTW');
  });
  it('fail naming network error', async () => {
    mockedScenarios.push(mockPrimerCreate);
    mockedScenarios.push(mockPrimerUpdateNetworkError);
    mockedScenarios.push(mockPrimerDelete);
    const result = submitPrimerToDatabase({
      submissionData: {
        title: 'test',
        categoryId: 2,
      },
      primer: { sequence: 'ACGT' },
    });
    expect(result).rejects.toThrow('Error naming primer: Network error: Cannot connect to eLabFTW');
  });
  it('fail creating primer', async () => {
    mockedScenarios.push(mockPrimerCreateNetworkError);
    const result = submitPrimerToDatabase({
      submissionData: {
        title: 'test',
        categoryId: 2,
      },
      primer: { sequence: 'ACGT' },
    });
    expect(result).rejects.toThrow('Error creating primer: Network error: Cannot connect to eLabFTW');
  });
  it('fail removing primer if error occurs', async () => {
    mockedScenarios.push(mockPrimerCreate);
    mockedScenarios.push(mockPrimerUpdateNetworkError);
    mockedScenarios.push(mockPrimerDeleteNetworkError);
    const result = submitPrimerToDatabase({
      submissionData: {
        title: 'test',
        categoryId: 2,
      },
      primer: { sequence: 'ACGT' },
    });
    expect(result).rejects.toThrow('There was an error (Network error: Cannot connect to eLabFTW) while trying to delete primer after an error naming primer');
  });
});

const mockPrimerGet = {
  method: 'get',
  url: '/api/v2/items/1',
  config: { headers: {} },
  response: { data: { id: 1,
    title: 'test',
    metadata: makeSequenceMetadata('dummy'),
  },
  },
};

const mockPrimerGetNoSequence = {
  ...mockPrimerGet,
  response: { data: { id: 1,
    title: 'test',
    metadata: emptyMetadata,
  },
  },
};
const mockPrimerGetNetworkError = {
  ...mockPrimerGet,
  response: undefined,
  code: 'ERR_NETWORK',
};
const mockPrimerGetNotFound = {
  ...mockPrimerGet,
  response: { status: 403, data: { description: 'Not found' } },
  code: 'hello',
};

describe('test getPrimer', () => {
  it('get primer', async () => {
    mockedScenarios.push(mockPrimerGet);
    const result = await getPrimer(1);
    expect(result).toEqual({
      name: 'test',
      database_id: 1,
      sequence: 'dummy',
    });
  });
  it('primer with no sequence does not raise an error when loading', async () => {
    mockedScenarios.push(mockPrimerGetNoSequence);
    const result = await getPrimer(1);
    expect(result).toEqual({
      name: 'test',
      database_id: 1,
    });
  });
  it('fail getting primer - network error', async () => {
    mockedScenarios.push(mockPrimerGetNetworkError);
    const result = getPrimer(1);
    expect(result).rejects.toThrow('Error getting primer: Network error: Cannot connect to eLabFTW');
  });
  it('fail getting primer - not found', async () => {
    mockedScenarios.push(mockPrimerGetNotFound);
    const result = getPrimer(1);
    expect(result).rejects.toThrow('Error getting primer with id 1, it might have been deleted or you can no longer access it');
  });
});

const mockSequenceName = {
  method: 'get',
  url: '/api/v2/items/1',
  config: { headers: {} },
  response: { data: { id: 1, title: 'sequence-name' } },
};
const mockSequenceNameNetworkError = {
  ...mockSequenceName,
  response: undefined,
  code: 'ERR_NETWORK',
};
const mockSequenceNameNotFound = {
  ...mockSequenceName,
  response: { status: 403, data: { description: 'Not found' } },
  code: 'hello',
};

describe('test getSequenceName', () => {
  it('get sequence name', async () => {
    mockedScenarios.push(mockSequenceName);
    const result = await getSequenceName(1);
    expect(result).toBe('sequence-name');
  });
  it('fail getting sequence name - network error', async () => {
    mockedScenarios.push(mockSequenceNameNetworkError);
    const result = getSequenceName(1);
    expect(result).rejects.toThrow('Error getting sequence name: Network error: Cannot connect to eLabFTW');
  });
  it('fail getting sequence name - not found', async () => {
    mockedScenarios.push(mockSequenceNameNotFound);
    const result = getSequenceName(1);
    expect(result).rejects.toThrow('Error getting name of sequence with id 1, it might have been deleted or you can no longer access it');
  });
});

const mockSequencingFilesFirstRequest = {
  method: 'get',
  url: '/api/v2/items/1/uploads',
  config: { headers: {} },
  response: { data: [
    {
      id: 2,
      real_name: 'sequencing-file-1',
    },
    {
      id: 3,
      real_name: 'sequencing-file-2',
    },
  ] },
};
const mockSequencingFilesFirstFile = {
  method: 'get',
  url: '/api/v2/items/1/uploads/2?format=binary',
  config: { headers: {}, responseType: 'blob' },
  response: { data: new Blob(['seq-content-1'], { type: 'application/octet-stream' }) },
};

const mockSequencingFilesSecondFile = {
  ...mockSequencingFilesFirstFile,
  url: '/api/v2/items/1/uploads/3?format=binary',
  response: { data: new Blob(['seq-content-2'], { type: 'application/octet-stream' }) },
};

const mockSequencingFilesNetworkError = {
  ...mockSequencingFilesFirstRequest,
  response: undefined,
  code: 'ERR_NETWORK',
};
const mockSequencingFilesNotFound = {
  ...mockSequencingFilesFirstRequest,
  response: { status: 403, data: { description: 'Not found' } },
  code: 'hello',
};

const mockSequencingFilesFirstFileNetworkError = {
  ...mockSequencingFilesFirstFile,
  response: undefined,
  code: 'ERR_NETWORK',
};

describe('test getSequencingFiles', () => {
  it('get sequencing files', async () => {
    mockedScenarios.push(mockSequencingFilesFirstRequest);
    mockedScenarios.push(mockSequencingFilesFirstFile);
    mockedScenarios.push(mockSequencingFilesSecondFile);
    const result = await getSequencingFiles(1);

    expect(result[0].name).toEqual('sequencing-file-1');
    const reader = new FileReader();
    reader.onload = () => {
      expect(reader.result).toEqual('seq-content-1');
    };
    reader.readAsText(await result[0].getFile());

    expect(result[1].name).toEqual('sequencing-file-2');
    const reader2 = new FileReader();
    reader2.onload = () => {
      expect(reader2.result).toEqual('seq-content-2');
    };
    reader2.readAsText(await result[1].getFile());
  });
  it('get sequencing files - network error', async () => {
    mockedScenarios.push(mockSequencingFilesNetworkError);
    const result = getSequencingFiles(1);
    expect(result).rejects.toThrow('Network error: Cannot connect to eLabFTW');
  });
  it('get sequencing files - not found', async () => {
    mockedScenarios.push(mockSequencingFilesNotFound);
    const result = getSequencingFiles(1);
    expect(result).rejects.toThrow('Not found');
  });
  it('get sequencing files - getFile() - network error', async () => {
    mockedScenarios.push(mockSequencingFilesFirstRequest);
    mockedScenarios.push(mockSequencingFilesFirstFileNetworkError);
    const result = await getSequencingFiles(1);
    expect(result[0].getFile()).rejects.toThrow('Network error: Cannot connect to eLabFTW');
  });
});

const mockFileInfo = {
  method: 'get',
  url: '/api/v2/items/1/uploads/2',
  config: { headers: {} },
  response: { data: { id: 2, real_name: 'sequencing-file-1' } },
};

const mockFileContent = {
  method: 'get',
  url: '/api/v2/items/1/uploads/2?format=binary',
  config: { headers: {}, responseType: 'blob' },
  response: { data: new Blob(['seq-content-1'], { type: 'application/octet-stream' }) },
};
const mockFileContentNetworkError = {
  ...mockFileContent,
  response: undefined,
  code: 'ERR_NETWORK',
};
const mockFileContentNotFound = {
  ...mockFileContent,
  response: { status: 403, data: { description: 'Not found' } },
  code: 'hello',
};
const mockFileInfoNetworkError = {
  ...mockFileInfo,
  response: undefined,
  code: 'ERR_NETWORK',
};
const mockFileInfoNotFound = {
  ...mockFileInfo,
  response: { status: 403, data: { description: 'Not found' } },
  code: 'hello',
};

describe('test loadSequenceFromUrlParams', () => {
  it('load sequence from url params', async () => {
    mockedScenarios.push(mockFileInfo);
    mockedScenarios.push(mockFileContent);
    const result = await loadSequenceFromUrlParams({ item_id: 1, file_id: 2 });
    expect(result.file).toBeInstanceOf(File);
    expect(result.file.name).toEqual('sequencing-file-1');
    expect(result.databaseId).toEqual(1);
    const reader = new FileReader();
    reader.onload = () => {
      expect(reader.result).toEqual('seq-content-1');
    };
    reader.readAsText(result.file);
  });
  it('load sequence from url params - no item_id or file_id', async () => {
    const result = await loadSequenceFromUrlParams({ file_id: 2 });
    expect(result).toBeNull();
    const result2 = await loadSequenceFromUrlParams({ item_id: 1 });
    expect(result2).toBeNull();
    const result3 = await loadSequenceFromUrlParams({});
    expect(result3).toBeNull();
  });
  it('load sequence from url params - fileInfo network error', async () => {
    mockedScenarios.push(mockFileInfoNetworkError);
    const result = loadSequenceFromUrlParams({ item_id: 1, file_id: 2 });
    expect(result).rejects.toThrow('Network error: Cannot connect to eLabFTW');
  });
  it('load sequence from url params - fileInfo not found', async () => {
    mockedScenarios.push(mockFileInfoNotFound);
    const result = loadSequenceFromUrlParams({ item_id: 1, file_id: 2 });
    expect(result).rejects.toThrow('Not found');
  });
  it('load sequence from url params - fileContent network error', async () => {
    mockedScenarios.push(mockFileInfo);
    mockedScenarios.push(mockFileContentNetworkError);
    const result = loadSequenceFromUrlParams({ item_id: 1, file_id: 2 });
    expect(result).rejects.toThrow('Network error: Cannot connect to eLabFTW');
  });
  it('load sequence from url params - fileContent not found', async () => {
    mockedScenarios.push(mockFileInfo);
    mockedScenarios.push(mockFileContentNotFound);
    const result = loadSequenceFromUrlParams({ item_id: 1, file_id: 2 });
    expect(result).rejects.toThrow('Not found');
  });
});

describe('test isSubmissionDataValid', () => {
  it('isSubmissionDataValid', () => {
    expect(isSubmissionDataValid({ title: 'test', sequenceCategoryId: 1 })).toBe(true);
    expect(isSubmissionDataValid({ title: 'test' })).toBe(false);
    expect(isSubmissionDataValid({ sequenceCategoryId: 1 })).toBe(false);
  });
});

describe('test error2String', () => {
  it('error2String', () => {
    expect(error2String({
      code: 'ERR_NETWORK',
      response: { status: 500, data: { description: 'Internal server error' } },
    })).toBe('Network error: Cannot connect to eLabFTW');
    expect(error2String({
      code: 'OK',
      response: { status: 500 },
    })).toBe('Internal server error');
    expect(error2String({
      code: 'OK',
      response: { status: 404, data: { description: 'error-message' } },
    })).toBe('error-message');
    expect(error2String({
    })).toBe('Internal error, please contact the developers.');
  });
});

const substate = {
  primers: [],
  entities: [
    {
      id: 22,
      file_content: 'sequence-file-content',
    },
  ],
  sources: [],
};
const mockSubmitSequenceWithoutPrimers = {
  method: 'post',
  url: '/api/v2/items',
  data: {
    category_id: 1,
    tags: [],
  },
  config: { headers: {} },
  response: { headers: { location: '/api/v2/items/2' } },
};
const mockRenameSequence = {
  method: 'patch',
  url: '/api/v2/items/2',
  data: { title: 'test' },
  config: { headers: {} },
  response: {},
};
const formData = new FormData();
formData.append('file', new Blob(['sequence-file-content'], { type: 'text/plain' }));
formData.append('comment', 'resource sequence - generated by OpenCloning');

const formData2 = new FormData();
formData2.append('file', new Blob([JSON.stringify(substate)], { type: 'text/plain' }));
formData2.append('comment', 'history file - generated by OpenCloning');
const mockUploadSequenceFile = {
  method: 'post',
  url: '/api/v2/items/2/uploads',
  data: formData,
  config: { headers: {} },
  response: { headers: { location: '/api/v2/items/2/uploads/1' } },
};
const mockUploadHistoryFile = {
  method: 'post',
  url: '/api/v2/items/2/uploads',
  data: formData2,
  config: { headers: {} },
  response: { headers: { location: '/api/v2/items/2/uploads/2' } },
};
describe('test submitSequenceToDatabase', () => {
  it.only('submitSequenceToDatabase', async () => {
    mockedScenarios.push(mockSubmitSequenceWithoutPrimers);
    mockedScenarios.push(mockRenameSequence);
    mockedScenarios.push(mockUploadSequenceFile);
    mockedScenarios.push(mockUploadHistoryFile);
    const { primerMappings, databaseId } = await submitSequenceToDatabase({ submissionData: { title: 'test', sequenceCategoryId: 1 }, substate, id: 22 });
    expect(primerMappings).toEqual([]);
    expect(databaseId).toEqual(2);
  });
});
