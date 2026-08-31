# Fire Countdown v2 project overview

**Review date:** 2026-08-29 to 2026-08-31

**Branch reviewed:** `codex/calendar-activity-polish`

**Scope:** Repository-wide product-contract, correctness, persistence, dependency, test, accessibility, security, and release-readiness review.

**Decision:** **Source integration GO. Focused Android UAT GO. Public release NO-GO until the remaining cross-platform, accessibility, performance, and product gates below are closed.**

## Executive summary

The current source preserves the locked information architecture (`Home | Calendar | + | Dashboard | Portfolio`), keeps `+` as the Log/default route, and keeps Settings outside the bottom tabs. FIRE outputs remain deterministic TypeScript calculations. The project is aligned to Expo SDK 57, Expo Doctor passes all 21 checks, and the complete automated suite passes.

The highest-risk source gaps found in this review are now hardened. Persistence failures retain the last saved state and keep editor drafts open; failed/unsupported quotes cannot displace a usable cached or manual valuation; and the visible Dashboard label matches the locked product contract. Persisted snapshots now use an explicit schema-`1` envelope, migrate supported legacy data only after a complete write, retain malformed or unsupported raw data, block mutations during recovery, and present localized export/reset actions. Empty stored values are treated as corruption rather than a first run.

Projection assumptions now use one finite, deterministic normalization contract across the engine, Dashboard, What-if flow, and FIRE-plan sheets. Expo/Metro patch alignment removed the four high-severity `image-size` audit findings without a forced downgrade. Eleven moderate transitive `uuid` findings remain through Expo's `xcode` tooling chain; npm's forced proposal would install the incompatible `expo-sharing@14.0.8` and was not applied.

This is not a public release candidate. A healthy API-36 emulator follow-up closed the focused Android cold-launch, process-death persistence, Dashboard render, online/offline quote fallback, malformed-snapshot recovery, and lossless test-snapshot restoration checks. It does not replace the remaining current-source matrix: iOS, screen reader, large text, reduced motion, OS recovery sharing/destructive reset, storage-exhaustion failure, and on-device performance are still open. Transaction/recurring currency editability also needs deterministic FX semantics, milestone return-override behavior is unresolved, and the current CSV/TSV export is not a lossless backup.

## Current scorecard

| Area                            | Status                                | Evidence and constraint                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product contract and navigation | Pass                                  | Contract tests protect the five locked tabs, Log landing route, Settings exclusion, and visible Dashboard label.                                                                                           |
| Deterministic FIRE engine       | Pass with product gap                 | Shared assumption bounds prevent display/engine drift and non-finite output. Milestone return-override semantics remain unresolved.                                                                        |
| Persistence integrity           | Source and focused Android pass       | Process-death persistence, malformed-snapshot blocking recovery, and lossless test-snapshot restoration passed on API 36. iOS and storage-exhaustion device paths remain open.                             |
| Portfolio resilience            | Pass                                  | Failed/unsupported responses do not outrank a usable cached quote; manual fallback remains available.                                                                                                      |
| Dependency alignment            | Pass with accepted upstream risk      | Expo Doctor 21/21 passes. Metro is aligned where supported; 11 moderate transitive `uuid` audit findings remain.                                                                                           |
| Automated tests                 | Pass                                  | 42 suites / 243 tests.                                                                                                                                                                                     |
| Coverage                        | Measured, below release ambition      | 79.29% lines overall; 91.83% engine lines; 86.48% data lines. UI interaction and platform branches remain the main gaps.                                                                                   |
| Security                        | Pass at reviewed checkpoints          | Baseline and complete working-tree diff reviews returned zero findings; the final source preflight returned no candidates. This follow-up changes documentation only.                                      |
| Accessibility                   | Source improvements; manual gate open | Persistence/recovery notices use blocking or alert semantics. Screen-reader and large-text device passes are not current.                                                                                  |
| Performance                     | Unverified                            | The healthy API-36 AVD completed functional flows, but no profiler capture or launch/navigation regression budget was executed. The resource-saturated Pixel attempt is not performance evidence.          |
| Runtime UAT                     | Focused Android pass; matrix open     | Cold Log launch, create/readback, process-death persistence, Dashboard, Portfolio online/offline fallback, recovery, and restore passed. Accessibility, destructive recovery actions, and iOS remain open. |

