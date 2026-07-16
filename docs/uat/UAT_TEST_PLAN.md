# Fire Countdown v2 — Focused End-to-End UAT Plan

**Status:** Ready for execution  
**Prepared:** 2026-07-14  
**Scope:** 48 scenario-based UAT cases covering the complete user experience  
**Primary platforms:** iOS and Android  
**Secondary platform:** Web smoke testing

---

## 1. Purpose

This plan validates that a real user can complete the core Fire Countdown experience safely and consistently:

1. Record income and expenses.
2. Review, edit, move, and archive transaction history.
3. Understand current FIRE progress and projected FIRE timing.
4. Manage assets, FIRE assumptions, milestones, and projection methods.
5. Configure appearance, language, currency, quote integration, and data export.
6. Continue using the app after restart, offline use, or quote-service failure.

The suite deliberately uses **48 consolidated business scenarios** rather than 100 narrowly separated checks. Each case validates a complete user outcome and may contain several related acceptance points.

---

## 2. Release acceptance rules

A release candidate is accepted only when:

- **All P0 cases pass on iOS and Android.**
- At least **95% of P1 cases pass**, with no unresolved Critical defect.
- No open defect causes data loss, incorrect FIRE calculations, navigation dead ends, exposed secrets, or unusable core controls.
- All six end-to-end journeys complete without developer intervention or manual data repair.
- Web smoke testing passes launch, navigation, transaction entry, Calendar, Dashboard, Portfolio, and Settings.

### Priority

| Priority | Meaning                                                                 |
| -------- | ----------------------------------------------------------------------- |
| P0       | Release blocker. Execute on every release candidate on iOS and Android. |
| P1       | Core regression. Execute on every release candidate; risk-based on Web. |
| P2       | Extended UX, compatibility, and non-blocking validation.                |

### Defect severity

| Severity | Definition                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------ |
| Blocker  | App cannot launch, data is lost or corrupted, or a complete core journey cannot finish.          |
| Critical | Financial result is materially wrong, a major feature is unusable, or sensitive data is exposed. |
| Major    | Important behavior is incorrect or confusing, but a workaround exists.                           |
| Minor    | Cosmetic, copy, spacing, animation, or low-impact usability issue.                               |

---

## 3. Test environment

Record for each run:

- Build identifier and commit SHA
- Device model, operating-system version, and platform
- Expo Go, development build, or Web
- Online, offline, or unreliable network state
- English or Traditional Chinese
- Dark or light theme
- Tester, date, result, evidence, and linked defect

Minimum matrix:

| Dimension   | Required coverage                                                    |
| ----------- | -------------------------------------------------------------------- |
| iOS         | Current iPhone-size device plus one smaller viewport where available |
| Android     | Current Android device plus one smaller viewport where available     |
| Web         | Current Chrome or Edge smoke run                                     |
| Theme       | Dark and light                                                       |
| Language    | English and Traditional Chinese                                      |
| Network     | Online, offline, and failed quote endpoint                           |
| Persistence | Warm restart and full termination/relaunch                           |

---

## 4. Baseline test data and calculation checkpoint

Start the main execution from **Reset Demo Data**, unless a case specifies otherwise.

Expected seed checkpoints:

- Base currency: HKD
- Included FIRE assets: VOO ETF HKD 242,000 + Emergency Cash HKD 180,000 = **HKD 422,000**
- Total assets including excluded residence: **HKD 1,142,000**
- Monthly retirement spending: HKD 28,000
- Withdrawal rate: 3.5%
- Derived FIRE target: `28,000 × 12 ÷ 0.035 = HKD 9,600,000`
- Base scenario is the default projection method
- Primary Residence is excluded from FIRE

Allow normal display rounding. Any unexplained cross-screen difference is a defect.

---

# 5. UAT test cases

## A. Launch and navigation — 4 cases

### UAT-NAV-01 — Launch to the default Log route

- **Priority:** P0
- **Precondition:** App is fully terminated.
- **Steps:** Launch the app; wait for initial loading to finish.
- **Expected:** App opens without crash or blank screen; the center `+` / Log route is selected; amount input is usable; no developer error or missing-data state appears.

### UAT-NAV-02 — Complete bottom-tab navigation

- **Priority:** P0
- **Steps:** Open Home, Calendar, Log, Dashboard, and Portfolio in sequence; return to Log.
- **Expected:** Every tab opens the correct screen; selected-tab state is clear; no stale modal blocks navigation; returning to a screen reflects the latest saved data.

### UAT-NAV-03 — Open and close Settings through Portfolio

