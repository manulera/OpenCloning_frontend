---
"opencloning": patch
"@opencloning/store": patch
"@opencloning/utils": patch
"@opencloning/ui": patch
---

Releases work on npm now through `YARN_NPM_AUTH_TOKEN=<> yarn changeset publish`, this is enabled by patch, see Readme. This properly handles workspaces (in package.json in each of the packages, `"@opencloning/store": "workspace:*",` is replaced by the actual version).

