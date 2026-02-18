# Phase 1 Smoke Check Commands (Manual)

Run these manually after dependencies are installed:

1. `npm run build:electron`
2. `npm run dev`
3. `npm run build`
4. `npm run package:dir`
5. `npm run package`
6. `npm run build && npm run start:prod`

Notes:
- The agent does not execute `dev`, `start:prod`, or packaging commands automatically.
- Validate packaged output does not contain: `**/*.test.*`, `**/*.spec.*`, `**/__tests__/**`, `**/tests/**`, `.planning/**`.
