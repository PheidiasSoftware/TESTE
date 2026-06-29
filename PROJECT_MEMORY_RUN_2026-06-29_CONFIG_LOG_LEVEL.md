# Project memory

Date: 2026-06-29 11:36 America/Sao_Paulo.

Reviewed before change: README.md, package.json, workflow, scripts, docs, src/config.js, src/logger.js and test/config.test.js.

Decision: small safe backend hardening.

Changed:
- src/config.js normalizes LOG_LEVEL before exposing config.
- test/config.test.js covers supported values and fallback to info.

Validation: changed files were fetched again and reviewed. Local npm test was not executed by this connector run.

Next: confirm npm test, npm run test:windows or CI status before larger server refactors.
