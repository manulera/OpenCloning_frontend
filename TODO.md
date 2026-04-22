# opencloningdb — frontend testing plan

Single source of truth for the testing approach across `apps/opencloningdb` and `packages/opencloningdb`. Covers strategy, layer split, and three minimal reference examples (unit, component, e2e).

## Strategy at a glance

- **Real backend for happy paths.** The backend (see `OpenCloning_backend/packages/opencloning-db`) is a submodule; `init_db.py` seeds a tmp SQLite DB in well under a second. Cypress component and e2e runs spawn `uvicorn` once and reset state per-test via `cy.task('db:reset')`.
- **MSW for everything that is painful against a real DB.** Error paths (401/403/404/422/500), loading states (artificial delay), edge shapes (empty list with non-zero `total`, pagination boundaries), and request-body contract checks in unit tests. MSW starts with `onUnhandledRequest: 'bypass'` so non-overridden calls still hit the real backend.
- **No standalone `stubs/` pipeline for now.** Reconsider only if a pure-frontend CI job (no Python) becomes desirable. Handlers define payloads inline or reference small JSON files next to the test.
- **Vitest for pure logic + interface unit tests.** No React mounting in Vitest; component tests all live in Cypress.

## Layer split

- **Vitest unit** — pure helpers (`apps/opencloningdb/src/utils/*`), and the database interface module `packages/opencloningdb/src/OpenCloningDBInterface.js` tested with MSW at the network boundary. These are the only unit-level tests that should make HTTP calls.
- **Cypress component (`.cy.jsx`)** — every component in `packages/opencloningdb/src/` and `apps/opencloningdb/src/components/`. Mount via `cy.mount`, MSW browser worker started in `cypress/support/component.js`. Per-test overrides with `worker.use(...)`.
- **Cypress e2e** — auth, workspace isolation, cross-page flows (search → detail → tag → sample create), design → submit-to-db → listings update, file upload. Hits the real backend; no MSW.

## Tooling to add

- `msw` as a dev dep.
- A `cypress/support/msw.js` that exports `worker` and `handlers`.
- A backend-lifecycle hook in `cypress.config.js`'s e2e `setupNodeEvents` that spawns `uvicorn opencloning_db.api:app`, waits on `GET /openapi.json`, exposes `cy.task('db:reset')`, kills on shutdown. Needs a small Python wrapper (either added to `OpenCloning_backend/scripts/dev_server.py` or kept in the frontend under `scripts/`) because `Config` env-var wiring doesn't currently expose `database_url`/`sequence_files_dir`/`sequencing_files_dir`.
- A vitest `opencloningdb` project in `vitest.config.js` covering `apps/opencloningdb/src/utils/**` and `packages/opencloningdb/src/**/*.test.js`, with a shared MSW server in a setup file.

## Request validation with MSW

Three levels, mix per test:

1. **Inline** — `expect(await request.json()).toMatchObject({...})` inside a per-test handler.
2. **Recorder** — attach `server.events.on('request:start', ...)` to capture `{ method, url, body }` and assert ordered sequences afterwards (emulates the queue pattern in `packages/opencloning-elabftw/src/eLabFTWInterface.test.js` without hand-authoring responses).
3. **Schema (optional)** — once `openapi.json` is pinned, wrap handlers with an Ajv validator compiled from the operation's `requestBody` schema to auto-fail on contract drift.

## Anti-patterns

- Hand-authoring large response payloads when the real backend can serve them. Prefer boot-real-backend + `worker.use(...)` for the one edge case.
- `vi.mock`-ing modules from `packages/opencloningdb/src/common.js` to stub `openCloningDBHttpClient`. Use MSW instead — same contract, one mechanism across Vitest and Cypress.
- Sharing fixture data by importing JSON into both component and e2e specs; e2e must observe the real backend.

---

## Example 1 — Unit test (Vitest + MSW) for `submitPrimerToDatabase`

Target: `packages/opencloningdb/src/OpenCloningDBInterface.js`. Demonstrates response mocking *and* request-body assertion.

```js
// packages/opencloningdb/src/OpenCloningDBInterface.test.js
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
```

Notes:
- `baseUrl` comes from `packages/opencloningdb/src/common.js` (`http://localhost:8001`), which is what axios is configured with — MSW must match the same absolute URL.
- `onUnhandledRequest: 'error'` catches accidental real-network calls in unit tests.

## Example 2 — Component test (Cypress + MSW) for `PrimerSelect.jsx`

Target: `packages/opencloningdb/src/PrimerSelect.jsx`. Covers happy path, selection callback, error state, and `filterDatabaseIds` filtering.

