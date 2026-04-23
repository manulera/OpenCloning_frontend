import { describe, expect, it, vi } from 'vitest';
import { getStub } from './testUtils.test';

const multipartStub = getStub('post_sequence_sequencing_files');
const sequenceFileStub = multipartStub.body.multipart_files[0];
const databaseId = Number(multipartStub.endpoint.match(/\/sequence\/(\d+)\//)?.[1]);
const postMock = vi.fn().mockResolvedValue({
  data: 'direct-response',
});

vi.mock('./common', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    openCloningDBHttpClient: {
      ...actual.openCloningDBHttpClient,
      post: (...args) => postMock(...args),
    },
  };
});

import OpenCloningDBInterface from './OpenCloningDBInterface';

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result);
    reader.readAsText(file);
  });
}

describe('submitSequencingFileToDatabase multipart payload', () => {
  it('submits FormData with files field and forwards response', async () => {
    postMock.mockClear();
    const sequenceFile = new File([sequenceFileStub.content], sequenceFileStub.filename, {
      type: sequenceFileStub.content_type,
    });

    const result = await OpenCloningDBInterface.submitSequencingFileToDatabase({
      databaseId,
      sequencingFiles: [sequenceFile],
    });

    const [url, formData] = postMock.mock.calls[0];
    expect(url).toBe(multipartStub.endpoint);
    expect(formData).toBeInstanceOf(FormData);

    const files = formData.getAll('files');
    expect(files).toHaveLength(1);
    expect(files[0]).toBeInstanceOf(File);
    expect(files[0].name).toBe(sequenceFileStub.filename);
    expect(files[0].type).toBe(sequenceFileStub.content_type);
    expect(await readFileAsText(files[0])).toBe(sequenceFileStub.content);

    expect(result).toEqual('direct-response');
  });
});
