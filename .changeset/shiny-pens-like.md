---
"opencloning": minor
"@opencloning/ui": minor
---

Adds functionality to load files (sequences and syntaxes) from a local public folder, providing an alternative to uploading files manually. The implementation enables users to pre-configure collections of sequences and syntaxes that can be easily selected through a UI.

**Changes:**
- Added `useRequestForEffect` hook for managing async requests with retry capability
- Added `useServerStaticFiles` hook for fetching and managing local file collections
- Added `ServerStaticFileSelect` component for selecting files from the local collection with category filtering
- Added `SourceServerStaticFile` component and integrated it into the source selection flow
- Added local file loading capability to the assembler's plasmid uploader and syntax loader
- Configured build system to copy example collection folder to public directory during development
- Added comprehensive test coverage for all new components and functionality