- **Priority:** P1
- **Steps:** Open Portfolio; open Settings; select Done/back.
- **Expected:** Settings opens as a separate screen/modal and is not shown as a sixth bottom tab; closing returns to Portfolio without losing unsaved data elsewhere.

### UAT-NAV-04 — Recover from an unknown route

- **Priority:** P2
- **Steps:** Open an invalid/deep route supported by the test environment; use the recovery action.
- **Expected:** A controlled “route not found” state appears; the user can return to Log; the app does not crash.

---

## B. Log transactions — 8 cases

### UAT-LOG-01 — Record a same-day expense

- **Priority:** P0
- **Steps:** On Log, choose Expense; enter `128.50`; select Food; enter note `Team lunch`; keep today’s date; confirm.
- **Expected:** One expense is created with the correct amount, category, note, currency, and date; amount and note fields reset; date returns to today; Calendar, Home, and Dashboard update consistently.

### UAT-LOG-02 — Record a same-day income

- **Priority:** P0
- **Steps:** Choose Income; enter `5000`; select Salary or Dividend; add a note; confirm.
- **Expected:** One income record is created; positive cash-flow displays use the positive visual treatment; Home and Dashboard show a favorable change relative to the prior state.

### UAT-LOG-03 — Record a transaction on another date

- **Priority:** P1
- **Steps:** Use previous/next day controls and the date picker to select a non-today date; record an expense.
- **Expected:** The record is stored on the selected date; Calendar automatically shows it on that date; today’s impact does not incorrectly include it.

### UAT-LOG-04 — Amount input normalization

- **Priority:** P1
- **Steps:** Enter values containing a comma decimal, letters, multiple decimal points, and more than two decimal places.
- **Expected:** Non-numeric characters are removed; comma is treated as a decimal separator; only one normalized decimal value remains; no more than two decimal places are stored; the app does not crash.

### UAT-LOG-05 — Reject zero or empty amount

- **Priority:** P0
- **Steps:** Leave amount empty or set it to `0`; press Confirm multiple times.
- **Expected:** No transaction is created; summaries and history remain unchanged; repeated taps do not create phantom records.

### UAT-LOG-06 — Expense/income category switching

- **Priority:** P1
- **Steps:** Select an expense category; switch to Income; switch back to Expense.
- **Expected:** Only categories valid for the selected transaction type are shown; a valid category is automatically selected; a transaction cannot be saved against a category of the wrong type.

### UAT-LOG-07 — FIRE impact preview responds to the draft

- **Priority:** P1
- **Steps:** Enter a material expense; note the preview; switch to Income with the same amount; change the amount.
- **Expected:** Preview recalculates immediately; expense and income move projected FIRE impact in opposite directions; zero amount shows neutral/no impact; no `NaN`, infinity, or broken label appears.

### UAT-LOG-08 — Prevent duplicate submission

- **Priority:** P0
- **Steps:** Enter one valid transaction; rapidly tap Confirm several times.
- **Expected:** Only one transaction is saved for the intentional submission; the form reset prevents duplicate copies.

---

## C. Category lifecycle — 4 cases

### UAT-CAT-01 — Create and immediately use a category

- **Priority:** P1
- **Steps:** From Log, add a new expense category with a unique name, icon, and colour; save it; record an expense using it.
- **Expected:** Category appears in the correct type list, becomes selectable, preserves its icon/colour, and is attached to the saved transaction.

### UAT-CAT-02 — Edit a category used by existing transactions

- **Priority:** P1
- **Steps:** Edit the new category’s name, icon, and colour; open Calendar for the transaction date.
- **Expected:** Updated category presentation appears in Log and transaction history; transaction amount, date, and note remain unchanged.

### UAT-CAT-03 — Archive a selected category safely

- **Priority:** P1
- **Steps:** Select a category; archive/delete it from the category editor.
- **Expected:** Category is removed from new-entry choices; Log selects another valid category; existing historical transaction remains readable and the app does not crash.

### UAT-CAT-04 — Validate category editor input

- **Priority:** P2
- **Steps:** Attempt to save a blank or whitespace-only name; cancel an edit after making changes.
- **Expected:** Invalid category is not created; cancel leaves the original category unchanged; no partial update is persisted.

---

## D. Calendar and transaction history — 6 cases

### UAT-CAL-01 — Monthly totals and daily net are correct

- **Priority:** P0
- **Steps:** In one month, create at least two incomes and two expenses on different days; open Calendar.
- **Expected:** Monthly income equals the sum of active income records; expense equals the sum of active expense records; net equals income minus expense; each day cell shows the correct signed daily net.

