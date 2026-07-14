# Fire Countdown v2 — End-to-End UAT Test Plan

**Document status:** Ready for execution  
**Prepared:** 2026-07-14  
**Application:** Fire Countdown v2  
**Primary platforms:** iOS and Android through Expo Go / development build  
**Secondary smoke platform:** Web  
**Suite size:** 100 detailed acceptance tests + 8 complete user journeys

---

## 1. Purpose

This document defines release-level user acceptance testing for the full Fire Countdown v2 experience. It validates that a user can record cash flow, review and edit history, understand FIRE progress, manage assets and planning assumptions, configure the app, export data, and recover safely from offline or integration failures.

The suite is based on the implemented product rules:

- Bottom navigation is `Home | Calendar | + | Dashboard | Portfolio`.
- The center `+` opens Log and is the default landing route.
- Settings is opened from Portfolio and is not a bottom tab.
- All user-owned financial inputs that affect FIRE remain editable.
- FIRE outputs are deterministic and update consistently across screens.
- Quote failures must preserve Portfolio values through cached or manual fallback data.
- The app is local-first and must persist user changes across restarts.

---

## 2. Acceptance decision

A build is accepted only when all of the following are true:

1. Every **P0** test passes on both iOS and Android.
2. No open defect causes data loss, incorrect FIRE calculations, navigation dead ends, inaccessible critical controls, or exposure of the quote API token.
3. At least 95% of **P1** tests pass, with any exception explicitly approved.
4. The eight end-to-end journeys complete without app restart, manual data repair, or developer intervention.
5. Web smoke testing has no blocker affecting launch, navigation, transaction entry, Calendar, Dashboard, Portfolio, or Settings.

### Severity

| Severity | Definition |
|---|---|
| Blocker | App cannot launch, data is lost/corrupted, core journey cannot complete, or financial output is materially wrong. |
| Critical | Major feature is unusable or produces inconsistent results, but another part of the app remains usable. |
| Major | Important behavior is incorrect or confusing; a workaround exists. |
| Minor | Cosmetic, copy, animation, spacing, or low-impact usability problem. |

### Priority

| Priority | Execution rule |
|---|---|
| P0 | Run on every release candidate on iOS and Android. |
| P1 | Run on every release candidate; may be risk-based on Web. |
| P2 | Run before production release and after major UI/data changes. |

---

## 3. Test environment and evidence

Record the following for every execution:

- Build identifier / commit SHA
- Device model, OS version, and platform
- Installation type: Expo Go, development build, or Web
- Network state: online, offline, or unreliable
- App language and theme
- Tester, date/time, result (`Pass`, `Fail`, `Blocked`, `Not Run`)
- Screenshot or screen recording for failures
- Defect link and severity

Recommended coverage:

| Matrix | Minimum coverage |
|---|---|
| iOS | One current iPhone-size device; one smaller viewport where available |
| Android | One current Android device; one smaller viewport where available |
| Web | Current Chrome or Edge smoke run |
| Theme | Dark and light |
| Language | English and Traditional Chinese |
| Network | Online, offline, failed quote endpoint |
| Persistence | Warm restart and full app termination/relaunch |

---

## 4. Baseline test data

Use **Settings → Maintenance → Reset demo data** before a clean baseline run.

Expected seed state:

- Theme: Dark
- Haptics: Enabled
- Currency: HKD
- Language: English
- Expense categories: Food, Transport
- Income categories: Salary, Dividend
- Transactions:
  - HKD 120 Food expense on 2026-06-29, note `Lunch`
  - HKD 5,000 Dividend income on 2026-06-28, note `ETF distribution`
  - HKD 48 Transport expense on 2026-06-27, note `MTR`
- Assets:
  - VOO ETF: included in FIRE, quote-capable, HKD 242,000 baseline value
  - Emergency Cash: included in FIRE, HKD 180,000
  - Primary Residence: excluded from FIRE, HKD 720,000