```jsx
// packages/opencloningdb/src/PrimerSelect.cy.jsx
import React from 'react';
import { http, HttpResponse } from 'msw';
import PrimerSelect from './PrimerSelect';
import { baseUrl } from './common';

const primersResponse = {
  items: [
    { id: 1, name: 'fwd-1' },
    { id: 2, name: 'rev-1' },
    { id: 3, name: 'seq-1' },
  ],
  total: 3,
  page: 1,
  size: 100,
};

describe('<PrimerSelect />', () => {
  it('loads primers and reports selection', () => {
    cy.mswUse(
      http.get(`${baseUrl}/primers`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('page')).to.eq('1');
        expect(url.searchParams.get('size')).to.eq('100');
        return HttpResponse.json(primersResponse);
      }),
    );
    const setPrimer = cy.spy().as('setPrimer');

    cy.mount(<PrimerSelect setPrimer={setPrimer} />);

    cy.get('.MuiInputBase-root').click();
    cy.get('div[role="presentation"]').contains('1 - fwd-1');
    cy.get('div[role="presentation"]').contains('2 - rev-1').click();
    cy.get('@setPrimer').should('have.been.calledWith', { id: 2, name: 'rev-1' });
  });

  it('excludes primers listed in filterDatabaseIds', () => {
    cy.mswUse(http.get(`${baseUrl}/primers`, () => HttpResponse.json(primersResponse)));

    cy.mount(<PrimerSelect setPrimer={() => {}} filterDatabaseIds={[1, 3]} />);

    cy.get('.MuiInputBase-root').click();
    cy.get('div[role="presentation"]').contains('1 - fwd-1').should('not.exist');
    cy.get('div[role="presentation"]').contains('3 - seq-1').should('not.exist');
    cy.get('div[role="presentation"]').contains('2 - rev-1').should('exist');
  });

  it('shows the retry alert on server error', () => {
    cy.mswUse(
      http.get(`${baseUrl}/primers`, () => HttpResponse.json({ detail: 'boom' }, { status: 500 })),
    );

    cy.mount(<PrimerSelect setPrimer={() => {}} />);
    cy.get('.MuiAlert-message').contains('Could not retrieve primers from OpenCloningDB');
    cy.get('button').contains('Retry').should('exist');
  });
});
```

Assumed support-file additions (to be implemented later):

```js
// cypress/support/component.js — additions
import { setupWorker } from 'msw/browser';
export const worker = setupWorker();
before(() => worker.start({ onUnhandledRequest: 'bypass' }));
Cypress.Commands.add('mswUse', (...handlers) => worker.use(...handlers));
afterEach(() => worker.resetHandlers());
```

Notes:
- No Redux `Provider` needed for `PrimerSelect` because it doesn't use `useSelector`; the existing `cy.mount` wrapper still works (it just wraps in `Provider` with the default store — harmless).
- The `request` argument inside MSW handlers is a fetch `Request`; `new URL(request.url)` gives the full URL including axios's `paramsSerializer` output, so search-param assertions stay meaningful.

## Example 3 — E2E test (Cypress against real backend) for login

Target: the flow in `apps/opencloningdb/src/pages/LoginPage.jsx`. Assumes `cypress.config.js` is updated to (a) boot the backend + seed via `init_db` in `setupNodeEvents`, (b) boot vite for `apps/opencloningdb` on `:3002`, (c) override `baseUrl` to `http://localhost:3002` for this spec folder. The seeded user (see `OpenCloning_backend/packages/opencloning-db/src/opencloning_db/init_db.py`) is `bootstrap@example.com` / `password`.

```js
// cypress/e2e/group-opencloningdb/login.cy.js
describe('opencloningdb login', () => {
  beforeEach(() => {
    cy.task('db:reset');
    cy.visit('/login');
  });

  it('rejects wrong credentials', () => {
    cy.get('input[type="email"]').type('bootstrap@example.com');
    cy.get('input[type="password"]').type('wrong-password');
    cy.get('button[type="submit"]').click();
    cy.get('.MuiAlert-message').should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('logs in the bootstrap user and lands on /sequences', () => {
    cy.get('input[type="email"]').type('bootstrap@example.com');
    cy.get('input[type="password"]').type('password');
    cy.get('button[type="submit"]').click();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/sequences');
    cy.contains('Sequences').should('be.visible');
    cy.window().its('localStorage').invoke('getItem', 'token').should('not.be.null');
  });

  it('redirects anonymous visits to /login', () => {
    cy.clearLocalStorage();
    cy.visit('/sequences');
    cy.location('pathname').should('eq', '/login');
  });
});
```

Notes:
- Uses the existing seeded account only — no custom user creation needed for this test.
- `cy.task('db:reset')` is what the e2e `setupNodeEvents` exposes; it re-runs `init_db` against the temp SQLite DB.

---

## Concrete next steps (tracked here until real test files land)

- [ ] Add `msw` dev dependency at the workspace root; add `msw` browser worker script to `cypress/support/`.
- [ ] Extend `cypress/support/component.js` with MSW `worker` + `cy.mswUse` + reset hook.
- [ ] Add an `opencloningdb` project to `vitest.config.js`; create a shared `tests/msw.node.js` setup with `setupServer()`.
- [ ] Write the three reference tests above as real files (one of each).
- [ ] Add backend-lifecycle to `cypress.config.js` e2e (`setupNodeEvents`): spawn uvicorn, seed, wait on `/openapi.json`, expose `db:reset`, kill on shutdown. Requires either env-var plumbing in `OpenCloning_backend/.../config.py` or a small Python wrapper script.
- [ ] Add `cypress/e2e/group-opencloningdb/` to the suite; configure per-group baseUrl override to `http://localhost:3002`.
