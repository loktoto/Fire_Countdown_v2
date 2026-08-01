# Fire Countdown v2 Quality Report

**Review date:** 2026-07-14
**Scope:** Full repository quality pass plus the modern UI system, zero-key delayed market quotes, quote-cache resilience, secure custom-bridge credentials, bilingual visual QA, automated UAT, and release readiness.
**Release decision:** **Internal release candidate GO. Public release remains conditional on a production-build/accessibility pass and acceptance of the documented dependency risk.**

## Executive summary

The reviewed source now has no known open Critical or High defects. The locked information architecture is preserved (`Home | Calendar | + | Dashboard | Portfolio`), `+` remains the Log/default route, Settings remains outside the bottom tabs, user-owned financial records remain editable, FIRE outputs remain deterministic TypeScript calculations, and the app remains local-first.

The interface now uses one restrained expedition-style visual system: softened dark navy and warm off-white surfaces, teal/mint semantic accents, compact consistent headers, flatter cards, a clearer floating tab dock, and purposeful state feedback. Current-source Android visual QA covered Log, Home, Calendar, Dashboard, Portfolio, and Settings in dark and off-white light modes, including Traditional Chinese.

Live delayed quotes now work with no account or API key: the app uses a public zero-key batch endpoint with a community fallback for US stocks and ETFs, Coinbase's public spot endpoint for crypto, and Frankfurter's keyless daily FX rates. Automatic stale-on-open refresh, daily stock/ETF change display, bounded fallback concurrency, retry/backoff, and partial-result handling are included. Provider failure, offline state, or invalid symbols preserve cached quotes and manual fallbacks instead of blanking Portfolio. The existing custom Apps Script bridge remains available as an advanced option.

Automated quality gates pass: **16 suites / 83 tests**, typecheck, lint, formatting, Expo Doctor (**21/21**), dependency-tree validation, and `git diff --check`. A current Android development bundle compiled successfully through Metro and ran in Expo Go without a native rebuild. No native, EAS, store, or production build was run, as explicitly instructed.

## Quality scorecard

| Area                              |      Score | Evidence and remaining constraint                                                                                                                                                                              |
| --------------------------------- | ---------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product contract and IA           |     9.2/10 | Locked route order/default route protected by source-contract tests; existing flows retained.                                                                                                                  |
| Correctness and FIRE math         |     9.1/10 | Deterministic engine guards, month-end handling, date/currency correctness, and projection regressions pass.                                                                                                   |
| Data integrity and resilience     |     8.8/10 | Stored snapshots are sanitized; failed writes do not expose unpersisted state; quote cache survives empty/failed refreshes. No global storage-failure banner yet.                                              |
| Core workflow UX                  |     9.3/10 | Preserved flows now share consistent hierarchy, live market-price status, actionable empty/error states, and secure setup feedback.                                                                            |
| Accessibility and visual behavior |     9.1/10 | Semantic tabs/modals, touch targets, announcements, reduced-motion support, current-source Android visual QA, bilingual layout, and off-white light mode pass. A screen-reader/large-font pass remains manual. |
| Security and privacy              |     8.9/10 | Default quotes require no credential; HTTPS, timeout, payload validation, local-first storage, and export neutralization remain enforced. Custom bridge GET is legacy.                                         |
| Performance                       |     8.9/10 | Flatter shared surfaces remove default blur cost, expensive calculations stay memoized, quote work is stale-gated/concurrency-bounded, and animations clean up. Device profiler evidence is still required.    |
| Test and release readiness        |     9.3/10 | 83 tests, all static/dependency gates, Expo Doctor, current Metro compilation, and multi-screen Android visual/navigation smoke pass.                                                                          |
| **Overall**                       | **9.2/10** | Release-grade source with explicit production-build, accessibility, and upstream dependency gates rather than an unsupported claim of perfection.                                                              |

Scores are evidence-based review judgments, not crash-free production telemetry.

## Remediated findings