- FIRE goal:
  - Current age 31
  - Target monthly spending HKD 28,000
  - Withdrawal rate 3.5%
  - Inflation 2.5%
  - Monthly saving HKD 18,000
- Scenarios: Conservative, Base, Aggressive; Base is default
- Milestones: Coast FIRE, Halfway FIRE, Full FIRE

Do not hard-code the projected FIRE date in UAT evidence. Record the baseline displayed value, then verify directional and cross-screen consistency after each controlled change.

---

## 5. Full end-to-end user journeys

### Journey E2E-01 — Daily expense through full FIRE impact

1. Reset demo data and relaunch.
2. Confirm Log is the initial route.
3. Record a new Food expense for today with a note.
4. Open Calendar and verify the day amount, monthly expense, net, and transaction row.
5. Open Home and verify Today FIRE impact and progress reflect the expense.
6. Open Dashboard and verify saved cash flow, month net, Today impact, and category leader update consistently.
7. Terminate and relaunch the app.
8. Verify the transaction and all derived outputs persist.

**Acceptance:** One transaction is stored once, appears on the correct date, and produces consistent negative FIRE impact across Calendar, Home, and Dashboard after relaunch.

### Journey E2E-02 — Income correction and historical edit

1. Record an income transaction on a historical date.
2. Open Calendar and navigate to that month/date.
3. Edit amount, category, note, and date.
4. Save and verify the transaction moves to the new date.
5. Verify monthly summaries and Dashboard activity month recalculate.
6. Archive the transaction and verify it disappears from active totals without affecting unrelated records.

**Acceptance:** Edit and archive operations are reflected everywhere and no duplicate record remains.

### Journey E2E-03 — Category lifecycle

1. Create a new expense category with a name, icon, and color.
2. Confirm it becomes selected.
3. Record an expense using it.
4. Edit the category name/icon/color.
5. Verify the existing transaction displays the edited category presentation in Calendar and Dashboard.
6. Archive the category.
7. Verify it no longer appears for new Log entries while historical transactions remain understandable.

**Acceptance:** Category changes propagate without deleting or corrupting historical transactions.

### Journey E2E-04 — Asset and privacy workflow

1. Add a manual asset from Portfolio.
2. Edit its name, class, value, currency, expected return, FIRE inclusion, and notes.
3. Verify total assets, included assets, allocation, weighted return, Home, and Dashboard update.
4. Exclude and re-include the asset.
5. Hide asset amounts on Portfolio, then Home.
6. Relaunch and verify financial data persists and no hidden value is exposed while privacy mode is active on each screen.

**Acceptance:** Asset edits drive deterministic FIRE outputs and privacy controls mask values without altering data.

### Journey E2E-05 — FIRE plan, scenario, and milestone workflow

1. Edit current age, spending, savings, withdrawal rate, and inflation.
2. Create a new scenario with non-zero adjustments and set it as default.
3. Select the scenario on Dashboard and verify projection changes.
4. Create and edit a milestone.
5. Verify Home milestone journey updates.
6. Archive the scenario and milestone.
7. Verify a valid default scenario remains and archived items disappear from active UI.

**Acceptance:** Planning inputs remain editable and all dependent outputs update without invalid state.

### Journey E2E-06 — Quote success, failure, and fallback

1. Configure a valid quote bridge URL and token.
2. Refresh quotes successfully and verify quote-backed assets display updated values/status.
3. Disable connectivity or configure an invalid endpoint.
4. Refresh again and verify a failure status is shown.
5. Open Portfolio, Home, and Dashboard.

**Acceptance:** The app remains usable and asset/FIRE values never blank; cached or manual fallback values remain available.

### Journey E2E-07 — Localization, theme, export, and restart

1. Switch to light mode and Traditional Chinese.
2. Navigate all five tabs and Settings.
3. Export CSV and Google Sheets-compatible data.
4. Verify exported content contains key tables and user data, with no API token.
5. Terminate and relaunch.
6. Verify language, theme, currency, and financial data persist.

**Acceptance:** UI remains legible, localized, persistent, and exportable with no secret leakage.