### UAT-CAL-02 — Navigate month, year, and Today

- **Priority:** P1
- **Steps:** Move backward and forward by month and year; select Today.
- **Expected:** Month heading, weekday grid, day count, and out-of-month cells remain correct; Today returns to the current date and month.

### UAT-CAL-03 — Edit all transaction-owned fields

- **Priority:** P0
- **Steps:** Open a transaction; change type, amount, category, date, and note; save.
- **Expected:** All changes persist; changing type selects a valid category; original record is updated rather than duplicated; old and new day/month totals recalculate.

### UAT-CAL-04 — Reject invalid transaction edits

- **Priority:** P0
- **Steps:** In the transaction editor, enter zero amount and invalid dates such as incomplete text or impossible formats; attempt to save.
- **Expected:** Save remains unavailable or has no effect; invalid data is not persisted; closing the editor leaves the original record unchanged.

### UAT-CAL-05 — Move a transaction across months

- **Priority:** P1
- **Steps:** Edit a transaction date from the visible month to another month; save.
- **Expected:** The transaction disappears from the old date and appears on the new date; both months’ summaries update; selected date follows the moved record where designed.

### UAT-CAL-06 — Archive a transaction

- **Priority:** P0
- **Steps:** Record the current totals; archive one transaction from Calendar.
- **Expected:** Transaction is removed from active history; daily, monthly, Home, and Dashboard figures recalculate without the archived value; relaunch does not restore it.

---

## E. Home experience — 4 cases

### UAT-HOME-01 — Baseline FIRE summary is internally consistent

- **Priority:** P0
- **Precondition:** Reset Demo Data.
- **Steps:** Open Home and compare values with Portfolio and the baseline checkpoint.
- **Expected:** Net worth is approximately HKD 1,142,000; included FIRE assets are approximately HKD 422,000; target is approximately HKD 9,600,000; progress and countdown contain valid finite values and agree with Dashboard.

### UAT-HOME-02 — Today’s cash flow updates Home

- **Priority:** P0
- **Steps:** Record a same-day income, open Home; then record a same-day expense and reopen Home.
- **Expected:** Today’s impact changes by the correct signed amounts; countdown/progress direction is logical; updates occur without reinstalling or manually refreshing.

### UAT-HOME-03 — Asset privacy toggle

- **Priority:** P1
- **Steps:** Tap Net Worth or Included FIRE to hide amounts; navigate away and back; reveal amounts.
- **Expected:** Both sensitive values are replaced by masked text while hidden; labels remain understandable; values restore correctly when shown; no amount leaks through overlapping text.

### UAT-HOME-04 — Milestone journey state

- **Priority:** P1
- **Steps:** Compare current included assets with milestone targets; modify an included asset so one milestone changes status; reopen Home.
- **Expected:** Milestones remain ordered; achieved/current/future states update logically; hidden or archived milestones are not shown.

---

## F. Dashboard and projections — 6 cases

### UAT-DASH-01 — Baseline deterministic FIRE calculation

- **Priority:** P0
- **Precondition:** Reset Demo Data.
- **Steps:** Open Dashboard; inspect target, included assets, progress, selected method, projected date/age, and chart.
- **Expected:** Target is derived from spending and withdrawal rate, not manually invented; Base method is selected; displayed values are finite and consistent with Home and Portfolio; chart and summary describe the same projection.

### UAT-DASH-02 — Transaction changes propagate across Dashboard

- **Priority:** P0
- **Steps:** Record an income and expense in the current activity month; reopen Dashboard.
- **Expected:** Saved cash flow, month net, today impact, and category leaders reflect active records; highest income/expense categories and record counts are correct; archived records are excluded.

### UAT-DASH-03 — Switch projection methods

- **Priority:** P0
- **Steps:** Switch among Conservative, Base, and Aggressive methods.
- **Expected:** Selected method is visually clear; assumptions, projected date/age, chart, and countdown update together; switching back reproduces the same deterministic result.

### UAT-DASH-04 — Edit FIRE assumptions from Dashboard shortcuts

- **Priority:** P0
- **Steps:** Open assumption editors from monthly saving, withdrawal rate, inflation, and target spending; change one value at a time and save.
- **Expected:** Edited values persist; derived target and projection update correctly; Home and Portfolio show the same goal state; no field silently reverts.

### UAT-DASH-05 — No-crossover and boundary handling

- **Priority:** P1
- **Steps:** Configure a deliberately adverse method, such as very low return and low saving with high spending; view Dashboard.
- **Expected:** App shows a controlled “not reached/no crossover” state instead of an impossible date, negative age, crash, `NaN`, or infinity.

