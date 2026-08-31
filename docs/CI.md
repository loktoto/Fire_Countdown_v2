# Continuous integration

Fire Countdown v2 runs the `Source quality` workflow for every pull request and every push to `main`.

## Required check

Repository protection should require this status check before merging:

- `Source quality / Typecheck, lint, format, and test`

The workflow does not enable auto-merge and does not write to the repository. Its token permission is limited to read-only repository contents.

## Validation gates

The job uses Node.js 22 and the committed `package-lock.json`:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run format:check`
5. `npm test -- --runInBand --watch=false`

`CI=true`, serial Jest execution, and disabled watch mode keep test execution deterministic on GitHub-hosted runners.

## Dependency cache and credentials

`actions/setup-node` caches npm's download cache using `package-lock.json` as the dependency key. It does not cache project secrets, application data, `node_modules`, Expo credentials, or SecureStore values. Checkout credentials are not persisted.

Both third-party actions are pinned to full commit SHAs. Update those SHAs only after reviewing the corresponding upstream release.

## Expo Doctor

Expo Doctor is intentionally excluded from the required workflow for now. The SDK 57 dependency set passes all 21 checks locally, but Doctor relies on network-delivered compatibility metadata. Add it only when the command and metadata behavior can be made stable and version-pinned; it must not replace the four source-quality gates above.

## Branch protection setup

After this workflow has completed once, configure the `main` branch ruleset in GitHub to require the status check listed above, require the branch to be up to date before merging, and keep auto-merge disabled unless the repository owner explicitly changes that policy.
