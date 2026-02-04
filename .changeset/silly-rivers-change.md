---
"@opencloning/store": minor
"@opencloning/utils": minor
"@opencloning/ui": minor
---

Changes associated with new "Syntax Builder" application for creating and managing modular cloning syntaxes, along with significant refactoring of assembler components to support both the new app and the existing OpenCloning application.

- Added a new standalone app (`apps/syntax-builder`) for building and editing cloning syntaxes with visual previews
- Refactored assembler components to be more modular and reusable across applications
- Enhanced file parsing utilities to support bidirectional conversion between JSON and delimited formats
- Added graph-based validation and visualization for syntax parts using the graphology library
