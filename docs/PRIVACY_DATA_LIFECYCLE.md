# Privacy and local data lifecycle

Status: current application contract for Fire Countdown v2.

This document describes what the application stores, where it is stored, when data leaves the device, the protections that exist today, and the limits users and maintainers must not misrepresent. It is not a promise of protections that have not been implemented.

## Product position

Fire Countdown is local-first.

- Financial records and FIRE assumptions are stored on the device.
- The app has no account system, cloud sync, analytics, advertising SDK, crash-reporting service, or AI-generated financial output.
- Network access is limited to quote and FX refreshes that the user enables or triggers.
- Quote credentials are stored separately from the financial snapshot and are excluded from export.
- A user-initiated export leaves the app through the operating-system share sheet and must be treated as a sensitive copy.

Any future analytics, cloud sync, remote backup, telemetry, or account feature requires explicit product approval, a separate threat review, updated user-facing disclosure, and an update to this document before release.

## Data inventory

| Data                    | Examples                                                                                    | Current storage                                                | Leaves device?                                                                                       | Current retention and deletion                                                                                                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Financial snapshot      | transactions, categories, assets, goals, scenarios, milestones, quote settings, preferences | `expo-sqlite/localStorage` under `fire-countdown-v2:snapshot`  | Only through user-selected export, or when included in a user-triggered quote request where required | Retained across app restarts and updates. Replaced by demo seed when the user confirms **Reset Demo Data**. Platform uninstall/backup behavior is controlled by the OS and build configuration.                                                                                                                     |
| Quote cache             | prices, currencies, FX rates, source/status, timestamps, bounded raw provider payload       | Inside the financial snapshot                                  | Provider requests retrieve new values; existing cached values are not uploaded as a backup           | Same lifecycle as the snapshot.                                                                                                                                                                                                                                                                                     |
| Custom quote credential | custom bridge token                                                                         | Expo SecureStore under `fire-countdown-v2.quote-token`         | Sent only to the configured custom HTTPS bridge, in a JSON POST body                                 | Retained until explicitly overwritten or deleted through SecureStore code. **Reset Demo Data does not currently delete this credential.** Android uninstall normally removes it. iOS Keychain data may persist across reinstall with the same bundle identifier and must not be assumed to be deleted by uninstall. |
| Export working file     | generated CSV or tab-separated text                                                         | Temporary file in the app cache when file sharing is available | Yes, only after the user chooses an export and a share destination                                   | Cache lifetime is OS-controlled. The receiving app, cloud drive, message, email, clipboard, or file destination controls the exported copy after sharing.                                                                                                                                                           |
| UI diagnostics          | screenshots, screen recordings, copied error text                                           | Outside app control after capture                              | Potentially, according to the destination selected by the user or OS                                 | The app cannot revoke or delete copies held by the OS, another app, a backup, or another person.                                                                                                                                                                                                                    |

The financial snapshot is not protected by app-level encryption today. Device encryption, device passcode policy, operating-system sandboxing, and platform backup configuration are outside the JavaScript application contract.

## Storage implementation

### Financial snapshot

`src/data/fireStore.tsx` installs the Expo SQLite localStorage implementation and treats it as the source of truth. `src/data/snapshotStorage.ts` serializes the complete `FireSnapshot` as JSON.

Current behavior:

1. First run with no stored snapshot loads demo seed data.
2. A successful mutation writes the next snapshot to local storage.
3. A failed write keeps the prior in-memory snapshot.
4. Unreadable JSON or an invalid top-level value currently falls back to demo seed data.

The fourth behavior is a known recovery limitation. Issue #6 owns versioned migrations, quarantine of the raw prior payload, and a localized corruption-recovery surface. Until that work is complete, maintainers must not describe current fallback as lossless recovery.

### Quote credential

`src/features/quoteBridge/client.ts` stores the custom bridge credential in Expo SecureStore. The active public client sends it only in the HTTPS POST body and redacts the literal and URL-encoded credential from surfaced bridge errors and stored raw quote payloads.

SecureStore is appropriate for a small credential, not for the full financial snapshot. It must not be treated as an irreplaceable backup. Platform behavior differs:

- Android stores values using encrypted SharedPreferences backed by Android Keystore; uninstall normally removes the stored value.
- iOS stores values in Keychain; a value can persist after uninstall when the same bundle identifier is installed again. This behavior is not guaranteed and must not be used as a backup strategy.
- A future credential protected with `requireAuthentication` can become unreadable after biometric enrollment changes.

Official reference: https://docs.expo.dev/versions/v57.0.0/sdk/securestore/

## Network destinations

No request should be presented as private merely because it uses HTTPS. The destination still receives request metadata and the values required to answer the request.

### Free-market provider

When the free provider is selected, the app can contact:

- `https://api.robinhood.com/quotes/` for batched stock and ETF quotes
- `https://stockprices.dev/api` as a per-symbol stock or ETF fallback
- `https://api.coinbase.com/v2/prices` for crypto spot prices
- `https://api.frankfurter.dev/v2/rate` for FX conversion

Requests can disclose the symbols or currency pairs the user has configured. No custom quote credential is used for these destinations.

### Custom bridge provider

When the custom provider is selected, the app contacts the user-configured HTTPS Script URL.

- Reads and mutations use `POST` with JSON.
- The credential is placed in the request body, not in the URL query string.
- Legacy `token`, `action`, and `baseCurrency` query parameters are removed before the request while unrelated endpoint parameters are preserved.
- The custom endpoint operator can observe the submitted credential, requested action, asset identifiers, symbols, quantities, currencies, and other fields required by that operation.

The app cannot protect data after it reaches a custom bridge. Users must trust the endpoint, its hosting provider, its logs, its access controls, and any downstream services it calls.

