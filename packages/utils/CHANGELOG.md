# @opencloning/utils

## 1.3.1

### Patch Changes

- Updated dependencies []:
  - @opencloning/store@1.3.1

## 1.3.0

### Minor Changes

- [#597](https://github.com/manulera/OpenCloning_frontend/pull/597) [`d5a456d`](https://github.com/manulera/OpenCloning_frontend/commit/d5a456d70ccfe949b21aae260d2c99507ff6a88e) Thanks [@manulera](https://github.com/manulera)! - Changes associated with new "Syntax Builder" application for creating and managing modular cloning syntaxes, along with significant refactoring of assembler components to support both the new app and the existing OpenCloning application.

  - Added a new standalone app (`apps/syntax-builder`) for building and editing cloning syntaxes with visual previews
  - Refactored assembler components to be more modular and reusable across applications
  - Enhanced file parsing utilities to support bidirectional conversion between JSON and delimited formats
  - Added graph-based validation and visualization for syntax parts using the graphology library

### Patch Changes

- Updated dependencies [[`d5a456d`](https://github.com/manulera/OpenCloning_frontend/commit/d5a456d70ccfe949b21aae260d2c99507ff6a88e)]:
  - @opencloning/store@1.3.0

## 1.2.0

### Patch Changes

- Updated dependencies []:
  - @opencloning/store@1.2.0

## 1.1.2

### Patch Changes

- Updated dependencies []:
  - @opencloning/store@1.1.2

## 1.1.1

### Patch Changes

- Updated dependencies []:
  - @opencloning/store@1.1.1

## 1.1.0

### Minor Changes

- [#570](https://github.com/manulera/OpenCloning_frontend/pull/570) [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0) Thanks [@manulera](https://github.com/manulera)! - Handle version display with scripts

### Patch Changes

- [#574](https://github.com/manulera/OpenCloning_frontend/pull/574) [`6df1c20`](https://github.com/manulera/OpenCloning_frontend/commit/6df1c2060d5776a30a00daaedfb0ec2cc685284d) Thanks [@manulera](https://github.com/manulera)! - Last dummy test to check if auto pre-release works

- [#570](https://github.com/manulera/OpenCloning_frontend/pull/570) [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0) Thanks [@manulera](https://github.com/manulera)! - testing a test release to npm

- [#570](https://github.com/manulera/OpenCloning_frontend/pull/570) [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0) Thanks [@manulera](https://github.com/manulera)! - Releases work on npm now through `YARN_NPM_AUTH_TOKEN=<> yarn changeset publish`, this is enabled by patch, see Readme. This properly handles workspaces (in package.json in each of the packages, `"@opencloning/store": "workspace:*",` is replaced by the actual version).

- Updated dependencies [[`6df1c20`](https://github.com/manulera/OpenCloning_frontend/commit/6df1c2060d5776a30a00daaedfb0ec2cc685284d), [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0), [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0), [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0), [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0)]:
  - @opencloning/store@1.1.0

## 1.1.0-dev.5

### Patch Changes

- 6df1c20: Last dummy test to check if auto pre-release works
- Updated dependencies [6df1c20]
  - @opencloning/store@1.1.0-dev.5

## 1.1.0-dev.4

### Patch Changes

- @opencloning/store@1.1.0-dev.4

## 1.1.0-test.3

### Patch Changes

- @opencloning/store@1.1.0-test.3

## 1.1.0-test.2

### Minor Changes

- d46f09d: Handle version display with scripts

### Patch Changes

- Updated dependencies [d46f09d]
  - @opencloning/store@1.1.0-test.2

## 1.1.0-test.1

### Patch Changes

- Updated dependencies [02dbc55]
  - @opencloning/store@1.1.0-test.1

## 1.0.2-test.0

### Patch Changes

- testing a test release to npm
- e0fb5ee: Releases work on npm now through `YARN_NPM_AUTH_TOKEN=<> yarn changeset publish`, this is enabled by patch, see Readme. This properly handles workspaces (in package.json in each of the packages, `"@opencloning/store": "workspace:*",` is replaced by the actual version).
- Updated dependencies
- Updated dependencies [e0fb5ee]
  - @opencloning/store@1.0.2-test.0

## 1.0.1

### Patch Changes

- a072fee: Dummy change to test releasing
- Updated dependencies [a072fee]
  - @opencloning/store@1.0.1

## 1.0.0

### Major Changes

- babe2f9: Switch to monorepo structure and use changesets

### Minor Changes

- 8cd33bb: Rearrange dependencies

### Patch Changes

- Updated dependencies [8cd33bb]
- Updated dependencies [babe2f9]
  - @opencloning/store@1.0.0
