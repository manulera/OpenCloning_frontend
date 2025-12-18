# @opencloning/store

## 1.1.1

## 1.1.0

### Minor Changes

- [#570](https://github.com/manulera/OpenCloning_frontend/pull/570) [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0) Thanks [@manulera](https://github.com/manulera)! - Switch to using provider for configuration rather than state

- [#570](https://github.com/manulera/OpenCloning_frontend/pull/570) [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0) Thanks [@manulera](https://github.com/manulera)! - Handle version display with scripts

### Patch Changes

- [#574](https://github.com/manulera/OpenCloning_frontend/pull/574) [`6df1c20`](https://github.com/manulera/OpenCloning_frontend/commit/6df1c2060d5776a30a00daaedfb0ec2cc685284d) Thanks [@manulera](https://github.com/manulera)! - Last dummy test to check if auto pre-release works

- [#570](https://github.com/manulera/OpenCloning_frontend/pull/570) [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0) Thanks [@manulera](https://github.com/manulera)! - testing a test release to npm

- [#570](https://github.com/manulera/OpenCloning_frontend/pull/570) [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0) Thanks [@manulera](https://github.com/manulera)! - Releases work on npm now through `YARN_NPM_AUTH_TOKEN=<> yarn changeset publish`, this is enabled by patch, see Readme. This properly handles workspaces (in package.json in each of the packages, `"@opencloning/store": "workspace:*",` is replaced by the actual version).

## 1.1.0-dev.5

### Patch Changes

- 6df1c20: Last dummy test to check if auto pre-release works

## 1.1.0-dev.4

## 1.1.0-test.3

## 1.1.0-test.2

### Minor Changes

- d46f09d: Handle version display with scripts

## 1.1.0-test.1

### Minor Changes

- 02dbc55: Switch to using provider for configuration rather than state

## 1.0.2-test.0

### Patch Changes

- testing a test release to npm
- e0fb5ee: Releases work on npm now through `YARN_NPM_AUTH_TOKEN=<> yarn changeset publish`, this is enabled by patch, see Readme. This properly handles workspaces (in package.json in each of the packages, `"@opencloning/store": "workspace:*",` is replaced by the actual version).

## 1.0.1

### Patch Changes

- a072fee: Dummy change to test releasing

## 1.0.0

### Major Changes

- babe2f9: Switch to monorepo structure and use changesets

### Minor Changes

- 8cd33bb: Rearrange dependencies