### Journey E2E-08 — Offline local-first operation

1. Launch once online, then disable network.
2. Record, edit, and archive transactions.
3. Edit an asset and FIRE assumptions.
4. Navigate every tab and restart while offline.
5. Attempt quote refresh.
6. Re-enable network and confirm local data remains intact.

**Acceptance:** All local features work offline; quote failure is isolated and does not roll back or corrupt local changes.

---

# 6. Detailed UAT test cases

## A. Launch, routing, and navigation — 7 cases

| ID | P | Preconditions | Steps | Expected result |
|---|---:|---|---|---|
| UAT-NAV-001 | P0 | Fresh launch | Open the app from terminated state. | App launches without crash and lands on center `+` / Log. |
| UAT-NAV-002 | P0 | App launched | Tap Home, Calendar, `+`, Dashboard, Portfolio in sequence. | Each tab opens the correct screen; selected state is clear; no stale overlay blocks navigation. |
| UAT-NAV-003 | P1 | On any non-Log tab | Tap the center `+`. | Log opens and amount field receives focus after the screen settles. |
| UAT-NAV-004 | P0 | On Portfolio | Open Settings, then tap Done/back. | Settings opens as a modal/stack screen and returns to Portfolio without resetting state. |
| UAT-NAV-005 | P1 | Scrollable screen populated | Scroll, change tabs, return. | Screen renders correctly with no overlap from bottom navigation or safe-area clipping. |
| UAT-NAV-006 | P1 | Any modal/editor open | Use backdrop, close button, and Android back where applicable. | Modal closes predictably; no unsaved change is applied unless Save was used. |
| UAT-NAV-007 | P2 | Web build | Open direct root URL and navigate all routes. | Root redirects to Log; core screens render without route-not-found or browser console blocker. |

## B. Log transaction entry — 15 cases

| ID | P | Preconditions | Steps | Expected result |
|---|---:|---|---|---|
| UAT-LOG-001 | P0 | On Log | Enter `125.50`, choose Food expense, add note, confirm. | One expense is created with exact amount/category/note/date; form resets amount/note/date. |
| UAT-LOG-002 | P0 | On Log | Switch to Income, choose Salary, enter amount, confirm. | Income record is created and positive totals/impact update. |
| UAT-LOG-003 | P0 | On Log | Leave amount at 0 and tap Confirm. | No transaction is created and existing data is unchanged. |
| UAT-LOG-004 | P1 | On Log | Enter letters, currency symbols, spaces, and multiple decimal separators. | Input is normalized to digits and at most one effective decimal value. |
| UAT-LOG-005 | P1 | On Log | Enter `12.3456`. | Amount is limited to two decimal places for transaction entry. |
| UAT-LOG-006 | P1 | On Log | Enter more than 12 characters. | Input is capped without crash or layout break. |
| UAT-LOG-007 | P1 | On Log | Enter `1,25`. | Comma is normalized as decimal separator and saved as 1.25. |
| UAT-LOG-008 | P0 | On Log | Use previous/next day controls, then save. | Transaction is stored on the displayed selected date. |
| UAT-LOG-009 | P1 | On Log | Open date picker, select a distant past date, save. | Selected date is retained for the save and Calendar can locate it. |
| UAT-LOG-010 | P1 | Historical date selected | Use Today action in date picker. | Selected date returns to current local date. |
| UAT-LOG-011 | P1 | On Log | Enter note containing leading/trailing spaces. | Saved note is trimmed; whitespace-only note becomes no note. |
| UAT-LOG-012 | P1 | On Log | Enter more than 120 note characters. | Input stops at 120 characters and app remains responsive. |
| UAT-LOG-013 | P0 | Valid goal/assets exist | Compare impact preview for same amount as expense vs income. | Expense delays FIRE; income advances FIRE; values are finite or clearly indicate no crossover. |
| UAT-LOG-014 | P1 | On Log with expense selected | Switch to income and back. | Category list changes to matching transaction type and active category is valid. |
| UAT-LOG-015 | P0 | Rapid interaction | Tap Confirm repeatedly after entering one valid transaction. | The app must not create unintended duplicate transactions; any duplicate behavior is a release defect. |

