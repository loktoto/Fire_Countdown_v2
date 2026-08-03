# UAT evidence and local diagnostics

Use two separate paths for visual and runtime artifacts.

## Durable UAT evidence

Commit evidence under `docs/uat/evidence/<platform-device-date>/` when it supports a tracked UAT result, defect, or release gate. Durable evidence should have:

- a tracker or report reference
- a descriptive file name
- the tested branch or commit, device, runtime, and date recorded nearby
- sensitive financial values, credentials, and unrelated personal information removed

When durable evidence is moved or renamed, update every report and tracker reference in the same change. Preserve a backup before reorganizing user-owned evidence.

## Disposable local diagnostics

Keep ad hoc screenshots, UI dumps, temporary exports, and debugging output in repository-root `screenshots/` or `tmp/`. Root-level `.png`, `.jpg`, and `.jpeg` files are also treated as disposable diagnostics. These paths are ignored so they do not become mixed with source changes.

The ignore rules do not remove existing files and do not apply to `docs/uat/evidence/`, application assets, or documentation images stored below their intended directories.

## Staging a focused change

Review the scope before committing:

```text
git status --short
git diff --check
git add <explicit source and test paths>
git diff --cached --name-status
```

Do not use broad staging to collect local screenshots or temporary output. When a diagnostic becomes release evidence, copy it into the durable evidence path, add its report or tracker reference, and stage those exact paths explicitly.
