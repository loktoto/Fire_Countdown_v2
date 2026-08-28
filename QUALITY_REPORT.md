# Fire Countdown v2 project overview

**Review date:** 2026-08-28

**Branch reviewed:** `codex/calendar-activity-polish`

**Scope:** Repository-wide product-contract, correctness, persistence, dependency, test, accessibility, and release-readiness review.

**Decision:** **Source integration GO. Public release NO-GO until the P0/P1 gates below are closed and a current production-candidate UAT pass is executed.**

## Executive summary

The current source preserves the locked information architecture (`Home | Calendar | + | Dashboard | Portfolio`), keeps `+` as the Log/default route, and keeps Settings outside the bottom tabs. FIRE outputs remain deterministic TypeScript calculations. The dependency set is aligned to Expo SDK 57, Expo Doctor passes all 21 checks, and all current source-quality gates pass.

This pass hardened the most immediate false-success risks. Store mutations now report persistence failure to callers; financial editors keep drafts open when a write fails; a global accessible notice explains the failure; quote refresh cannot report success before its cache is persisted; and unusable failed/unsupported quotes can no longer displace the last usable quote or blank Portfolio valuation. The visible Dashboard label is also aligned with the locked product contract.

The project is not yet a public release candidate. A corrupt or future snapshot still falls back silently to demo seed data, transaction and recurring-entry currency cannot be edited after creation, milestone return overrides are stored but not applied to milestone ETA, and current-source device UAT/performance evidence is unavailable. These are release gates, not implied completions.

## Current scorecard

| Area                            | Status                                      | Evidence and constraint                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product contract and navigation | Pass                                        | Navigation contract test protects the five locked tabs, Log landing route, Settings exclusion, and visible Dashboard label.                                                                                                         |
| Deterministic FIRE engine       | Pass with product gap                       | Engine suite passes and usable-quote fallback is deterministic. Milestone return-override semantics remain unresolved.                                                                                                              |
| Persistence integrity           | Improved; release gate remains              | Failed writes retain the last persisted snapshot, editors retain drafts, and an app-level alert is shown. Corrupt-snapshot recovery is still silent and non-lossless.                                                               |
| Portfolio resilience            | Pass                                        | Failed/unsupported responses no longer outrank a usable cached quote; manual fallback remains available.                                                                                                                            |
| Dependency alignment            | Pass                                        | Expo Doctor 21/21 and `npm ls --depth=0` pass on the aligned SDK 57 dependency set.                                                                                                                                                 |
| Automated tests                 | Pass                                        | 41 suites / 227 tests, including persistence-failure injection and quote-cache regressions.                                                                                                                                         |
| Coverage                        | Measured, below release ambition            | 75.18% lines overall; 91.69% engine lines; store and UI callback paths are the main gaps.                                                                                                                                           |
| Accessibility                   | Source-level improvements; manual gate open | Persistence notice uses alert/live-region semantics and drafts remain recoverable. Screen-reader and large-text device passes are not current.                                                                                      |
| Performance                     | Unverified on device                        | No speculative performance claims are made without a healthy device profiler run.                                                                                                                                                   |
| Runtime UAT                     | Blocked                                     | `emulator-5554` lacked Android activity/package/window services and became offline after one reboot. No current-source app pass was recorded.                                                                                       |
| Supply chain                    | Conditional risk                            | `npm audit --omit=dev` reports 15 transitive findings: 4 high in Metro's `image-size` chain and 11 moderate in Expo's `xcode -> uuid` chain. npm's complete proposal is a breaking forced downgrade to Expo 46 and was not applied. |

## Work completed in this pass

### Persistence and user trust

- Added a safe-area-aware, dismissible, localized persistence error notice with assertive accessibility semantics.
- Kept transaction, recurring, asset, category, FIRE-plan, milestone, scenario, currency, language, companion, and destination drafts open unless their write succeeds.
- Prevented Calendar from moving to an edited transaction's date when the edit was not persisted.
- Prevented reset success announcements, quote-cache success, and credential success from appearing after a failed snapshot write.
- Added injected-storage-failure tests and editor close/retain regression tests.

### Quote correctness and Portfolio resilience

- Centralized usable quote statuses (`ok`, `delayed`, `stale`, `manual`).
- Made usable cached quotes outrank newer `failed` or `unsupported` responses.
- Filtered unusable quotes out of engine and Portfolio valuation selection.
- Preserved manual valuation when no usable quote exists.
- Added cache, engine, and refresh-persistence regressions.

### Contract, dependencies, and maintainability

- Restored the visible `Dashboard` / `儀表板` label to the locked IA contract.
- Aligned Expo SDK 57 runtime and test packages without `--force` or legacy peer-dependency bypasses.
- Removed the deprecated quote query client in favor of the active bridge/free-market modules already represented by current tests.
- Split the FIRE plan sheets and added the current Money Time / What-if presentation modules already present in the working scope.
- Applied the repository formatter so the committed source passes the same check used by CI.