## Work completed in this pass

### Recoverable snapshot lifecycle

- Added stable schema-`1` snapshot envelopes while retaining the existing logical storage key.
- Validates collections and required preferences before hydration can silently filter or replace rows.
- Migrates valid unversioned/schema-`0` data and replaces the main key only after a successful complete write.
- Distinguishes first run, malformed JSON, partial corruption, future/unsupported versions, storage unavailability, and migration-write failure.
- Retains the exact original at the main key, attempts a second local quarantine copy, and exposes only non-value diagnostic codes.
- Blocks every financial mutation during recovery and prevents storage-unavailable recovery from resetting data.
- Adds a localized blocking recovery surface with sensitive JSON export and destructive reset confirmation.
- Treats an empty persisted string as corruption, preserves it, and permits reset only after safe quarantine conditions are satisfied.
- Updates `docs/PRIVACY_DATA_LIFECYCLE.md` with storage, quarantine, export, reset, cache, and deletion boundaries.

### Persistence and calculation correctness

- Added failing-storage and persisted/in-memory consistency tests across transaction, recurring, category, asset, milestone, scenario, goal, quote, and preference actions.
- Verifies due recurring materialization when the app returns active.
- Centralized projection assumption normalization for return, inflation, withdrawal, saving, and spending inputs.
- Repairs direct non-finite values and addition overflow so the shared assumption contract never emits `NaN` or `Infinity`.
- Keeps Dashboard, What-if, sheet presentation, target calculation, and projection runtime on the same bounds.

### Dependencies and security

- Updated Expo to `~57.0.18`, Expo Constants to `~57.0.16`, and Expo Font to `~57.0.2`.
- Aligned the vulnerable Metro path to `0.84.5` through narrow package overrides and verified the installed tree.
- Removed the four high-severity `image-size` findings; retained 11 moderate upstream `uuid` findings rather than applying npm's breaking `expo-sharing@14.0.8` proposal.
- Codex Security Standard scan `69623e6c-c6de-4c44-a780-ea353b4eec8b` completed with full coverage and zero findings at base commit `321f6b5`.
- Codex Security working-tree diff scan `d72fbc8d-100e-409c-8202-dcabfcf22b8c` reviewed all 16 changed source items with complete coverage and zero findings before the final two quality edge-case refinements.
- No secret, quote token, analytics destination, automatic recovery upload, native build, or EAS path was added.

### Runtime UAT executed

#### 2026-08-29 resource-saturated Pixel attempt

- Installed the SDK-57-compatible Expo Go 57.0.9 on `emulator-5554`; this was a host-app update, not a native project rebuild.
- Loaded the current Android bundle successfully and confirmed the locked `Home | Calendar | + | Dashboard | Portfolio` navigation surface, with Settings outside the tabs.
- Opened Calendar and Log, created a one-time Food expense for HKD 123 dated 2026-08-29, and verified Calendar totals and history.
- Reopened the transaction editor, changed the amount to HKD 456, saved it, and verified both the summary and history row updated to HKD 456.
- Attempted a forced Expo Go stop/relaunch to verify persistence. Metro completed a 2,254-module Android bundle and React Native logged `Running "main"`, but the host remained on its spinner. The emulator had 750,976 KiB of 751,592 KiB swap in use and Expo Go consumed roughly 55–87% CPU during the attempt. This is recorded as a blocked cold-launch/persistence check, not a pass or an app performance result.
- No fatal JavaScript exception was observed in the successful warm flow. The blocked cold attempt emitted Expo Go/native-host soft exceptions involving keyboard-controller UI-manager initialization and its headless app loader; attribution to project source was not established.
- Dashboard, Portfolio quote fallback, recovery export/reset, offline behavior, screen reader, large text, reduced motion, and iOS were not inferred from that partial run.