### High

- **DATA-01 — Unsafe snapshot hydration and persistence divergence.** Malformed JSON/storage exceptions could destabilize startup, and failed writes could leave the UI showing state that was never persisted. Snapshot collections/entities/preferences are now validated and repaired (`src/data/snapshotPreferences.ts`); reads and writes fail safely (`src/data/snapshotStorage.ts:9-32`); store commits retain the last persisted snapshot on write failure (`src/data/fireStore.tsx:64-84`).
- **FIRE-01 — Future cashflow changed today's FIRE position.** FIRE balance and transaction impact now use an effective through-date and suppress immediate impact for future drafts (`src/engine/fireEngine.ts:301-306`, `src/engine/fireEngine.ts:585-609`; `src/engine/selectors.ts:126-159`).
- **FIRE-02 — Unmatched currencies were aggregated as if exchange rates were 1:1.** Transactions and assets are now filtered to the FIRE goal's base currency unless a quote contains a usable converted value (`src/engine/fireEngine.ts:95-101`, `src/engine/fireEngine.ts:252-334`; `src/engine/selectors.ts:82-159`). Native-currency values remain visible without silently corrupting totals.
- **QUOTE-01 — Refresh failure could discard useful Portfolio valuation data.** Quote responses are validated before acceptance, one newest quote is retained per asset, and empty/failed refreshes preserve cached or manual fallback values (`src/data/quoteCache.ts:12`; `src/data/fireStore.tsx:321-328`; `src/features/quoteBridge/client.ts:90-155`).
- **QUOTE-02 — No practical direct market-data path.** Portfolio can now request US stock/ETF, crypto, and required FX quotes without an account or API key. Refreshes run only when due or requested, requests use bounded concurrency, and partial results retain older cache entries (`src/features/quoteBridge/client.ts`; `src/hooks/useQuoteRefresh.ts`; `src/screens/SettingsScreen.tsx`).
- **PORT-01 — Starting Add Asset persisted a fake placeholder record.** Asset creation is now draft-first; cancel is side-effect free, save validates the complete record, and existing assets can be archived after a two-step confirmation (`src/screens/PortfolioScreen.tsx:80-117`; `src/components/AssetEditorSheet.tsx:128-583`; `src/data/fireStore.tsx:235-241`).

### Medium

- **LOG-01 — Invalid and rapid duplicate transactions.** Confirm is unavailable without a positive amount and category; submission revalidates and blocks the same in-flight fingerprint (`src/hooks/useLogViewModel.ts:20-100`; `src/screens/LogScreen.tsx:247-256`).
- **ENGINE-01 — Month-end projection drift and hostile persisted assumptions.** Month stepping clamps to the original calendar day and projections sanitize non-finite/extreme rates (`src/engine/fireEngine.ts:119-132`, projection input handling later in the same module).
- **SEC-01 — Untrusted quote bridge and export payloads.** Bridge URLs must be HTTPS, requests time out, payloads are strongly validated/bounded, tokens remain in SecureStore, and mutation data uses an authenticated POST body (`src/features/quoteBridge/client.ts:20-151`). CSV/TSV exports neutralize user strings that spreadsheet software could interpret as formulas while preserving numeric negatives (`src/utils/exportData.ts:14-37`).
- **SET-01 — Destructive reset and async failures lacked safe feedback.** Reset now uses a native destructive confirmation; export, quote refresh, and token-save paths surface loading/error/success states and disable invalid actions (`src/screens/SettingsScreen.tsx:306-323`, `src/screens/SettingsScreen.tsx:499-548`).
- **A11Y-01 — Small/unlabelled controls and incomplete modal/navigation semantics.** Shared pressables now expose roles, hints, states, and test IDs; bottom navigation uses tab roles/selection; sheets are accessibility modals; core interactive targets are at least 44 points (`src/components/MotionPressable.tsx:38-142`; `src/components/BottomNavPill.tsx:68-69`; editor/picker sheet components).
- **PERF-01 — Avoidable projection/animation and gesture work.** Log impact is memoized, long-lived shared-value animations are cancelled during cleanup, and the wealth chart no longer claims move responders from its parent scroll view (`src/hooks/useLogViewModel.ts:33-48`; `src/components/FireImpactCard.tsx:120-124`; `src/components/WealthCrossoverChart.tsx:283`).