## Export contract

Settings offers CSV and Google-Sheets-compatible tab-separated export.

Current export properties:

- Export is initiated by the user.
- A temporary UTF-8 file is written to the app cache when platform file sharing is available.
- If file sharing is unavailable or fails, the app falls back to the platform text share sheet.
- Formula-like cells beginning with `=`, `+`, `-`, or `@` are prefixed to reduce spreadsheet formula injection risk.
- Quote credentials are not included.
- The current export is a human-readable report, not yet a relationally lossless backup. Issue #34 owns schema versioning, stable relationships, and round-trip reconstruction.

Users should assume that an exported file contains sensitive financial information. Once another app or person receives it, Fire Countdown cannot revoke it, enforce encryption, or delete every copy.

## Reset, deletion, and uninstall

### Reset Demo Data

The current destructive reset:

- requires the existing native confirmation dialog;
- replaces the financial snapshot with bundled demo seed data;
- does not clear the custom quote credential from SecureStore;
- does not delete files already exported or shared;
- does not delete screenshots, clipboard contents, OS backups, or copies held by other apps.

Product copy must say **Reset Demo Data**, not **Delete every copy** or **Erase account**, because there is no account and the operation has narrower scope.

### Credential deletion

A complete privacy control should eventually expose a separate, explicit **Remove quote credential** action that calls `clearQuoteToken()` and reports success or failure. Until that UI exists, documentation and support must not claim that Reset Demo Data removes the credential.

### Uninstall

Uninstall is not a verified secure-erasure mechanism:

- local application data is normally removed by the platform, subject to backup/restore behavior;
- Android SecureStore data normally does not survive uninstall;
- iOS Keychain credentials may survive reinstall with the same bundle identifier;
- exported files, screenshots, messages, emails, cloud-drive copies, and device backups are outside app control.

## Supported threat model

### Protections provided today

The app is designed to reduce these risks:

- accidental network upload of the complete financial snapshot;
- credentials being stored in the main snapshot or exported report;
- custom bridge credentials appearing in request URLs or user-visible bridge errors;
- quote-provider failure blanking the Portfolio, by retaining cached or manual values;
- accidental reset, through a destructive native confirmation;
- spreadsheet formula execution from user-controlled exported text.

### Risks not solved today

The app does not claim to protect against:

- an unlocked, rooted, jailbroken, malware-infected, or forensically acquired device;
- another person who knows the device passcode or can access an unlocked session;
- OS or vendor backups that include application data;
- screenshots, screen recordings, accessibility-service capture, keyboard capture, clipboard history, or notification previews;
- a malicious or compromised custom quote bridge;
- a receiving app or person mishandling an export;
- silent, lossless recovery from every corrupt or future snapshot version;
- coercion, shoulder surfing, or physical observation;
- deletion of copies that have already left the app.

Sensitive exception details must not be shown on the app-level recovery surface. Repository logs, issue attachments, UAT evidence, and screenshots must use sanitized or demo data.

## App lock and biometric evaluation

An optional app lock could reduce casual access when a device is already unlocked, but it is not equivalent to encrypting the full snapshot and is not implemented today.

### Why it is deferred

- iOS Face ID authentication is not fully testable in Expo Go.
- SecureStore `requireAuthentication` needs native permission configuration for complete iOS behavior and is not supported for biometric authentication in Expo Go.
- Adding a reliable app lock requires lifecycle rules for foreground/background transitions, fallback to device credentials, cancellation, lockout, recovery, and accessibility.
- Protecting only the quote credential would not lock the financial snapshot already rendered by the app.
- Protecting the full snapshot with a biometric-derived key requires migration, corruption recovery, backup semantics, and real-device release-build testing.

Official references:

- https://docs.expo.dev/versions/v57.0.0/sdk/securestore/
- https://docs.expo.dev/versions/latest/sdk/local-authentication/

### Release gate for a future app lock

Do not add user-facing app-lock copy until all of the following exist:

1. a separately approved product requirement;
2. a documented lock state machine and recovery path;
3. Android and iOS real-device tests, including biometric enrollment changes;
4. native permission/configuration review and an authorized development or release build;
5. accessibility coverage for authentication, cancellation, and fallback;
6. migration and backup behavior that cannot silently destroy the snapshot;
7. a clear statement that app lock reduces casual access but does not defeat device compromise.

## Backup and recovery guidance

Until versioned, relationally lossless backup is implemented:

- users should export before major app, device, or data changes;
- users should store exports only in destinations they trust;
- maintainers must distinguish the current human-readable export from a restorable backup;
- support must not ask users to post unsanitized snapshots, screenshots, credentials, or exports in public issues;
- corruption work must preserve the raw prior payload before any destructive reset once Issue #6 is implemented.

## Maintainer checklist

Update this document in the same pull request when changing any of the following:

- snapshot storage key, schema, serialization, migration, reset, or deletion;
- SecureStore keys or credential lifecycle;
- quote or FX provider hostnames and request fields;
- export tables, file formats, cache behavior, or sharing flow;
- analytics, telemetry, crash reporting, cloud sync, accounts, remote backup, or notifications;
- native backup configuration, app identifiers, encryption declarations, app lock, or biometrics;
- user-facing privacy, reset, export, recovery, or credential copy.

Review requirements:

- no secrets or real financial values in source, tests, logs, screenshots, or UAT evidence;
- no new network destination without explicit disclosure;
- no claim of encryption, deletion, recovery, or anonymity beyond the implemented behavior;
- deterministic FIRE calculations remain local TypeScript logic;
- Expo Go compatibility remains the default until a native build is explicitly authorized.
