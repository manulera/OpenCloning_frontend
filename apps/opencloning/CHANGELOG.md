# opencloning

## 1.2.2

### Patch Changes

- Updated dependencies [[`b9b821d`](https://github.com/manulera/OpenCloning_frontend/commit/b9b821d562417b85b69dbf53ddaac324474d4e6b)]:
  - @opencloning/ui@1.3.1
  - @opencloning/store@1.3.1
  - @opencloning/utils@1.3.1

## 1.2.1

### Patch Changes

- Updated dependencies [[`d5a456d`](https://github.com/manulera/OpenCloning_frontend/commit/d5a456d70ccfe949b21aae260d2c99507ff6a88e)]:
  - @opencloning/store@1.3.0
  - @opencloning/utils@1.3.0
  - @opencloning/ui@1.3.0

## 1.2.0

### Minor Changes

- [#595](https://github.com/manulera/OpenCloning_frontend/pull/595) [`1b28cc5`](https://github.com/manulera/OpenCloning_frontend/commit/1b28cc5852460a072982dc529b58fc9607fae21f) Thanks [@manulera](https://github.com/manulera)! - Minor improvements and bug fixes:

  - include name of tracks in alignment + update ove to display correct Track Properties table
  - fix display main sequence when alignments are present
  - change default minimum hib length to 14 for primer design
  - Gibson primer design: default to circular assembly, force circular for single input assemblies
  - Gibson primer design: make product sequence preview circular when assembly is circular
  - Primer design: in circular assemblies of one fragment only, display the spacer before the fragment in the preview.

### Patch Changes

- Updated dependencies [[`1b28cc5`](https://github.com/manulera/OpenCloning_frontend/commit/1b28cc5852460a072982dc529b58fc9607fae21f)]:
  - @opencloning/ui@1.2.0
  - @opencloning/store@1.2.0
  - @opencloning/utils@1.2.0

## 1.1.2

### Patch Changes

- [#592](https://github.com/manulera/OpenCloning_frontend/pull/592) [`57092ae`](https://github.com/manulera/OpenCloning_frontend/commit/57092ae54d96485e84191d6c20ade9e9a6838a65) Thanks [@manulera](https://github.com/manulera)! - Remove partial overlap option from restriction and ligation overlap, related to https://github.com/manulera/OpenCloning_backend/pull/389

- Updated dependencies [[`57092ae`](https://github.com/manulera/OpenCloning_frontend/commit/57092ae54d96485e84191d6c20ade9e9a6838a65)]:
  - @opencloning/ui@1.1.2
  - @opencloning/store@1.1.2
  - @opencloning/utils@1.1.2

## 1.1.1

### Patch Changes

- Updated dependencies [[`81bcca3`](https://github.com/manulera/OpenCloning_frontend/commit/81bcca3c4a38e32793dab1cc60862f8ae61b3bb9)]:
  - @opencloning/ui@1.1.1
  - @opencloning/store@1.1.1
  - @opencloning/utils@1.1.1

## 1.1.0

### Minor Changes

- [#570](https://github.com/manulera/OpenCloning_frontend/pull/570) [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0) Thanks [@manulera](https://github.com/manulera)! - Switch to using provider for configuration rather than state

- [#570](https://github.com/manulera/OpenCloning_frontend/pull/570) [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0) Thanks [@manulera](https://github.com/manulera)! - Handle version display with scripts

### Patch Changes

- [#574](https://github.com/manulera/OpenCloning_frontend/pull/574) [`6df1c20`](https://github.com/manulera/OpenCloning_frontend/commit/6df1c2060d5776a30a00daaedfb0ec2cc685284d) Thanks [@manulera](https://github.com/manulera)! - Last dummy test to check if auto pre-release works

- [#570](https://github.com/manulera/OpenCloning_frontend/pull/570) [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0) Thanks [@manulera](https://github.com/manulera)! - testing a test release to npm

- [#570](https://github.com/manulera/OpenCloning_frontend/pull/570) [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0) Thanks [@manulera](https://github.com/manulera)! - Releases work on npm now through `YARN_NPM_AUTH_TOKEN=<> yarn changeset publish`, this is enabled by patch, see Readme. This properly handles workspaces (in package.json in each of the packages, `"@opencloning/store": "workspace:*",` is replaced by the actual version).

- Updated dependencies [[`6df1c20`](https://github.com/manulera/OpenCloning_frontend/commit/6df1c2060d5776a30a00daaedfb0ec2cc685284d), [`07106ac`](https://github.com/manulera/OpenCloning_frontend/commit/07106ac0c8f9321d0b33994ed086a76eb79739a3), [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0), [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0), [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0), [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0), [`83dab1c`](https://github.com/manulera/OpenCloning_frontend/commit/83dab1c2a7cca2b17aa8039b74d15c47e467b2f0)]:
  - @opencloning/store@1.1.0
  - @opencloning/ui@1.1.0
  - @opencloning/utils@1.1.0

## 1.1.0-dev.5

### Patch Changes

- 6df1c20: Last dummy test to check if auto pre-release works
- Updated dependencies [6df1c20]
  - @opencloning/store@1.1.0-dev.5
  - @opencloning/ui@1.1.0-dev.5
  - @opencloning/utils@1.1.0-dev.5

## 1.1.0-dev.4

### Patch Changes

- Updated dependencies [07106ac]
  - @opencloning/ui@1.1.0-dev.4
  - @opencloning/store@1.1.0-dev.4
  - @opencloning/utils@1.1.0-dev.4

## 1.1.0-test.3

### Patch Changes

- Updated dependencies [a870a5e]
  - @opencloning/ui@1.1.0-test.3
  - @opencloning/store@1.1.0-test.3
  - @opencloning/utils@1.1.0-test.3

## 1.1.0-test.2

### Minor Changes

- d46f09d: Handle version display with scripts

### Patch Changes

- Updated dependencies [d46f09d]
  - @opencloning/store@1.1.0-test.2
  - @opencloning/utils@1.1.0-test.2
  - @opencloning/ui@1.1.0-test.2

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