## C. Category lifecycle — 7 cases

| ID | P | Preconditions | Steps | Expected result |
|---|---:|---|---|---|
| UAT-CAT-001 | P0 | On Log | Add a new expense category with valid name/icon/color. | Category is created, visible, and selected for the current expense type. |
| UAT-CAT-002 | P1 | New category exists | Save a transaction using it. | Transaction stores the category and displays its glyph/name in Calendar. |
| UAT-CAT-003 | P0 | Category selected | Edit name, icon, and color. | Updated presentation appears in Log and historical transaction views. |
| UAT-CAT-004 | P1 | Category editor open | Clear the category name and attempt Save. | Invalid empty category is not saved. |
| UAT-CAT-005 | P0 | At least two categories of same type | Archive the selected category. | Category disappears from active choices and another valid category becomes selected. |
| UAT-CAT-006 | P1 | Archived category has historical transaction | Open the historical transaction. | Transaction remains present and data is not deleted; UI handles archived category safely. |
| UAT-CAT-007 | P1 | Income selected | Create an income category, then switch to expense. | Income category appears only for income; expense list is unaffected. |

## D. Calendar and transaction history — 12 cases

| ID | P | Preconditions | Steps | Expected result |
|---|---:|---|---|---|
| UAT-CAL-001 | P0 | Seed data | Open Calendar for June 2026. | Monthly income, expense, and net equal active transactions for that month. |
| UAT-CAL-002 | P0 | Month contains transactions | Inspect corresponding dates. | Each date cell shows correct signed daily net and color/tone. |
| UAT-CAL-003 | P1 | On Calendar | Navigate previous/next month. | Month title, grid, and summary change to selected month. |
| UAT-CAL-004 | P1 | On Calendar | Navigate previous/next year. | Calendar moves exactly 12 months without invalid dates or duplicated heading. |
| UAT-CAL-005 | P1 | Away from current month | Tap Today. | Calendar selects today and returns to current month. |
| UAT-CAL-006 | P0 | Select date with records | Tap a transaction row. | Editor opens with exact stored type, amount, category, date, currency, and note. |
| UAT-CAL-007 | P0 | Transaction editor open | Change amount and note; save. | Row and all affected summaries update once; changes persist. |
| UAT-CAL-008 | P0 | Transaction editor open | Change expense to income. | Category resets to a valid income category and totals/impact change sign correctly. |
| UAT-CAL-009 | P0 | Transaction editor open | Move transaction to another valid ISO date. | Editor closes; selected date moves to new date; old date no longer includes record. |
| UAT-CAL-010 | P1 | Transaction editor open | Enter zero amount or invalid date. | Save is disabled; invalid data is not persisted. |
| UAT-CAL-011 | P0 | Transaction editor open | Archive transaction. | Transaction disappears from active list, day net, month summary, Home, and Dashboard totals. |
| UAT-CAL-012 | P1 | Date has no active records | Select date. | Clear empty-state message appears; editor is not opened. |

## E. Home — 7 cases

| ID | P | Preconditions | Steps | Expected result |
|---|---:|---|---|---|
| UAT-HOME-001 | P0 | Seed data | Open Home. | Countdown ring, progress, target caption, net worth, included FIRE assets, Today impact, and milestones render. |
| UAT-HOME-002 | P1 | Home open | Tap countdown ring. | Animation replays without changing numeric values. |
| UAT-HOME-003 | P1 | Leave and return to Home | Re-enter Home or tap active tab. | Ring animation can replay and no duplicate component appears. |
| UAT-HOME-004 | P0 | Home open | Tap net worth/included assets to hide. | Both displayed asset amounts become masked and accessibility state changes. |
| UAT-HOME-005 | P0 | Values hidden | Tap again. | Exact values return; underlying data is unchanged. |
| UAT-HOME-006 | P0 | Create expense then income today | Return to Home after each. | Today impact changes in the correct direction and matches Dashboard. |
| UAT-HOME-007 | P0 | Edit assets/FIRE assumptions/milestones | Return to Home. | Progress, countdown, totals, target caption, and milestone journey reflect current data. |