### Low

- **VIS-01 — Empty allocation rendered a fabricated 100% composition and could mismatch legend colors.** Invalid/zero entries are filtered, real empty state is 0%, and chart/legend share one presentation mapping (`src/components/allocationPresentation.ts`; regression tests in `src/components/__tests__/allocationPresentation.test.ts`).
- **VIS-02 — Visual language was fragmented and overly neon.** Shared semantic colors, warm off-white light surfaces, restrained teal accents, consistent headers, compact controls, flatter cards, and a clearer five-tab dock now align all core screens without changing navigation or financial behavior (`src/design`; `src/components/AppHeader.tsx`; core screen files).
- **I18N-01 — Locale drift risk.** English and Traditional Chinese object shape and UTF-8 content now have parity/sanity tests (`src/i18n/__tests__/locales.test.ts`).
- **NAV-01 — Locked navigation could regress silently.** Tests enforce route order, Log default/redirect behavior, and Settings exclusion from bottom tabs (`app/__tests__/navigationContract.test.ts`).

## Automated UAT and regression evidence

Automated UAT covers the most failure-prone, deterministic workflow boundaries:

- **Log:** creates one valid transaction, rejects an empty category, and blocks rapid duplicate submission.
- **Calendar/history:** edits amount/note/date and archives an existing transaction through store actions.
- **Portfolio:** opens/cancels an asset draft without persisting a placeholder; quote-cache replacement/fallback behavior is tested.
- **Home/Dashboard:** saved and future/base-currency transactions, milestones, FIRE version settings, projection crossing, post-FIRE withdrawals, and transaction impact alter selectors deterministically.
- **Settings/data:** malformed/partial snapshots, storage exceptions, write failure, direct/provider quote authentication, batched FX conversion, free-tier rotation, offline/cache fallback, exports, currency preferences, and locale parity.
- **Navigation/UI presentation:** locked route contract, allocation empty state/percentages, and FIRE-impact presentation.

Coverage from `npm test -- --runInBand --coverage`:

| Scope              | Statements | Branches | Functions |  Lines |
| ------------------ | ---------: | -------: | --------: | -----: |
| All measured files |     79.24% |   75.64% |    64.35% | 79.38% |
| Data layer         |     96.66% |   95.00% |      100% | 96.61% |
| FIRE engine        |     92.57% |   78.75% |      100% | 92.30% |
| Quote bridge       |     83.25% |   67.50% |    84.00% | 83.87% |

The lower aggregate function percentage is concentrated in UI/localization callback surfaces; the deterministic data and calculation layers carry materially stronger coverage.

## Verification matrix

| Check                                | Result                                                                |
| ------------------------------------ | --------------------------------------------------------------------- |
| `npm run typecheck`                  | Pass                                                                  |
| `npm run lint`                       | Pass                                                                  |
| `npm run format:check`               | Pass                                                                  |
| `npm test -- --runInBand`            | Pass — 16 suites, 83 tests, 0 snapshots                               |
| `npx expo-doctor`                    | Pass — 21/21 checks                                                   |
| `npm ls --depth=0`                   | Pass — coherent dependency tree                                       |
| `git diff --check`                   | Pass                                                                  |
| Android Metro development bundle     | Pass — current Android bundle compiled successfully through Metro     |
| Native/EAS/store/production build    | **Not run — explicitly prohibited by task instructions**              |
| Current-source physical/emulator UAT | Pass — locked tabs plus dark/light bilingual core-screen visual smoke |

