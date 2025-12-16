# opencloning

## 1.1.0-test.1

### Minor Changes

- 02dbc55: Switch to using provider for configuration rather than state

### Patch Changes

- Updated dependencies [02dbc55]
  - @opencloning/store@1.1.0-test.1
  - @opencloning/ui@1.1.0-test.1
  - @opencloning/utils@1.1.0-test.1

## 1.0.2-test.0

### Patch Changes

- testing a test release to npm
- e0fb5ee: Releases work on npm now through `YARN_NPM_AUTH_TOKEN=<> yarn changeset publish`, this is enabled by patch, see Readme. This properly handles workspaces (in package.json in each of the packages, `"@opencloning/store": "workspace:*",` is replaced by the actual version).
- Updated dependencies
- Updated dependencies [e0fb5ee]
  - @opencloning/store@1.0.2-test.0
  - @opencloning/utils@1.0.2-test.0
  - @opencloning/ui@1.0.2-test.0

## 1.0.1

### Patch Changes

- a072fee: Dummy change to test releasing
- Updated dependencies [a072fee]
  - @opencloning/store@1.0.1
  - @opencloning/utils@1.0.1
  - @opencloning/ui@1.0.1

## 1.0.0

### Major Changes

- babe2f9: Switch to monorepo structure and use changesets

### Minor Changes

- 8cd33bb: Rearrange dependencies

### Patch Changes

- Updated dependencies [8cd33bb]
- Updated dependencies [babe2f9]
  - @opencloning/store@1.0.0
  - @opencloning/utils@1.0.0
  - @opencloning/ui@1.0.0