#### 2026-08-31 healthy API-36 follow-up

- Launched existing `Medium_Phone_API_36.0` with 4 GB RAM and approximately 6.6 GB free in `/data`; no AVD wipe or project rebuild was performed.
- Cold-launched the final normal bundle through `exp://10.0.2.2:8081`; Android reported `LaunchState: COLD`, React Native logged `Running "main"`, and Log rendered as the default route.
- Created a one-time Food expense for HKD 789 with note `cold-persist-20260831`. Calendar exposed the exact note, amount, category, and HKD 789 monthly expense/net totals.
- Force-stopped Expo Go, cold-launched it again, and verified the same Calendar row and totals survived process death.
- Rendered Dashboard Overview with March 2063, FIRE age 67, HKD 426,043 FIRE assets, 4.4% funded, the HKD 9,600,000 target, and the projection chart.
- Refreshed Portfolio online to HKD 1,180,868 total assets and HKD 460,868 counted toward FIRE. With Wi-Fi and mobile data disabled, the next refresh showed `Update failed · saved prices from Aug 31, 8:19 AM` while preserving those totals and allocation. Network access was restored and the next refresh succeeded.
- Used a temporary, one-shot dev-only hook to duplicate the complete snapshot before injecting malformed JSON. The app blocked normal use, stated that the stored snapshot had not been silently overwritten, and exposed `Export original data` and `Reset to demo data`.
- Restored the duplicate, removed the quarantine/test keys and temporary hook, then cold-launched the clean final source. Calendar still exposed `cold-persist-20260831` and HKD 789; `git diff --exit-code` and typecheck passed afterward.
- The OS share recipient, destructive demo reset, storage-exhaustion/write-failure, screen reader, large text, reduced motion, profiler evidence, and iOS remain explicitly unexecuted.

## Verification matrix

| Check                                              | Result                                                                                                                                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Targeted recovery/persistence/projection tests     | Pass — 3 suites, 24 tests                                                                                                                                                                    |
| `npm run typecheck`                                | Pass                                                                                                                                                                                         |
| `npm run lint`                                     | Pass                                                                                                                                                                                         |
| `npm run format:check`                             | Pass                                                                                                                                                                                         |
| `npm test -- --runInBand --watch=false --coverage` | Pass — 42 suites, 243 tests; 79.29% overall, 91.83% engine, 86.48% data lines                                                                                                                |
| `npx expo-doctor`                                  | Pass — 21/21                                                                                                                                                                                 |
| `npm ls --depth=0`                                 | Pass                                                                                                                                                                                         |
| `npm run validate:web`                             | Pass — 1,639 modules; 3.4 MB entry bundle and 139 KB worker bundle                                                                                                                           |
| `git diff --check`                                 | Pass                                                                                                                                                                                         |
| `npm audit --omit=dev --audit-level=moderate`      | Conditional fail — 11 moderate upstream/transitive `uuid` findings; incompatible `expo-sharing@14.0.8` proposal rejected                                                                     |
| Codex Security                                     | Pass — Standard and diff checkpoints have complete coverage and zero findings; final source preflight returned no candidates. The follow-up diff is documentation-only.                      |
| Android/iOS current-source UAT                     | Focused Android pass: cold Log launch, create/readback, process-death persistence, Dashboard, Portfolio fallback, malformed recovery, and restore; accessibility matrix and iOS not executed |
| Native/EAS/store/production build                  | Not run — prohibited by repository instructions                                                                                                                                              |

## Release gates and prioritized backlog

### P0 — must close before calling the app release-ready