## F. Dashboard — 11 cases

| ID | P | Preconditions | Steps | Expected result |
|---|---:|---|---|---|
| UAT-DASH-001 | P0 | Seed data | Open Dashboard. | Wealth chart, projected FIRE, progress, included assets, cash-flow metrics, leaders, and assumptions render. |
| UAT-DASH-002 | P0 | Three scenarios active | Select Conservative, Base, Aggressive. | Selected scenario is clear and projection/assumptions update deterministically. |
| UAT-DASH-003 | P0 | Note baseline | Switch from Conservative to Aggressive. | Projection direction is consistent with higher return/saving and lower target-spending adjustments. |
| UAT-DASH-004 | P0 | Add current-month expense | Return to Dashboard. | Month net, saved cash flow, Today impact, and most-spending leader update consistently. |
| UAT-DASH-005 | P0 | Add current-month income | Return to Dashboard. | Month net and most-earning leader update consistently. |
| UAT-DASH-006 | P1 | Latest transaction is historical month | Open Dashboard. | Activity month badge and category leaders reflect the latest active transaction’s month. |
| UAT-DASH-007 | P0 | Tap Included Assets assumption | Follow navigation. | Portfolio opens; editing inclusion changes Dashboard value after return. |
| UAT-DASH-008 | P0 | Tap savings/rate/inflation/spending/target chip | Edit and save. | Correct FIRE plan editor opens and Dashboard recalculates. |
| UAT-DASH-009 | P0 | Open scenario list | Create/edit a scenario. | New values appear in selection controls and affect projection. |
| UAT-DASH-010 | P1 | Projection cannot cross target under extreme valid assumptions | Save assumptions. | Dashboard clearly shows no crossover/not reached without NaN, Infinity, or crash. |
| UAT-DASH-011 | P1 | Current age unset | Open Dashboard. | Projection remains available where possible; age badge shows not set rather than invalid age. |

## G. Portfolio and assets — 14 cases

| ID | P | Preconditions | Steps | Expected result |
|---|---:|---|---|---|
| UAT-PORT-001 | P0 | Seed data | Open Portfolio. | Total assets include all active assets; included FIRE amount excludes Primary Residence. |
| UAT-PORT-002 | P0 | Seed data | Inspect VOO, cash, residence. | Value source badges correctly identify quote, manual fallback, or manual source. |
| UAT-PORT-003 | P1 | Portfolio open | Tap allocation card and re-enter tab. | Allocation animation replays; allocation totals remain unchanged. |
| UAT-PORT-004 | P0 | Portfolio open | Tap Add. | A new Manual Asset is created with default data and appears once. |
| UAT-PORT-005 | P0 | Manual Asset exists | Edit name, class, value, currency, expected return, notes. | Saved values display correctly and persist. |
| UAT-PORT-006 | P1 | Asset editor open | Blank the name. | Save is disabled or ignored; empty-name asset is not persisted. |
| UAT-PORT-007 | P1 | Asset editor open | Enter negative manual value. | Invalid negative value cannot be saved. |
| UAT-PORT-008 | P1 | Asset editor open | Enter negative expected return and valid value. | Negative return is accepted as a percentage and is reflected in weighted return. |
| UAT-PORT-009 | P0 | Asset included | Tap Included/Excluded control. | Included FIRE assets, Home, and Dashboard update immediately; total assets remain unchanged. |
| UAT-PORT-010 | P0 | Asset excluded | Re-include asset. | Included FIRE assets and projections restore consistently. |
| UAT-PORT-011 | P0 | Portfolio open | Hide asset amounts. | Hero and asset values are masked without changing inclusion or calculations. |
| UAT-PORT-012 | P1 | Quote-capable asset | Change update method between Manual and Auto quote. | Relevant fields/status are retained safely and chosen source is reflected after save. |
| UAT-PORT-013 | P1 | Auto quote selected | Enter ticker, Google Finance symbol, and quantity. | Fields save, reopen correctly, and no secret/token is stored in asset notes. |
| UAT-PORT-014 | P0 | Edit asset value or expected return | Check Portfolio, Home, Dashboard. | Total, included amount, allocation, weighted return, progress, and projection remain mutually consistent. |

