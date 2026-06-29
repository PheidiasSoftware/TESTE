# Project memory - 2026-06-29 - CI environment alignment

## Initial repository review

Before changing anything, the repository was reexamined as requested.

Reviewed files and state:

- `README.md`: confirms the project is a lightweight local code LLM backend for weak Windows PCs with 8 GB RAM and no GPU, using Node.js 20+ and Ollama by default.
- `package.json`: confirms no external runtime dependencies and scripts for `npm start`, `npm test`, `npm run start:windows` and `npm run test:windows`.
- `.github/workflows/node-test.yml`: CI runs `npm test` on Node.js 20 for push, pull request and manual dispatch.
- `docs/backend-mvp-status.md`: MVP is functionally ready, but final validation by `npm test`, `npm run test:windows` or green CI remains the main pending item.
- `docs/local-validation.md`: documents offline validation, Windows helper and CI criteria.
- `src/server.js`: server already uses extracted modules for cache, queue, HTTP helpers, logger, Ollama client, project-file reading and rate limiting.
- `src/config.js`: confirms defaults for conservative local operation.
- `scripts/test-windows.ps1`: Windows offline validation sets conservative defaults including rate limit, trust proxy and silent logs.

Repository/agent checks:

- Recent PR query returned no pull requests.
- Text search did not return clear Claude Agent records.
- Local checkout attempt was blocked by the execution environment, so `npm test` could not be run locally in this automation run.

## Decision

Because the current blocker is validation evidence and `src/server.js` is already high-responsibility, no backend refactor was attempted.

The safe incremental improvement was to align the GitHub Actions offline test environment with the Windows offline validation helper. This reduces differences between CI and local Windows validation without adding dependencies, changing runtime behavior or touching user-code execution.

## Files changed

- `.github/workflows/node-test.yml`
  - Added CI environment variables already used by the Windows helper:
    - `ENABLE_RATE_LIMIT=true`
    - `RATE_LIMIT_WINDOW_MS=60000`
    - `RATE_LIMIT_MAX_REQUESTS=30`
    - `RATE_LIMIT_MAX_CLIENTS=500`
    - `TRUST_PROXY=false`
    - `LOG_LEVEL=silent`
- `docs/backend-mvp-status.md`
  - Recorded this execution, files reviewed, decision, CI alignment and remaining validation pending.
- `PROJECT_MEMORY_RUN_2026-06-29_CI_ENV_ALIGNMENT.md`
  - This memory file.

## Validation executed

- GitHub connector file reads and repository metadata checks.
- No local `npm test` execution was possible because local checkout was blocked by the environment.
- CI should run on the pushed workflow/documentation commits; green status still needs confirmation in a later run.

## Risks

- The workflow change is low risk because it only sets explicit environment variables to existing conservative defaults.
- The latest commit still needs objective validation by CI or local test run.
- Avoid further `src/server.js` changes until tests are confirmed.

## Next steps

1. Confirm GitHub Actions status for the latest commit.
2. If CI is green, update `docs/backend-mvp-status.md` and `docs/mvp-readiness-review.md` to mark backend MVP validation complete.
3. If CI is missing or failed, inspect workflow status/logs before changing backend code.
4. Only after validation, consider a small extraction of routing/handlers from `src/server.js` as post-MVP hardening.

## Claude Agent compatibility

No clear Claude Agent records, branches, PRs, issues or state files were found in this run. Future agents should preserve the current conservative backend direction and avoid unsafe automatic code execution.
