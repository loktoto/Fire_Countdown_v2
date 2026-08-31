# Fire Countdown v2 UAT execution report

## Current-source focused Android addendum — 2026-08-31

This addendum records focused current-source UAT for commit
`db12d7e36ce7aa0004648e8eeb1ca85760afc39d` on branch
`codex/calendar-activity-polish`. It supplements, but does not replace, the historical 48-case
suite below.

### Environment

- Android device: `Medium_Phone_API_36.0`, API 36, `emulator-5554`
- Runtime: Expo Go 57.0.9 and Metro on port 8081
- Device capacity at start: 4 GB RAM and approximately 6.6 GB free in `/data`
- Final dev-server route: `exp://10.0.2.2:8081`
- Native/EAS build: not run

### Focused acceptance results

| Check                               | Result | Evidence                                                                                                                                                                                                                                    |
| ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Locked navigation and default route | Pass   | A normal cold launch rendered Log first and exposed Home, Calendar, the center Log action, Dashboard, and Portfolio; Settings remained outside the tabs.                                                                                    |
| Create and immediate readback       | Pass   | Saved a one-time Food expense for HKD 789 with note `cold-persist-20260831`; Calendar showed the same note, amount, category, and HKD 789 monthly expense/net totals.                                                                       |
| Process-death persistence           | Pass   | `am force-stop host.exp.exponent` followed by a cold Expo Go launch returned `LaunchState: COLD`; Calendar still exposed the exact note, amount, and category.                                                                              |
| Dashboard render                    | Pass   | Overview rendered March 2063, FIRE age 67, HKD 426,043 FIRE assets, 4.4% funded, the HKD 9,600,000 target, and the projection chart without a fatal JavaScript error.                                                                       |
| Online quote refresh                | Pass   | Portfolio settled from `Updating prices` to a timestamped update; the quoted totals changed to HKD 1,180,868 total assets and HKD 460,868 counted toward FIRE.                                                                              |
| Offline quote fallback              | Pass   | With Wi-Fi and mobile data disabled, refresh displayed `Update failed · saved prices from Aug 31, 8:19 AM`; the HKD 1,180,868 total and allocation remained visible. Network access was then restored and refresh succeeded again.          |
| Malformed-snapshot recovery         | Pass   | A one-shot dev-only UAT hook first duplicated the full snapshot, then injected malformed JSON. The app blocked normal use, stated that data had not been silently overwritten, and exposed `Export original data` and `Reset to demo data`. |
| Recovery restoration                | Pass   | The duplicated snapshot was restored, quarantine/test keys were removed, and a subsequent cold launch again exposed `cold-persist-20260831` and HKD 789 in Calendar. The temporary hook was removed and the worktree returned clean.        |

The recovery test did not invoke the OS share recipient or confirm the destructive demo reset; it
verified the blocking surface, local preservation path, and lossless restoration of the test
snapshot. iOS, screen-reader, large-text, reduced-motion, storage-exhaustion/write-failure, and
on-device performance acceptance remain open. The final normal Expo Go launch logged
`Running "main"` and rendered the app; an Expo Go embedded-update fallback warning preceded the
dev bundle and is not treated as a project JavaScript failure.

## Historical suite overall result

> Historical evidence notice (updated 2026-08-31): the suite below applies only to the named `test/uat-e2e-suite` branch, commit `e3d987a`, Expo Go 56.0.1, and 2026-07-16 execution environment. It is not current-source release evidence; use the focused addendum above and `QUALITY_REPORT.md` for the current branch.

The 48-case Android UAT suite passed on the Pixel_9a API 37 emulator using Expo Go 56.0.1. The six Android end-to-end journeys passed. Two defects were found during execution and fixed with regression coverage. No Android case is marked `Fail` or `Blocked`.

The iOS device matrix was not available in this environment, so iOS acceptance remains an explicit release risk. PR #1 should remain draft until iOS coverage is completed.

## Environment and evidence

