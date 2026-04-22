import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import OpenCloningDBInterface from './OpenCloningDBInterface';
import { baseUrl } from './common';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('submitPrimerToDatabase', () => {
  it('posts the primer and returns the new id, with the expected body', async () => {
    let received;
    server.use(
      http.post(`${baseUrl}/primer`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ id: 42 }, { status: 201 });
      }),
    );

    const id = await OpenCloningDBInterface.submitPrimerToDatabase({
      submissionData: { title: 'fwd-1' },
      primer: { sequence: 'ACGT' },
    });

    expect(id).toBe(42);
    expect(received).toEqual({ id: 0, name: 'fwd-1', sequence: 'ACGT' });
  });

  it('rejects when the server returns 422', async () => {
    server.use(
      http.post(`${baseUrl}/primer`, () =>
        HttpResponse.json({ detail: 'invalid sequence' }, { status: 422 }),
      ),
    );

    await expect(
      OpenCloningDBInterface.submitPrimerToDatabase({
        submissionData: { title: 'x' },
        primer: { sequence: '' },
      }),
    ).rejects.toMatchObject({ response: { status: 422 } });
  });
});