### UAT-DASH-06 — Projection chart usability

- **Priority:** P2
- **Steps:** Test chart in dark/light mode, English/Traditional Chinese, and a smaller viewport.
- **Expected:** Chart renders without clipping or overlap; labels remain legible; changing scenarios refreshes the chart; animation does not block interaction.

---

## G. Portfolio and assets — 7 cases

### UAT-PORT-01 — Portfolio baseline totals and allocation

- **Priority:** P0
- **Precondition:** Reset Demo Data.
- **Steps:** Open Portfolio; compare total assets, included FIRE assets, weighted expected return, allocation, and asset rows.
- **Expected:** Totals match the baseline checkpoint; residence is counted in total assets but excluded from FIRE; allocation reflects active assets; quote/manual source badges are understandable.

### UAT-PORT-02 — Create and edit a manual asset

- **Priority:** P0
- **Steps:** Add a manual asset; edit name, class, value, currency, expected return, inclusion flag, and notes; save.
- **Expected:** One asset is created and all edited fields persist; totals, allocation, weighted return, Home, and Dashboard update consistently.

### UAT-PORT-03 — Asset validation and cancellation

- **Priority:** P1
- **Steps:** Attempt to save a blank name or negative manual value; make valid changes and close without saving.
- **Expected:** Invalid asset cannot be saved; cancellation preserves the original asset; no partial values affect totals.

### UAT-PORT-04 — Include and exclude an asset from FIRE

- **Priority:** P0
- **Steps:** Toggle a material asset from Included to Excluded and back.
- **Expected:** Total assets remain unchanged; included FIRE assets, progress, weighted return, countdown, and projection change appropriately; state persists after relaunch.

### UAT-PORT-05 — Auto-quote asset with valid cached quote

- **Priority:** P1
- **Steps:** Configure an asset for Auto quote with symbol and quantity; refresh or use available cached quote.
- **Expected:** Resolved value uses quote price × quantity or supplied converted value; quote source/status is shown; manual value remains available as fallback data.

### UAT-PORT-06 — Quote failure uses fallback instead of blanking Portfolio

- **Priority:** P0
- **Steps:** Configure an invalid/unreachable quote endpoint or go offline; trigger quote refresh; reopen Portfolio, Home, and Dashboard.
- **Expected:** Refresh failure is communicated; asset and portfolio values remain visible using the latest usable cache or manual value; no value becomes blank, zero without explanation, `NaN`, or corrupted.

### UAT-PORT-07 — Hide and reveal portfolio amounts

- **Priority:** P1
- **Steps:** Hide portfolio amounts; scroll through asset rows and summary; reveal them again.
- **Expected:** Summary and individual asset values are masked consistently; non-sensitive names/statuses remain usable; values return unchanged.

---

## H. FIRE plan, methods, and milestones — 4 cases

### UAT-PLAN-01 — Edit the complete FIRE plan

- **Priority:** P0
- **Steps:** Edit goal name, current age, monthly spending, monthly saving, withdrawal rate, inflation, and base currency where available; save and relaunch.
- **Expected:** Every user-owned FIRE input is editable and persists; target and projections recalculate; the same values appear through Portfolio, Dashboard, and Settings.

### UAT-PLAN-02 — Create, edit, default, and archive a projection method

- **Priority:** P0
- **Steps:** Create a method with return, inflation, withdrawal, saving, and spending adjustments; make it default; edit it; archive it.
- **Expected:** New method appears in selectors; effective assumptions equal base values plus adjustments with valid safety bounds; only one active method is default; archiving selects a valid remaining default.

### UAT-PLAN-03 — Protect the last active projection method

- **Priority:** P1
- **Steps:** Archive methods until one active method remains; attempt to archive the last one.
- **Expected:** The last active method cannot be removed, or the app automatically preserves a valid default; Dashboard never has an empty unusable method selector.

### UAT-PLAN-04 — Create, edit, hide, and archive milestones

- **Priority:** P1
- **Steps:** Create a milestone; edit name, target amount/date, expected-return override, active/hidden state; archive it.
- **Expected:** Portfolio/Settings lists and Home journey update correctly; ordering remains stable; hidden/archived milestones disappear from the journey without affecting assets or the main FIRE target.

---

## I. Settings, resilience, and accessibility — 5 cases

### UAT-SYS-01 — Theme, language, currency, and haptics preferences