- Repository: `loktoto/Fire_Countdown_v2`
- Branch: `test/uat-e2e-suite`
- Android device: `Pixel_9a` API 37, `emulator-5556`
- Runtime: Expo Go 56.0.1; Expo Go workflow via Metro on port 8081 and `adb reverse`
- Execution date: 2026-07-16 (device local time)
- App build under test: `e3d987a`
- Network modes: online live quote refresh, invalid custom endpoint, and Wi-Fi/data-disabled offline navigation
- Languages/themes: English and Traditional Chinese; light and dark mode
- Evidence: [`docs/uat/evidence/android-pixel9a-20260716`](evidence/android-pixel9a-20260716)
- Tracker: [`UAT_EXECUTION_TRACKER.csv`](UAT_EXECUTION_TRACKER.csv)

## Totals

| Priority              |   Pass |  Fail | Blocked |  Total |
| --------------------- | -----: | ----: | ------: | -----: |
| P0                    |     24 |     0 |       0 |     24 |
| P1                    |     21 |     0 |       0 |     21 |
| P2                    |      3 |     0 |       0 |      3 |
| **All Android cases** | **48** | **0** |   **0** | **48** |

Automated tests supplied evidence for validation-heavy cases (invalid input, deterministic FIRE math, persistence recovery, quote cache behavior, export sanitization, category lifecycle routing, and rapid duplicate submission). The final suite was 18 suites / 90 tests. Emulator evidence supplied the user-visible flows and six journeys.

## Journey results

1. Log an expense ??Calendar ??Home ??Dashboard: **Pass**. The saved Food expense propagated as the same Calendar, Home, and Dashboard cash-flow result.
2. Edit and move a transaction ??archive it: **Pass**. All owned fields were edited, the date moved across months, and the destructive action required two taps.
3. Edit FIRE plan ??add/include a manual asset ??verify Portfolio/Dashboard/Home: **Pass**. UAT Bond and the edited plan were reflected consistently.
4. Switch projection methods ??adverse/no-crossover projection: **Pass**. The adverse method showed `Not reached` and no FIRE date without producing invalid chart values.
5. Quote failure ??fallback Portfolio ??preferences/export: **Pass**. Cached/manual values remained visible after an invalid bridge; live Free quotes later refreshed VOO successfully; export opened the Android share sheet for CSV and Google Sheets formats.
6. Theme/language/persistence/offline/accessibility safety: **Pass** on Android. Traditional Chinese and dark mode were applied and restored, state survived full relaunch, and destructive confirmation/content descriptions were observed.

## Defects and fixes

### UAT-DEF-001 ??Secure quote token could not be saved on Android

Root cause: the SecureStore key was `fire-countdown-v2:quote-token`; Android SecureStore rejects keys containing `:`. The key is now `fire-countdown-v2.quote-token`. The emulator then saved the masked token and displayed `Credential saved`.

Regression: `src/features/quoteBridge/__tests__/client.test.ts` asserts the valid key and trimmed credential behavior.

### UAT-DEF-002 ??File export failed when Android had no compatible file-share handler

Root cause: `Sharing.shareAsync` can reject even when the sharing module reports available. The screen previously showed an error without attempting a text share.

Fix: `shareExportWithFallback` retries the same sanitized payload through the platform text share when file sharing fails.

Regression: `src/utils/__tests__/shareExport.test.ts` covers both successful file sharing and the text fallback. On the emulator both CSV and Google Sheets exports opened the Android share sheet after the fix.

## Blocked checks and remaining risks

- No Android UAT row is blocked.
- iOS execution is blocked by the absence of an iOS device/simulator in this PC environment. This is a release-matrix gap, not an Android pass claim.
- Physical-device-only behavior (hardware haptics fidelity, biometric/keychain behavior outside Expo Go, and real-device share-target availability) remains unverified.
- The free quote providers are public network services; cached/manual fallback remains the protection against outage or rate limiting.

## Validation commands

The final validation run is recorded from these repository commands:

```text
npm ci
npm run typecheck
npm run lint
npm run format:check
npm test -- --runInBand
npm run validate:web
npx expo-doctor
adb devices -l
```

Web export completed with the WASM Metro configuration and React Native Web dependency. The Android app was exercised through the repository-supported Expo Go workflow; no native/EAS rebuild was performed.