## H. FIRE plan, scenarios, and milestones — 11 cases

| ID | P | Preconditions | Steps | Expected result |
|---|---:|---|---|---|
| UAT-FIRE-001 | P0 | Open FIRE plan editor | Change current age and save. | Age appears in Portfolio/Settings and projected FIRE age recalculates. |
| UAT-FIRE-002 | P0 | FIRE plan editor | Change target monthly spending. | Derived FIRE target updates from spending and withdrawal rate; projections update. |
| UAT-FIRE-003 | P0 | FIRE plan editor | Change monthly saving. | Higher saving does not delay FIRE under otherwise identical data. |
| UAT-FIRE-004 | P0 | FIRE plan editor | Change withdrawal rate. | Target amount and projection update consistently; rate cannot produce divide-by-zero output. |
| UAT-FIRE-005 | P1 | FIRE plan editor | Enter commas, symbols, excessive decimals, and long numeric strings. | Inputs normalize within field limits; saved model contains finite numbers. |
| UAT-FIRE-006 | P0 | Scenario list | Create a named scenario with all adjustments. | Scenario appears once and can be selected on Dashboard. |
| UAT-FIRE-007 | P0 | Multiple scenarios | Set a non-default scenario as default. | Exactly one active default remains. |
| UAT-FIRE-008 | P0 | Default scenario selected | Archive it. | Another active scenario becomes default and Dashboard remains usable. |
| UAT-FIRE-009 | P0 | Only one active scenario remains | Open editor. | Archive action is unavailable; app cannot reach zero active scenarios. |
| UAT-FIRE-010 | P0 | Milestone list | Create/edit name, target amount, date, return override, active/hidden state. | Home milestone journey reflects only active, visible, non-archived milestones in order. |
| UAT-FIRE-011 | P0 | Existing milestone | Archive milestone. | It disappears from active lists/Home without changing unrelated goal or scenario data. |

## I. Settings, quote bridge, export, and reset — 10 cases

| ID | P | Preconditions | Steps | Expected result |
|---|---:|---|---|---|
| UAT-SET-001 | P0 | Settings open | Toggle dark/light. | Theme changes immediately; light mode uses readable off-white surfaces and sufficient contrast. |
| UAT-SET-002 | P1 | Physical device | Toggle haptics off/on and use pressable controls. | Haptics follow setting; controls still work when disabled. |
| UAT-SET-003 | P0 | Settings open | Change display/base currency. | Snapshot and goal base currency change; displays use selected currency consistently without changing raw asset records unexpectedly. |
| UAT-SET-004 | P0 | Settings open | Switch English ↔ Traditional Chinese. | All primary navigation, screens, editors, and actions update; no mixed-language blocker or truncation. |
| UAT-SET-005 | P0 | Quote bridge configured | Save API token. | Token field clears after save; token is not displayed, exported, logged, or persisted in ordinary snapshot data. |
| UAT-SET-006 | P0 | Valid endpoint/token | Tap Test refresh. | Positive status appears and quote cache/assets update without duplicate cache rows. |
| UAT-SET-007 | P0 | Invalid endpoint/offline | Tap Test refresh. | Negative status appears; Portfolio values remain available from cache/manual fallback. |
| UAT-SET-008 | P0 | User data modified | Export CSV. | Share/file flow opens; CSV contains key FIRE tables and current user data, with no token. |
| UAT-SET-009 | P1 | User data modified | Export Google Sheets-compatible file. | TSV/share flow opens and tabular content is importable, with no token. |
| UAT-SET-010 | P0 | Data modified | Tap Reset demo data, then inspect all screens. | Snapshot returns to documented seed state; app remains stable and old active data is gone. |