Reference-only Windows Node benchmark (not an on-device profiler): 200 transaction previews took 369.25 ms total (1.846 ms mean); 200 projections of 900 months took 558.06 ms total (2.790 ms mean).

## Open risks and release gates

- **DEV-RES-01 — Low / development tooling only.** Expo Go on emulator `5554` intermittently entered its own `UpdateFailedToLoad` activity after several minutes. Relaunching the current Metro URL restored the app, and logcat showed the failure in Expo's update loader rather than a `ReactNativeJS` exception. Validate lifecycle behavior again in the eventual production build.
- **DEP-RES-01 — Moderate supply-chain finding.** `npm audit --omit=dev` reports 11 moderate findings from Expo's transitive configuration/build chain: `@expo/* -> xcode -> uuid <11.1.1` (`GHSA-w5hq-g745-h8pq`). npm's only complete proposal is `npm audit fix --force`, which would downgrade to Expo 46 and break the current app. Do not apply that forced fix. Track an Expo/upstream resolution and reassess before public distribution.
- **QUOTE-RES-01 — Medium / public-release dependency.** The zero-key US stock/ETF endpoints have no documented third-party SLA or explicit redistribution license; the fallback service also describes its data as scraped. This is a best-effort free path until a licensed production feed is funded. Batched primary requests, retry/backoff, and cache/manual fallback prevent upstream failures from corrupting or blanking Portfolio.
- **SEC-RES-01 — Medium, conditional on legacy custom-bridge deployment.** The optional Apps Script-compatible quote GET still preserves its token query parameter. HTTPS is enforced and mutations use POST, yet custom-bridge query tokens can appear in server/proxy logs. Before exposing that bridge broadly, change its contract to accept an `Authorization` header or authenticated POST for quote reads, then remove query-token support.
- **FX-RES-01 — Low/product limitation.** The app now refuses to treat unresolved currencies as equivalent. Full multi-currency portfolio totals still require a deterministic FX-rate ledger/history; until then, unmatched manual holdings are displayed in native currency but excluded from FIRE aggregates.
- **DATA-RES-01 — Low.** Storage failures preserve the last persisted state rather than showing false success, but there is no app-wide, user-visible persistence-error banner. Add one if field telemetry shows storage/quota failures.

## Remaining public-release acceptance

The current-source Expo Go visual/navigation smoke is complete. Before public distribution, run these checks on the actual production candidate:

1. Install/cold-launch the signed build and reconfirm the locked tabs, Log landing route, and Settings placement.
2. Complete Log and Calendar create/edit/move/archive flows and verify Home/Dashboard react deterministically.
3. Verify AAPL, VOO, AVIV, BTC, airplane-mode fallback, invalid-symbol partial results, and USD/HKD FX conversion against the production candidate.
4. Background/restore the app around a quote refresh and confirm no duplicate requests or lost local data.
5. Repeat primary flows with screen reader, large text, and reduced motion; watch for clipping, focus loss, blocked scrolling, or animation leakage.
6. Explicitly accept or remediate the dependency and legacy custom-bridge risks below.

## Production decision

**Internal testing:** GO.
**Public production release:** Conditional on the signed-build acceptance pass above and explicit acceptance or remediation of DEP-RES-01 / SEC-RES-01.

## Provenance and preservation

- Repository source of truth read first: `AGENTS.md`. No separate v5 development document was present in the repository, so the task brief plus `AGENTS.md` governed this pass.
- Pre-edit backup: `C:\Users\TOTO\Projects\Fire_Countdown_v2_backups\pre-quality-pass-20260714-003937.zip` (19,987,685 bytes; 274 entries; outside the repository).
- Modern UI/live-quote backup: `C:\Users\TOTO\Projects\Fire_Countdown_v2_backups\pre-modern-quotes-20260714-094045.zip` (30,583,100 bytes; 1,365 entries; outside the repository).
- The pre-existing dirty worktree and untracked user files were preserved; no reset, checkout, native rebuild, or destructive cleanup was performed.