1. **Complete the production-candidate UAT matrix ([issue #28](https://github.com/loktoto/Fire_Countdown_v2/issues/28)).** Focused Android cold launch, persistence/relaunch, five-tab rendering, Log create, Dashboard, Portfolio fallback/offline, malformed recovery, and restoration now pass. Still execute current-source Calendar move/archive, recovery export and destructive reset, screen reader, large text, reduced motion, storage failure, and the equivalent iOS journeys.
2. **On-device performance ([issue #32](https://github.com/loktoto/Fire_Countdown_v2/issues/32)).** Capture launch, navigation, list, modal, and animation evidence with a defined regression budget.

### Source acceptance completed; issue state intentionally unchanged

- **Versioned recovery ([issue #6](https://github.com/loktoto/Fire_Countdown_v2/issues/6)).** All listed source acceptance criteria are implemented and automated; manual recovery UAT remains part of issue #28.
- **Persistence mutation contract ([issue #2](https://github.com/loktoto/Fire_Countdown_v2/issues/2)).** Representative create/update/archive/preference paths and editor failure behavior are covered. The GitHub issue remains open pending maintainer/device acceptance.

### P1 — product decisions or structural work

1. **Editable transaction and recurring currency.** Define the deterministic FX/base-currency behavior before making these FIRE-affecting fields editable; never aggregate currencies as 1:1.
2. **Milestone return override semantics ([issue #5](https://github.com/loktoto/Fire_Countdown_v2/issues/5)).** Define precedence versus portfolio-weighted return and scenarios, then apply it consistently to ETA/projection.
3. **Relational, round-trip export ([issue #34](https://github.com/loktoto/Fire_Countdown_v2/issues/34)).** Current CSV/TSV and recovery JSON are not a user-facing lossless restore format.
4. **Deterministic FX ledger ([issue #36](https://github.com/loktoto/Fire_Countdown_v2/issues/36)).** Required before full multi-currency aggregation or currency-edit promises.
5. **View-model boundary cleanup.** `TimeLens` and `FireImpactCard` still read the store directly; move screen-facing derivation and mutations behind view models/selectors.
6. **Coverage expansion ([issue #31](https://github.com/loktoto/Fire_Countdown_v2/issues/31)).** Prioritize recovery-modal interaction, storage/quarantine failure branches, Settings outcomes, quote credentials, and loading/error UI.

### P2 — quality and operations

- Reassess the 11 upstream audit findings when Expo/tooling ships a compatible fix; do not force-downgrade the SDK.
- Decide whether cross-collection snapshot references need a stricter schema validator or a future repair workflow.
- Verify platform share-cancellation semantics and temporary recovery-file cleanup on Android and iOS.
- Complete release metadata/store readiness ([issue #33](https://github.com/loktoto/Fire_Countdown_v2/issues/33)).

## Evidence boundary

`docs/uat/UAT_EXECUTION_REPORT.md` now separates a focused current-source Android addendum from the historical 48-case suite. Only the addendum and the Android observations listed here apply to commit `db12d7e`; the older suite remains scoped to its named branch, commit, SDK, and emulator. Every unfinished surface remains explicit.

## Preservation and provenance

- Source instructions were read first from `AGENTS.md`.
- Pre-edit Git bundle: `C:\Users\TOTO\Projects\Fire_Countdown_v2_backups\pre-pm-fixes-20260829-114436.bundle` (8,537,798 bytes, complete history/all refs, outside the repository).
- Pre-recovery-UAT Git bundle: `C:\Users\TOTO\Projects\Fire_Countdown_v2_backups\pre-recovery-uat-20260831-162851.bundle` (commit `db12d7e`, complete history, outside the repository).
- Earlier full workspace backup: `C:\Users\TOTO\Projects\Fire_Countdown_v2_backups\pm-overview-start-20260827-102509.zip`.
- Existing user work was preserved. The test snapshot was duplicated before corruption, restored byte-for-byte through the app storage adapter, and verified by its unique Calendar marker; the temporary UAT hook was removed. No demo reset, destructive cleanup, native build, or EAS build was performed.
- A 5.6 Luna max fresh-context security architecture review completed and was reconciled against primary evidence. Other delegated Luna audit attempts hit their usage limit and are not counted as evidence.
