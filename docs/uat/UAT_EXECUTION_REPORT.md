# Fire Countdown v2 UAT execution report

## Overall result

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

Automated tests supplied evidence for validation-heavy cases (invalid input, deterministic FIRE math, persistence recovery, quote cache behavior, export sanitization, and rapid duplicate submission). Emulator evidence supplied the user-visible flows and six journeys.

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
