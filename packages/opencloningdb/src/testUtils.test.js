import fs from 'fs';
import { http, HttpResponse } from 'msw';
import { expect } from 'vitest';
import { baseUrl } from './common';

const STUB_FOLDER = `${__dirname}/../../../OpenCloning_backend/stubs/db`;

/**
 * @typedef {Object} DbStub
 * @property {unknown} body
 * @property {string} endpoint
 * @property {Record<string, string>} headers
 * @property {string} method
 * @property {unknown} params
 * @property {unknown} response
 */

/**
 * @param {string} stubName
 * @returns {DbStub}
 */
export function getStub(stubName) {
  if (!fs.existsSync(`${STUB_FOLDER}/${stubName}.json`)) {
    throw new Error(`Stub ${stubName} not found`);
  }
  return /** @type {DbStub} */ (
    JSON.parse(fs.readFileSync(`${STUB_FOLDER}/${stubName}.json`, 'utf8'))
  );
}

/**
 * @param {unknown} server
 * @param {string} stubName
 */
export function addStubToServer(server, stubName) {
  const stub = getStub(stubName);
  const url = new URL(stub.endpoint, baseUrl);
  server.use(
    http[stub.method.toLowerCase()](url.toString(), async ({ request, params }) => {
      const plainParams = Object.fromEntries(Object.entries(params ?? {}));
      const actualParams = Object.keys(plainParams).length === 0 ? null : plainParams;
      const actualBody = await request
        .clone()
        .json()
        .catch(() => null);
      expect(actualParams).toEqual(stub.params);
      expect(actualBody).toEqual(stub.body);

      const actualHeaders = Object.fromEntries(request.headers.entries());
      delete actualHeaders['content-type'];
      delete actualHeaders['accept'];
      expect(actualHeaders).toMatchObject(stub.headers);

      return HttpResponse.json(stub.response.body, { status: stub.response.status_code, headers: stub.response.headers });
    }),
  );
}

export function setupToken() {
  localStorage.setItem('token', '__TEST_TOKEN__');
}

export function clearToken() {
  localStorage.removeItem('token');
}
