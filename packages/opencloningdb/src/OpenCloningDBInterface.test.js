import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import OpenCloningDBInterface from './OpenCloningDBInterface';

import { addStubToServer, getStub, setupToken, clearToken } from './testUtils.test';
import { setWorkspaceHeader } from './common';

const server = setupServer();

beforeAll(() => {
  setupToken();
  setWorkspaceHeader(1);
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => server.resetHandlers());
afterAll(() => {
  clearToken();
  server.close();
});

describe('submitPrimerToDatabase', () => {
  it('posts the primer and returns the new id, with the expected body', async () => {
    addStubToServer(server, 'post_primer');
    const id = await OpenCloningDBInterface.submitPrimerToDatabase({
      submissionData: { title: 'new' },
      primer: { sequence: 'GGCC' },
    });
    expect(id).toBe(70);
  });

});