- **Priority:** P1
- **Steps:** Toggle dark/light mode and haptics; switch English/Traditional Chinese; change display/base currency; navigate through all screens and relaunch.
- **Expected:** Preferences apply immediately and persist; navigation labels and core copy translate consistently; no clipped text or untranslated critical action appears; currency labels update without corrupting asset records.

### UAT-SYS-02 — Quote token and endpoint security

- **Priority:** P0
- **Steps:** Enter a quote endpoint and token; save; leave and reopen Settings; export data; inspect visible UI and export content.
- **Expected:** Token entry is obscured; saved token is not displayed in plain text, logs, exported CSV/TSV, or error messages; endpoint remains editable; empty token save does not overwrite a valid token unexpectedly.

### UAT-SYS-03 — Export CSV and Google Sheets-compatible data

- **Priority:** P1
- **Steps:** Export both formats after creating/editing/archiving representative records; open or inspect the shared files.
- **Expected:** Files are generated or a supported share fallback opens; headers and delimiters are valid; active financial data is accurate; notes with commas/tabs/newlines do not corrupt structure; secrets are excluded.

### UAT-SYS-04 — Local persistence, offline operation, and corrupted-storage recovery

- **Priority:** P0
- **Steps:** Create representative changes; fully terminate and relaunch; use core screens offline; where feasible inject/imitate invalid stored snapshot data and relaunch.
- **Expected:** Valid user changes persist across restart; Log, Calendar, Home, Dashboard, and manual Portfolio remain usable offline; unreadable storage recovers to a controlled seed/default state rather than crashing indefinitely.

### UAT-SYS-05 — Accessibility and destructive-action safety

- **Priority:** P1
- **Steps:** Use VoiceOver/TalkBack or platform accessibility inspection on navigation, amount input, date controls, category selection, transaction save/archive, asset inclusion, Settings controls, and modal close actions; activate Reset Demo Data deliberately.
- **Expected:** Critical controls have meaningful names, roles, selected/disabled state, and usable touch targets; focus is not trapped behind modals; Reset is clearly intentional and restores the seed consistently. If reset occurs from an accidental single tap without adequate warning or recoverability, log a Major defect.

---

# 6. Mandatory end-to-end journeys

These journeys reuse the test cases above; they are not additional case IDs.

## Journey 1 — New daily user

`UAT-NAV-01 → UAT-LOG-01 → UAT-CAL-01 → UAT-HOME-02 → UAT-DASH-02`

A user records spending and sees it correctly reflected in history, today’s impact, monthly cash flow, and FIRE projection.

## Journey 2 — Correct a historical mistake

`UAT-LOG-03 → UAT-CAL-03 → UAT-CAL-05 → UAT-CAL-06`

A user records a dated transaction, corrects all fields, moves it to another month, then archives it without leaving stale totals.

## Journey 3 — Build a personal FIRE plan

`UAT-PLAN-01 → UAT-PORT-02 → UAT-PORT-04 → UAT-DASH-01 → UAT-HOME-01`

A user configures assumptions and assets, controls FIRE inclusion, and receives consistent outputs across the app.

## Journey 4 — Compare planning methods

`UAT-PLAN-02 → UAT-DASH-03 → UAT-DASH-04 → UAT-DASH-05`

A user creates a projection method, compares outcomes, edits assumptions, and receives a controlled result under adverse conditions.

## Journey 5 — Quote integration failure

`UAT-PORT-05 → UAT-SYS-02 → UAT-PORT-06 → UAT-SYS-04`

A user configures quotes, encounters a failed endpoint/offline state, retains portfolio visibility through fallback data, and keeps working after restart.

## Journey 6 — Localize and export

`UAT-SYS-01 → UAT-LOG-02 → UAT-SYS-03 → UAT-SYS-05`

A user switches language/theme, records income, exports data, and completes the flow with accessible critical controls.

---

# 7. Execution and sign-off

Use `UAT_EXECUTION_TRACKER.csv` for results.

Allowed result values:

- `Pass`
- `Fail`
- `Blocked`
- `Not Run`

Release sign-off must include:

| Field                         | Value                       |
| ----------------------------- | --------------------------- |
| Build / commit                |                             |
| iOS result                    |                             |
| Android result                |                             |
| Web smoke result              |                             |
| P0 passed / total             |                             |
| P1 passed / total             |                             |
| Open Blocker/Critical defects |                             |
| Product approval              |                             |
| QA approval                   |                             |
| Final decision                | Go / Conditional Go / No-Go |

A failed case must include evidence, actual behavior, expected behavior, reproducibility, platform/build, severity, and a linked defect.