## Verification matrix

| Check                                              | Result                                                    |
| -------------------------------------------------- | --------------------------------------------------------- |
| `npm run typecheck`                                | Pass                                                      |
| `npm run lint`                                     | Pass                                                      |
| `npm run format:check`                             | Pass                                                      |
| `npm test -- --runInBand --watch=false`            | Pass — 41 suites, 227 tests                               |
| `npm test -- --runInBand --watch=false --coverage` | Pass — 75.18% lines overall, 91.69% engine lines          |
| `npx expo-doctor`                                  | Pass — 21/21                                              |
| `npm ls --depth=0`                                 | Pass                                                      |
| `git diff --check`                                 | Pass                                                      |
| `npm audit --omit=dev --audit-level=moderate`      | Conditional fail — 15 upstream/transitive findings remain |
| Android current-source UAT                         | Blocked by offline/unhealthy emulator; not executed       |
| Native/EAS/store/production build                  | Not run — prohibited by repository instructions           |

## Release gates and prioritized backlog

### P0 — must close before calling the app release-ready

1. **Loss-aware snapshot recovery ([issue #6](https://github.com/loktoto/Fire_Countdown_v2/issues/6)).** Replace silent fallback with schema versioning, raw-payload quarantine/recovery, a localized user decision, and tests proving the original payload cannot be overwritten accidentally.
2. **Current production-candidate UAT ([issue #28](https://github.com/loktoto/Fire_Countdown_v2/issues/28)).** Run cold launch, persistence/relaunch, all five tabs, Log create, Calendar edit/move/archive, Portfolio fallback, Settings/export/reset, offline behavior, screen reader, large text, and reduced motion on healthy Android and iOS targets.
3. **Persistence mutation contract completion ([issue #2](https://github.com/loktoto/Fire_Countdown_v2/issues/2)).** The main false-success surfaces are now covered, but every remaining mutation caller should be audited and failure-injected before closing the issue.

### P1 — required product decisions or structural work

1. **Editable transaction and recurring currency.** Both editors display the saved currency as static text. Decide the deterministic FX/base-currency behavior, then make this user-owned FIRE input editable without treating currencies as 1:1.
2. **Milestone return override semantics ([issue #5](https://github.com/loktoto/Fire_Countdown_v2/issues/5)).** The editor persists `expectedReturnOverride`, but projection/milestone ETA does not consume it. Define and test precedence versus the portfolio-weighted return and scenarios.
3. **Relational, round-trip export ([issue #34](https://github.com/loktoto/Fire_Countdown_v2/issues/34)).** Current CSV/TSV is a human-readable report, not a lossless backup.
4. **Deterministic FX ledger ([issue #36](https://github.com/loktoto/Fire_Countdown_v2/issues/36)).** Required before full multi-currency aggregation or currency-edit promises can be made safely.
5. **View-model boundary cleanup.** `TimeLens` and `FireImpactCard` still read the store directly; move screen-facing data and mutations behind view models/selectors.
6. **Coverage expansion ([issue #31](https://github.com/loktoto/Fire_Countdown_v2/issues/31)).** Prioritize `fireStore`, settings mutation outcomes, modal interactions, quote credentials, and loading/error UI rather than inflating coverage through localization constants.

### P2 — quality and operations

- Capture an on-device performance baseline and regression budget ([issue #32](https://github.com/loktoto/Fire_Countdown_v2/issues/32)).
- Reassess the 15 upstream audit findings when Expo/Metro publish compatible fixes; do not force-downgrade the SDK.
- Add stable Expo Doctor execution to CI only if its network-delivered metadata can be made reliable for required checks.
- Complete release metadata/store readiness ([issue #33](https://github.com/loktoto/Fire_Countdown_v2/issues/33)).

## Historical evidence boundary

`docs/uat/UAT_EXECUTION_REPORT.md` contains useful evidence for its named historical branch, commit, SDK, and emulator only. It is not evidence for this 2026-08-28 integration review. Source tests and the verification matrix above are current; device UAT is explicitly blocked.

## Preservation and provenance

- Source instructions read first: `AGENTS.md`.
- Pre-edit backup: `C:\Users\TOTO\Projects\Fire_Countdown_v2_backups\pm-overview-start-20260827-102509.zip` (296,149,034 bytes; 1,573 entries; outside the repository).
- Existing tracked and untracked work was preserved and reviewed as one integration scope; no reset, destructive cleanup, native build, or EAS build was performed.
- Product/architecture audit completed with a delegated agent. Three additional delegated Luna audit attempts hit their model usage limit; the primary agent independently ran the full automated and dependency gates above.
