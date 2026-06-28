# Project memory - HTTP server integration

Date/time: 2026-06-28 19:37 America/Sao_Paulo

## Initial repository assessment

Files and areas inspected before changes:

- `README.md`: confirms backend scope for local code LLM/SLM on weak Windows PC, 8 GB RAM and no GPU; documents endpoints, environment variables, tests, CI and technical guides.
- `package.json`: Node.js 20+, ESM, no external runtime dependencies, scripts for `start`, `start:windows`, `dev` and `test`.
- `src/server.js`: current central backend file. It already used `src/cache.js`, `src/config.js`, `src/ollama.js` and `src/rate-limit.js`, but still duplicated local HTTP helpers for JSON responses, SSE and request-body parsing.
- `src/http.js`: existing tested HTTP helper module with `sendJson`, `sendServerEvent`, `openEventStream` and hardened `readJsonBody` supporting `maxBodyBytes`.
- `test/http.test.js`: confirms expected helper behavior, including JSON response headers, SSE formatting, event stream headers, invalid JSON and oversized payload rejection.
- `docs/backend-mvp-status.md`: listed HTTP helper integration as the next safe modularization task.

No Claude Agent-specific branch, issue, PR, state file or conflicting instruction was found through the available repository inspection in this run. Existing project memory/status files were treated as the source of pending work.

## Decision taken

The safest incremental backend task was to integrate `src/http.js` into `src/server.js` instead of adding new features.

Reasoning:

- This reduces duplication in a critical server file.
- It reuses an already tested helper module.
- It preserves the public API contract and conservative memory/runtime behavior.
- It avoids adding dependencies or changing model execution behavior.

## Files changed

- `src/server.js`
  - Imported `sendJson`, `sendServerEvent`, `openEventStream` and `readJsonBody` from `src/http.js`.
  - Removed duplicated local implementations of JSON response, SSE response and raw JSON body parsing.
  - Kept a small local wrapper so the server still applies `MAX_BODY_BYTES` from `src/config.js`.
  - Preserved routes, payload shape, status responses, cache behavior, rate limit behavior and Ollama calls.

- `docs/backend-mvp-status.md`
  - Registered that `src/http.js` is now integrated into the server.
  - Updated partially completed criteria and next recommended tasks.

- `PROJECT_MEMORY_RUN_2026-06-28_HTTP_SERVER_INTEGRATION.md`
  - Added this run memory.

## Validation performed

- Re-read updated `src/server.js` after the commit to confirm imports, wrapper and route tail are present.
- Confirmed `src/http.js` already has tests for the helper behavior being reused.

## Validation not performed

- `npm test` was not executed in this run because the GitHub connector does not provide a local test execution environment.
- GitHub Actions status was not confirmed for the newest commits during this run.

## Risks

- `src/server.js` is still large and centralizes routing, generation queue and safe project file reading.
- The integration should be low-risk because helper behavior is already tested, but final confidence still requires `npm test` or CI.

## Next safe steps

1. Validate `npm test` locally or confirm CI after the latest commits.
2. Extract `createGenerationQueue` from `src/server.js` into `src/generation-queue.js` with isolated tests.
3. Extract safe project file reading from `src/server.js` into `src/project-files.js` with isolated tests.
4. Reassess backend MVP completeness after those modularization steps.
