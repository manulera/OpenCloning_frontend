[![Python tests](https://github.com/manulera/OpenCloning_frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/manulera/OpenCloning_frontend/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/manulera/OpenCloning_frontend/graph/badge.svg?token=CFIB2H6WMO)](https://codecov.io/gh/manulera/OpenCloning_frontend)


# OpenCloning frontend

This frontend React application is part of a bigger application, before going further, please go to the [main project README](https://github.com/manulera/OpenCloning?tab=readme-ov-file#readme), where you can find an introduction.

A hosted version of this application can be found at [https://opencloning.org/](https://opencloning.org/).

## Getting started

If you want to quickly set up a local instance of the frontend and backend of the application using Docker, check [getting started in 5 minutes](https://github.com/manulera/OpenCloning#timer_clock-getting-started-in-5-minutes) in the main repository.

## Running the site locally

We use node 22.17, to manage different versions of node, we use `nvm`. Installation instructions [here](https://github.com/nvm-sh/nvm#installing-and-updating).

```bash
# Install node 22.17 (first time only)
nvm install 22.17
# Activate node 22.17
nvm use 22.17
```

To handle dependencies and build the site, [yarn 3](https://v3.yarnpkg.com/) is used.

```bash
# Enable yarn 3 in the project (first time only)
corepack enable

# Install dependencies (every time you pull changes)
yarn install

# If you want to serve the development site locally at http://localhost:3000/
yarn start
# If you want to build the statics assets of the production site in the folder ./build
yarn build
```

## Connecting to the backend

For the application to work, you must have a running backend. For that, see the [backend installation instructions](https://github.com/manulera/OpenCloning_backend#local-installation).

By default, if you run the dev server with `uvicorn opencloning.main:app`, the backend will be running at `http://localhost:8000/`. That's where the dev server of the frontend (ran with `yarn start`) will send the requests to by default.

The backend URL can be changed by setting a different value in the `config.json` (see next section).

See also [connecting to the frontend section](https://github.com/manulera/OpenCloning_backend?tab=readme-ov-file#connecting-to-the-frontend) in the backend repo.

## Configuration

The configuration of the frontend is done in the file that will be served from `/config.json`. In the dev server, this file is served from `public/config.json`. That file is not included in the repository, and is generated from `public/config.dev.json` when you run `yarn start`. For the production site, `config.prod.json` is used. The things you can configure are:

* `backendUrl`: The URL of the backend. By default, it is `http://localhost:8000/`.
* `showAppBar`: Whether to show the top app bar (blue with buttons for examples, etc.). By default, it is `true`.
* `noExternalRequests`: Whether to block requests to external services. By default, it is `false`.
* `database`: For integrations, provide the database name. This is not documented, but for an example see `src/components/eLabFTW`.

For production: when building the site with `yarn build`, simply replace `build/config.json` with your settings. This is what is done in [this docker-compose file](https://github.com/manulera/OpenCloning).

## Running with docker 🐳

If you want to serve the full site (backend and frontend) with docker, check [getting started in 5 minutes](https://github.com/manulera/OpenCloning#timer_clock-getting-started-in-5-minutes) in the main repository.

If you want to serve only the frontend from a docker container, an image is available at [manulera/opencloningfrontend](https://hub.docker.com/r/manulera/opencloningfrontend). The image is built from the Dockerfile in the root of this repository and exposes the port 3000. To run it:

```bash
docker pull manulera/opencloningfrontend
docker run -p 3000:3000 manulera/opencloningfrontend
```

## Contributing :hammer_and_wrench:

Check [contribution guidelines in the main repository](https://github.com/manulera/OpenCloning/blob/master/CONTRIBUTING.md).

## Settings for vscode :desktop_computer:

For the `eslint` to work, you will need the [eslint module](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

## Tests

### End to end tests

To run the tests, first run the dev server with `yarn start`.

To run most tests, you will need the backend to be running at http://localhost:8000/. You can see how to do run it in the [backend repo](https://github.com/manulera/OpenCloning_backend). For the github actions tests, a submodule is used (see below).

To run the tests:

```bash
# Open cypress UI
yarn cypress open

# Run a particular test in the command line
yarn cypress run --spec cypress/e2e/source_genome_region.cy.js

# Run a few tests in parallel from the command line (edit file if needed)
bash run_tests_in_parallel.sh
# If the tests fail, you can see screenshots of the failed tests in the folder cypress/screenshots

```

### Component tests

For these, you don't have to run the `yarn start` command, but you need the backend server as above. To run them:

```bash
yarn cypress open
```

### Unit tests

These are run with `vitest`. To run them:

```bash
yarn vitest
```

### Actions and submodule

The tests run with cypress in github actions require the submodule OpenCloning_backend to be included. If you want to include it locally:

```bash
git submodule update --init
```

If you want to change the commit of the submodule:

```bash
cd OpenCloning_backend
git checkout -b the-branch
git pull origin the-branch
cd ..
# commit the frontend repo normally
```

### Coverage

To update which files are excluded from coverage, edit the `.nycrc.json` file.

## Misc

### Web analytics

You can configure website analytics using umami by setting the env var `VITE_UMAMI_WEBSITE_ID` to the website id. When building the site, the analytics script will be included in the build. See `index.html` and `vite.config.js` to see how this is done (using ejs templating).

### Recording video with cypress

Settings (they can also be set as env vars or passed with flags).

```javascript
module.exports = defineConfig({
  video: true,
  viewportWidth: 1000,
  viewportHeight: 1000,
  ...
```

Then, when running the video.
```
CYPRESS_NO_COMMAND_LOG=1 yarn cypress run --spec cypress/e2e/source_genome_region.cy.js
```

### eLabFTW

The API keys should be in the ignored file `.env.local`

Example file:

```bash
VITE_ELABFTW_BASE_URL=https://localhost
VITE_ELABFTW_API_READ_KEY=<key>
VITE_ELABFTW_API_WRITE_KEY=<key>
```

To build the image for local testing:

```bash
docker build -t manulera/opencloningfrontend:local --build-arg BASE_URL=/opencloning/ .
```

### Running scripts

> There is probably a better way to do this, but this is what I have found for now.

It can be useful to run scripts to test a few things without running the whole frontend. The only way I have found to do this is running the script as a test.

* Create file with pattern `script.test.js`
* Run `yarn vitest run script.test.js`

The file content should be something like this:

```javascript
import { ab1ToJson } from '@teselagen/bio-parsers';
import fs from 'fs';

describe('ab1ToJson', () => {
  it('should convert an AB1 file to JSON', () => {
    const a = 1;
    console.log(a);
  });
});
```

### Updating transitive dependencies

```
npx -y yarn-update-indirect form-data
```

## Publishing to npm

Currently relies on the patch in `.yarn/patches/@changesets-cli-npm-2.29.8-52df46efd2.patch` to publish to npm, coming from this [PR](https://github.com/adobe/spectrum-web-components/pull/5821/files). It's pending on the resolution of this [other PR](https://github.com/changesets/changesets/pull/674).

```
YARN_NPM_AUTH_TOKEN=<> yarn changeset publish
```

### Releasing a pre-release

```
yarn pre:enter
# make changes
# Create changeset
yarn release
```