## J. Persistence, resilience, privacy, accessibility, and cross-platform — 6 cases

| ID | P | Preconditions | Steps | Expected result |
|---|---:|---|---|---|
| UAT-NFR-001 | P0 | Modify transactions/assets/settings | Fully terminate and relaunch. | All committed changes persist; unsaved editor drafts do not. |
| UAT-NFR-002 | P0 | App loaded once | Disable network; create/edit/archive local data and restart. | Local operations and navigation remain functional offline. |
| UAT-NFR-003 | P0 | Corrupt or unavailable quote response | Refresh and navigate Portfolio/Home/Dashboard. | No blank asset portfolio, NaN, Infinity, crash, or lost manual fallback. |
| UAT-NFR-004 | P1 | Screen reader enabled | Navigate tabs and critical controls. | Controls have meaningful labels, selected/disabled states, and logical focus order. |
| UAT-NFR-005 | P1 | Large text / small viewport | Navigate all screens and open editors. | Critical values/actions remain reachable; no unrecoverable clipping or overlap. |
| UAT-NFR-006 | P1 | iOS, Android, Web smoke | Execute E2E-01 and E2E-04. | Core behavior is functionally equivalent; platform-specific keyboard/share/back behavior is safe. |

---

## 7. Deterministic FIRE consistency checks

For controlled changes, record values before and after and confirm these invariants:

1. **Expense:** current cash-flow adjustment decreases and projected FIRE should not improve.
2. **Income:** current cash-flow adjustment increases and projected FIRE should not worsen.
3. **Higher included asset value:** included FIRE assets increase and progress should not decrease.
4. **Exclude asset:** total assets stay constant while included FIRE assets fall.
5. **Higher monthly saving:** projected FIRE should not move later under identical assumptions.
6. **Higher target spending:** FIRE target rises and projected FIRE should not improve.
7. **Higher withdrawal rate:** derived target falls, subject to the minimum valid rate.
8. **Scenario switch:** all displayed assumptions and projection use the same selected scenario.
9. **Archive:** archived transactions/categories/scenarios/milestones are excluded from active calculations and lists as designed.
10. **Cross-screen equality:** Home, Dashboard, and Portfolio must show the same included asset total and compatible progress/target values.

Any NaN, Infinity, negative target caused by valid UI input, stale derived value, or disagreement across screens is a **Blocker/Critical** defect.

---

## 8. Exploratory charters

After scripted execution, spend at least 20 minutes on each charter:

1. **Rapid interaction:** fast tab switching, repeated taps, modal open/close, keyboard show/hide.
2. **Boundary finance data:** zero, very large values, negative expected returns, extreme valid rates, many assets/transactions.
3. **Date boundaries:** month-end, year-end, leap day, timezone transition, future and historical dates.
4. **Data longevity:** create 50+ transactions, 20+ assets, 10+ scenarios/milestones; assess responsiveness and correctness.
5. **Privacy:** screenshots, app switcher, masked amounts, secure token field, exports.
6. **Localization:** Traditional Chinese on small display with large text.
7. **Offline recovery:** launch offline, edit repeatedly, reconnect, refresh quotes.

---

## 9. Execution record template

Copy this row for each test result or track results in the pull request/checklist:

| Test ID | Platform/device | Build SHA | Result | Evidence | Defect | Tester | Date |
|---|---|---|---|---|---|---|---|
| UAT-XXX-000 |  |  | Not Run |  |  |  |  |

### Final sign-off

| Role | Name | Decision | Date | Notes |
|---|---|---|---|---|
| Product owner |  |  |  |  |
| QA/UAT lead |  |  |  |  |
| Engineering |  |  |  |  |

**Release decision:** `Accepted / Accepted with conditions / Rejected`
