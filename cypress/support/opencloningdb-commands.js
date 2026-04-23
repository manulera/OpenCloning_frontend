import { setWorkspaceHeader } from '@opencloning/opencloningdb';
import fs from 'fs';
const DB_URL = 'http://localhost:8001';

/**
 * Authenticate against OpenCloningDB and configure the axios client for component tests.
 * @param {string} email
 * @param {string} password
 * @param {number} workspaceId
 */
Cypress.Commands.add('loginToOpenCloningDB', (email, password, workspaceId) => {
  cy.request({
    method: 'POST',
    url: `${DB_URL}/auth/token`,
    form: true,
    body: { username: email, password },
  }).then(({ body }) => {
    localStorage.setItem('token', body.access_token);
    setWorkspaceHeader(workspaceId);
  });
});

const STUB_FOLDER = `OpenCloning_backend/stubs/db`;

Cypress.Commands.add('getStub', (name) => {
  return cy.readFile(`${STUB_FOLDER}/${name}.json`);
});
