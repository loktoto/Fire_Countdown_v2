# 0 - UI/UX

## Iteration tracker

### Round 1

- [x] Home — completed (light + dark, top/middle/bottom, all modules)
- [x] Calendar — completed (light + dark, empty + populated date, all modules)
- [x] Log — completed (light + dark, empty + populated, keyboard + sheets, all modules)
- [x] Dashboard — completed (light + dark, chart + cashflow + assumptions + editors, all modules)
- [x] Portfolio — completed (light + dark, privacy + allocation + assets + editors + settings, all modules)

Home final evidence:

- Light: `tmp/uiux-round1-20260723/01-home-light-top-after.png`, `01-home-light-mid-after.png`, `01-home-light-bottom-final2.png`
- Dark: `tmp/uiux-round1-20260723/01-home-dark-top-after.png`, `01-home-dark-mid-after.png`, `01-home-dark-bottom-final.png`
- Validation: TypeScript, ESLint, Prettier, 21 Jest suites / 103 tests

Calendar final evidence:

- Light: `tmp/uiux-round1-20260723/02-calendar-light-top-final.png`, `02-calendar-light-empty-detail-final.png`, `02-calendar-light-entry-final4.png`
- Dark: `tmp/uiux-round1-20260723/02-calendar-dark-top-final.png`, `02-calendar-dark-entry-final.png`
- Validation: TypeScript, ESLint, Prettier, 21 Jest suites / 103 tests

Log final evidence:

- Light: `tmp/uiux-round1-20260723/03-log-light-final-top.png`, `03-log-light-final-bottom.png`, `03-log-light-final-date-sheet.png`, `03-log-light-final-category-sheet.png`, `03-log-light-final-category-sheet-bottom.png`
- Dark: `tmp/uiux-round1-20260723/03-log-dark-final-top.png`, `03-log-dark-final-bottom.png`, `03-log-dark-final-keyboard.png`, `03-log-dark-final-populated.png`, `03-log-dark-date-sheet2.png`, `03-log-dark-category-sheet.png`
- Validation: TypeScript, ESLint, Prettier, 21 Jest suites / 105 tests

Dashboard final evidence:

- Light: `tmp/uiux-round1-20260723/04-dashboard-light-final-top2.png`, `04-dashboard-light-final-mid.png`, `04-dashboard-light-final-bottom.png`, `04-dashboard-light-final-scenario-list.png`, `04-dashboard-light-final-scenario-editor.png`, `04-dashboard-light-final-scenario-editor-secondary.png`, `04-dashboard-light-final-scenario-editor-secondary-bottom.png`, `04-dashboard-light-final-fire-plan-editor.png`
- Dark: `tmp/uiux-round1-20260723/04-dashboard-dark-final-top.png`, `04-dashboard-dark-final-mid.png`, `04-dashboard-dark-final-bottom.png`, `04-dashboard-dark-final-scenario-list.png`, `04-dashboard-dark-final-scenario-editor.png`, `04-dashboard-dark-final-fire-plan-editor.png`
- Validation: TypeScript, ESLint, Prettier, 21 Jest suites / 106 tests

Portfolio final evidence:

- Light: `tmp/uiux-round1-20260723/05-portfolio-light-final-top.png`, `05-portfolio-light-final-assets1.png`, `05-portfolio-light-final-assets2.png`, `05-portfolio-light-final-private.png`, `05-portfolio-light-final-private-assets.png`, `05-portfolio-asset-editor-light-final-top.png`, `05-portfolio-asset-editor-light-final-bottom.png`, `05-portfolio-asset-editor-light-final-keyboard.png`, `05-portfolio-methods-light-final.png`, `05-portfolio-milestones-light-final.png`, `05-portfolio-milestone-editor-light-final-top.png`, `05-portfolio-fire-plan-light-final.png`, `05-portfolio-settings-light-final-top.png`, `05-portfolio-settings-light-final-mid.png`, `05-portfolio-settings-light-final-bottom.png`
- Dark: `tmp/uiux-round1-20260723/05-portfolio-dark-final-top.png`, `05-portfolio-dark-final-assets1.png`, `05-portfolio-dark-final-assets2.png`, `05-portfolio-asset-editor-dark-final-top.png`, `05-portfolio-asset-editor-dark-final-bottom.png`, `05-portfolio-methods-dark-final.png`, `05-portfolio-milestones-dark-final.png`, `05-portfolio-settings-dark-final-top.png`, `05-portfolio-settings-dark-final-mid.png`, `05-portfolio-settings-dark-final-bottom.png`
- Validation: TypeScript, ESLint, Prettier, 21 Jest suites / 106 tests

### Round 2

- [x] Home — completed (light + dark, top/middle/bottom, wording + accessibility + iPhone-width logic, all modules)
- [x] Calendar — completed (light + dark, grid + empty/populated days + editor + date picker, all modules)
- [x] Log — completed (light + dark, empty/populated + keyboard + all pickers/editors, wording + accessible category states)
- [x] Dashboard — completed (light + dark, forecast/chart/tooltip + cashflow + assumptions + all method/plan editors)
- [x] Portfolio — completed (light + dark, privacy + allocation + assets + all asset/method/milestone/plan editors + settings)

Home Round 2 final evidence:

- Light: `tmp/uiux-round2-20260723/01-home-light-top-after.png`, `01-home-light-mid-after.png`, `01-home-light-bottom-after.png`
- Dark: `tmp/uiux-round2-20260723/01-home-dark-top-after.png`, `01-home-dark-mid-after.png`, `01-home-dark-bottom-after.png`
- iPhone-first layout: 393dp summary stacking and large-text behavior covered by `src/components/__tests__/milestonePresentation.test.ts`; the temporary density switch was restored to the original 420dpi and its Expo loading screen was excluded from product evidence
- Research: Apple iOS design, accessibility, typography, motion, and React Native accessibility / window-dimension guidance
- Validation: TypeScript, ESLint, Prettier, 22 Jest suites / 108 tests

Calendar Round 2 final evidence:

- Light: `tmp/uiux-round2-20260723/02-calendar-light-final-header.png`, `02-calendar-light-final-top.png`, `02-calendar-light-final-populated.png`, `02-calendar-light-final-empty-today.png`, `02-calendar-light-final-editor.png`, `02-calendar-light-final-date-picker.png`
- Dark: `tmp/uiux-round2-20260723/02-calendar-dark-final-top.png`, `02-calendar-dark-final-empty.png`, `02-calendar-dark-final-populated.png`, `02-calendar-dark-final-list.png`, `02-calendar-dark-final-editor.png`, `02-calendar-dark-final-date-picker.png`, `02-calendar-dark-final-editor-keyboard.png`
- iPhone-first layout: narrow-iPhone transaction stacking and large-text calendar behavior covered by `src/components/__tests__/calendarPresentation.test.ts`
- Accessibility: Today is included in the date-cell label; selected state, contextual summary values, date picker, and editor controls verified in the runtime hierarchy
- Research: Apple lists and tables, pickers, focus and selection, accessibility/color, and React Native accessibility guidance
- Validation: TypeScript, ESLint, Prettier, 23 Jest suites / 110 tests

Log Round 2 final evidence:

- Light: `tmp/uiux-round2-20260723/03-log-light-final-header.png`, `03-log-light-final-bottom.png`, `03-log-light-populated.png`, `03-log-light-populated-keyboard.png`, `03-log-light-income.png`, `03-log-light-date-picker.png`, `03-log-light-add-category.png`, `03-log-light-manage-category.png`, `03-log-light-companion-picker.png`, `03-log-light-destination-picker.png`, `03-log-light-food-selected-after.png`
- Dark: `tmp/uiux-round2-20260723/03-log-dark-final-header.png`, `03-log-dark-final-bottom.png`, `03-log-dark-empty-final.png`, `03-log-dark-empty-keyboard.png`, `03-log-dark-date-picker.png`, `03-log-dark-add-category.png`, `03-log-dark-manage-category.png`, `03-log-dark-companion-picker.png`, `03-log-dark-destination-picker.png`
- Empty-state semantics: the unexplained `0%` bubble is hidden until a positive amount exists; the preview now explains that entering an amount reveals FIRE impact
- Category states: selected chips use a contrast-safe category container/on-category pair, 2px outline, and check icon; labels and symbols meet 4.5:1 and the selected boundary meets at least 3:1 in tested light/dark palettes
- Wording: `Preview how this entry moves your FIRE date`, `Manage`, and `Add category` now match the action each control performs
- iPhone-first input behavior: the existing iOS decimal pad accessory/Done flow and shared IME-aware `ScreenScaffold` remain the single keyboard-clearance path; Android runtime keyboard/focus evidence was captured without saving
- Research: Apple HIG Accessibility and Color; Google Material 3 container/on-container roles and selected-chip check state; WCAG 2.2 non-text contrast
- Related Portfolio correction requested during this pass: allocation ledger pseudo-bars were replaced with legend dots because proportional length is already encoded by the stacked ruler (`tmp/uiux-round2-20260723/05-portfolio-light-allocation-dots-after.png`); this was carried through the completed Portfolio Round 2 module audit
- Validation: TypeScript, ESLint, Prettier, 24 Jest suites / 116 tests

Dashboard Round 2 final evidence:

- Light: `tmp/uiux-round2-20260723/04-dashboard-light-final-top.png`, `04-dashboard-light-final-tooltip.png`, `04-dashboard-light-final-mid.png`, `04-dashboard-light-final-bottom.png`, `04-dashboard-light-scenario-list-final.png`, `04-dashboard-light-scenario-editor-secondary-top-final.png`, `04-dashboard-light-scenario-editor-secondary-bottom-final.png`, `04-dashboard-light-fire-plan-editor-final.png`
- Dark: `tmp/uiux-round2-20260723/04-dashboard-dark-final-top.png`, `04-dashboard-dark-final-tooltip.png`, `04-dashboard-dark-final-mid.png`, `04-dashboard-dark-final-bottom.png`, `04-dashboard-dark-scenario-list-before.png`, `04-dashboard-dark-scenario-editor-top-before.png`, `04-dashboard-dark-scenario-editor-secondary-before.png`, `04-dashboard-dark-scenario-editor-secondary-bottom-before.png`, `04-dashboard-dark-fire-plan-editor-top-before.png`
- Wording: decimal `36.3 years` is now `36 years · 4 months`; `Age 68` is `FIRE age 68`; generic `Progress` is `FIRE target funded`; `Monthly saving` is consistently `Monthly savings`; the chart tooltip is `Portfolio projection`
- Selection and accessibility: the active FIRE method now includes a visible check plus programmatic selected state; the funding rail exposes progressbar semantics; chart adjustment announces date, age, portfolio value, and FIRE target with previous/next-month actions
- iPhone-first layout: 393dp forecast stacking, 411dp Android behavior, tablet layout, large-text stacking, and duration formatting are covered by `src/components/__tests__/dashboardPresentation.test.ts`
- Research: Apple HIG Charts and Accessibility; Google Material 3 segmented buttons and determinate progress accessibility; WCAG 2.2 use-of-color and non-text contrast
- Validation: TypeScript, ESLint, Prettier, 25 Jest suites / 123 tests

Portfolio Round 2 final evidence:

- Light: `tmp/uiux-round2-20260723/05-portfolio-light-final-top.png`, `05-portfolio-light-final-allocation.png`, `05-portfolio-light-final-assets.png`, `05-portfolio-light-final-bottom.png`, `05-portfolio-light-final-private-top.png`, `05-portfolio-light-final-private-assets.png`, `05-portfolio-light-final-asset-editor-selected.png`, `05-portfolio-light-final-asset-editor-bottom-selected.png`, `05-portfolio-light-final-methods.png`, `05-portfolio-light-final-milestones.png`, `05-portfolio-light-final-milestone-editor.png`, `05-portfolio-light-final-fire-plan-editor.png`, `05-portfolio-light-final-settings-top.png`, `05-portfolio-light-final-settings-mid.png`, `05-portfolio-light-final-settings-bottom.png`
- Dark: `tmp/uiux-round2-20260723/05-portfolio-dark-final-top.png`, `05-portfolio-dark-final-allocation.png`, `05-portfolio-dark-final-assets.png`, `05-portfolio-dark-final-bottom.png`, `05-portfolio-dark-final-asset-editor-selected.png`, `05-portfolio-dark-final-asset-editor-bottom-selected.png`, `05-portfolio-dark-final-methods.png`, `05-portfolio-dark-final-milestones.png`, `05-portfolio-dark-final-milestone-editor.png`, `05-portfolio-dark-final-fire-plan-editor.png`, `05-portfolio-dark-final-settings-top.png`, `05-portfolio-dark-final-settings-mid.png`, `05-portfolio-dark-final-settings-bottom.png`
- Allocation semantics: the stacked ruler remains the only length-encoded percentage visualization; equal-length ledger marks were replaced with compact color dots beside explicit percentages so the legend cannot imply false magnitude
- Selection and accessibility: selected asset class, currency, and quote-method chips include a visible check plus border/tint and programmatic selected state; quote status announces updates; refresh, quick actions, inclusion switches, and inline amount edits now meet intended mobile hit-area behavior
- Wording: milestone target date and expected-return override explicitly say `Optional`; the override label explains that it replaces the method-derived return
- iPhone-first layout: 393dp iPhone, 411dp Android, tablet, and large-text behavior are covered by `src/components/__tests__/portfolioPresentation.test.ts`
- Research: Apple HIG Charts, Accessibility, Privacy, and design principles; Google Android accessibility, cards, lists, chips, and semantics guidance; WCAG 2.2 use-of-color and non-text contrast
- Validation: TypeScript, ESLint, Prettier, 26 Jest suites / 127 tests

### Round 3

- [x] Home — completed (light + dark, countdown + workday + assets + monthly progress + full milestone journey)
- [x] Calendar — completed (light + dark, month grid + empty/populated days + entry editor + date picker)
- [x] Log - completed (light + dark, amount/type/date/note + FIRE impact + categories + add/manage editor + companion/destination pickers)
- [x] Dashboard - completed (light + dark, forecast/chart/tooltip + cashflow + assumptions + method list/editor + FIRE plan editor)
- [x] Portfolio - completed (light + dark, privacy + allocation + assets + add/edit asset + methods/milestones/FIRE plan + settings)

Home Round 3 final evidence:

- Light: `tmp/uiux-round3-20260724/01-home-light-round3-top-after.png`, `01-home-light-round3-mid.png`, `01-home-light-round3-end.png`
- Dark: `tmp/uiux-round3-20260724/01-home-dark-round3-top-after.png`, `01-home-dark-round3-mid.png`, `01-home-dark-round3-end.png`
- Countdown semantics: the decorative endpoint circle was removed so the determinate clockwise arc ends in a standard rounded cap instead of resembling a draggable slider handle; the central signature ring, replay animation, numeric caption, reduced-motion behavior, and progressbar accessibility value remain intact
- Research: Apple HIG Progress Indicators, Activity Rings, Accessibility, and design principles; Google Material 3 progress indicators plus Android progress and custom-semantics guidance
- Validation: TypeScript, ESLint, Prettier, 26 Jest suites / 127 tests

Calendar Round 3 final evidence:

- Light: `tmp/uiux-round3-20260724/02-calendar-light-round3-top-after.png`, `02-calendar-light-round3-empty.png`, `02-calendar-light-round3-list.png`, `02-calendar-light-round3-editor-after.png`, `02-calendar-light-round3-date-picker-after.png`
- Dark: `tmp/uiux-round3-20260724/02-calendar-dark-round3-top-after.png`, `02-calendar-dark-round3-empty.png`, `02-calendar-dark-round3-list.png`, `02-calendar-dark-round3-editor-after.png`, `02-calendar-dark-round3-date-picker-after.png`
- Category selection: the Calendar entry editor now uses the shared contrast-safe category container/on-category pair, 2px selected boundary, visible check, and selected accessibility state; the icon, label, border, and check use one coherent safe foreground role in both appearances
- Navigation affordance: enabled previous/next month and year icons now share the active accent in both the main calendar and date picker, avoiding disabled-looking double-chevron controls while retaining distinct icons and accessibility labels
- Research: Apple HIG Accessibility, Color, and Focus and Selection; Google Android Material Chip checked-icon guidance and selectable-control semantics; WCAG 2.2 use-of-color and contrast
- Validation: TypeScript, ESLint, Prettier, 26 Jest suites / 127 tests

Log Round 3 final evidence:

- Light: `tmp/uiux-round3-20260724/03-log-light-round3-top-before.png`, `03-log-light-round3-add-category-after.png`, `03-log-light-round3-manage-category-after.png`, `03-log-light-round3-date-picker-after.png`, `03-log-light-round3-companion-after.png`, `03-log-light-round3-destination-after.png`
- Dark: `tmp/uiux-round3-20260724/03-log-dark-round3-top-after.png`, `03-log-dark-round3-add-category-after.png`, `03-log-dark-round3-manage-category-after.png`, `03-log-dark-round3-date-picker-after.png`, `03-log-dark-round3-companion.png`, `03-log-dark-round3-destination.png`
- Category selection: Log category chips retain the shared contrast-safe selected container, 2px boundary, coherent icon/label color, check glyph, and selected accessibility state in both appearances
- Symbol editor: selected symbols now use the same contrast-safe foreground/background pair, a 2px boundary, and a check glyph instead of relying on border colour alone
- Existing icon preservation: built-in categories whose original icon is not in the preset grid now receive a first selectable current-icon option, so editing Food, Transport, Salary, or other legacy/custom symbols always shows the real saved symbol as selected and never silently replaces it
- Module audit: amount, expense/income control, day stepping and calendar picker, optional note, FIRE impact animation, category add/manage/delete/save paths, companion picker, destination picker, disabled save state, light mode, and dark mode were visually checked
- Research: Apple HIG Accessibility, Color, Lists and Tables, Focus and Selection, and Differentiate Without Color Alone; Google Android Material 3 FilterChip checked-icon, selected container/content colour, and selected-border guidance
- Validation: TypeScript, ESLint, Prettier, 26 Jest suites / 127 tests

Dashboard Round 3 final evidence:

- Light: `tmp/uiux-round3-20260724/04-dashboard-light-round3-top-after.png`, `04-dashboard-light-round3-bottom-after.png`, `04-dashboard-light-round3-method-list-after.png`, `04-dashboard-light-round3-scenario-editor-after.png`, `04-dashboard-light-round3-fire-plan-editor-after.png`
- Dark: `tmp/uiux-round3-20260724/04-dashboard-dark-round3-recovered-top.png`, `04-dashboard-dark-round3-bottom-after.png`, `04-dashboard-dark-round3-method-list-after2.png`, `04-dashboard-dark-round3-scenario-editor-after.png`, `04-dashboard-dark-round3-fire-plan-editor-after.png`
- Method-limit semantics: when all three FIRE methods exist, the former full-width disabled CTA is now a compact non-interactive status row with a check icon and the direct wording `3 of 3 FIRE methods`; when capacity is available, the control remains a clear tonal `+ Add FIRE method` action
- Module audit: scenario switcher, estimated FIRE date, funded progress, FIRE assets/target, projection chart and tooltip, post-FIRE explanation, monthly cashflow/leaders, assumption links, three-method comparison, scenario editor, and base FIRE-plan editor were visually checked in both appearances
- Research: Apple HIG Accessibility, Color, Focus and Selection, and Lists and Tables; Google Material 3 button, list, and status/semantics guidance
- Validation: TypeScript, ESLint, Prettier, 26 Jest suites / 127 tests

Portfolio Round 3 final evidence:

- Light: `tmp/uiux-round3-20260724/05-portfolio-light-round3-top-after.png`, `05-portfolio-light-round3-mid-after.png`, `05-portfolio-light-round3-end-after.png`, `05-portfolio-light-round3-privacy-after.png`, `05-portfolio-light-round3-add-asset-after.png`, `05-portfolio-light-round3-asset-editor-top-after.png`, `05-portfolio-light-round3-methods-after.png`, `05-portfolio-light-round3-milestones-after.png`, `05-portfolio-light-round3-settings-top-after.png`, `05-portfolio-light-round3-settings-mid-after.png`, `05-portfolio-light-round3-settings-end-after.png`
- Dark: `tmp/uiux-round3-20260724/05-portfolio-dark-round3-top-after.png`, `05-portfolio-dark-round3-mid-after.png`, `05-portfolio-dark-round3-end-after.png`, `05-portfolio-dark-round3-privacy-after.png`, `05-portfolio-dark-round3-asset-editor-top-after.png`, `05-portfolio-dark-round3-asset-editor-mid-after.png`, `05-portfolio-dark-round3-asset-editor-end-after.png`, `05-portfolio-dark-round3-methods-after.png`, `05-portfolio-dark-round3-milestones-after.png`, `05-portfolio-dark-round3-fire-plan-editor-after.png`, `05-portfolio-dark-round3-settings-top-after.png`, `05-portfolio-dark-round3-settings-mid-after.png`, `05-portfolio-dark-round3-settings-end-after.png`
- Allocation semantics: the stacked ruler remains the only proportional-length representation; the ledger uses compact category dots plus explicit percentages, so equal-size legend marks cannot be mistaken for percentage bars
- Return wording: asset and FIRE-method editors now label the input `Expected annual return (%)` / `預期年回報（%）`, matching the actual yearly calculation and the existing asset-row wording without changing any stored value or FIRE math
- Module audit: total and FIRE-counted assets, privacy toggle, quote status/refresh, largest allocation and proportional ruler, accessible allocation summary, add/edit asset flows, asset class/currency/update-method selections, quote fallback fields, inclusion/deletion controls, asset list, methods, milestones, base FIRE plan, and full settings/data sections were visually checked
- Research: Apple HIG Charts, Labels, Accessibility, Color, and Lists and Tables; Google Android accessibility, selectable-control semantics, and Material list/chip guidance
- Validation: TypeScript, ESLint, Prettier, 26 Jest suites / 127 tests

### Round 4

- [x] Home - completed (light + dark, countdown + workday + asset privacy + Time Lens + monthly progress + full milestone journey)
- [x] Calendar - completed (light + dark, empty/populated months + entry editor + date picker)
- [x] Log - completed (light + dark, expense/income + amount/preview + note/date + category create/edit)
- [x] Dashboard - completed (light + dark, all scenarios + forecast chart + tooltip + monthly breakdown + assumptions + FIRE method settings/editors)
- [x] Portfolio - completed (light + dark, totals/privacy + quotes + allocation + asset add/edit + FIRE settings/methods/milestones + app settings/data)

Home Round 4 final evidence:

- Light full-module audit: `tmp/uiux-round4-20260724/01-home-light-round4-top-before.png`, `01-home-light-round4-mid-before.png`, `01-home-light-round4-end-before.png`, `01-home-light-round4-time-lens-before.png`, `01-home-light-round4-hidden-before.png`
- Light optimized milestone hierarchy: `tmp/uiux-round4-20260724/01-home-light-round4-milestones-after.png`
- Dark full-module audit: `tmp/uiux-round4-20260724/01-home-dark-round4-top-before.png`, `01-home-dark-round4-mid-before.png`, `01-home-dark-round4-end-before.png`
- Dark optimized and interaction states: `tmp/uiux-round4-20260724/01-home-dark-round4-top-after.png`, `01-home-dark-round4-milestones-after.png`, `01-home-dark-round4-time-lens-after.png`, `01-home-dark-round4-hidden-after.png`
- Hierarchy optimization: the milestone summary retains the next milestone, remaining amount, exact funded percentage, and estimated date, but removes its redundant `NEXT` pill; the timeline remains the single detailed status sequence with `REACHED`, `NEXT`, and `LATER`
- Completed-state correctness: when every milestone is reached, the summary now says `Milestone path complete` / `里程碑路徑已完成` instead of the contradictory `Next milestone`
- Accessibility: Android hierarchy contains four milestone progressbar nodes with exact 100%, 62%, 35%, and 33% values; the remaining `NEXT` node belongs to the active timeline row, not the summary
- Research: Apple HIG design principles, labels, progress indicators, writing, and accessibility; Google Android content composition, hierarchy, containment, and accessibility
- Validation: TypeScript, ESLint, Prettier, 27 Jest suites / 131 tests

Calendar Round 4 final evidence:

- Light full-module audit: `tmp/uiux-round4-20260724/02-calendar-light-round4-top-before.png`, `02-calendar-light-round4-populated-before.png`, `02-calendar-light-round4-editor-before.png`, `02-calendar-light-round4-date-picker-before.png`
- Dark full-module audit: `tmp/uiux-round4-20260724/02-calendar-dark-round4-top-before.png`, `02-calendar-dark-round4-populated-before.png`, `02-calendar-dark-round4-list-before.png`, `02-calendar-dark-round4-editor-before.png`, `02-calendar-dark-round4-date-picker-before.png`
- Optimized zero state: `tmp/uiux-round4-20260724/02-calendar-light-round4-top-after-settled.png`, `02-calendar-dark-round4-top-after.png`
- Populated-state regression proof: `tmp/uiux-round4-20260724/02-calendar-dark-round4-populated-after.png`
- Semantic-color optimization: Income and Expense totals use positive/negative color only when the monthly amount is nonzero; an empty month now renders all three `HKD 0` values with the neutral text role, without changing calculations, stored data, or edit flows
- Selection audit: category selection already combines a two-pixel boundary, tinted fill, selected label/icon foreground, checkmark, and accessible selected state; the date picker uses a border plus tint and selected semantics, so neither state relies on border color alone
- Research: Apple HIG Color, Accessibility, and Feedback; Google Android color and accessibility guidance; WCAG 2.2 Use of Color
- Backup: `_backups/before-round4-calendar-20260724-110104`
- Validation: targeted Calendar presentation regression, TypeScript, ESLint, Prettier, 27 Jest suites / 132 tests

Log Round 4 final evidence:

- Dark full-module audit: `tmp/uiux-round4-20260724/03-log-dark-round4-full-top-before.png`, `03-log-dark-round4-bottom-before.png`, `03-log-dark-round4-amount-preview-before.png`, `03-log-dark-round4-income-before.png`, `03-log-dark-round4-date-picker-before.png`, `03-log-dark-round4-manage-before.png`
- Light full-module audit: `tmp/uiux-round4-20260724/03-log-light-round4-top-settled-before.png`, `03-log-light-round4-bottom-before.png`, `03-log-light-round4-note-before.png`, `03-log-light-round4-new-category-before.png`
- Optimized editor identity: `tmp/uiux-round4-20260724/03-log-dark-round4-category-editor-after.png`, `03-log-dark-round4-category-editor-bottom-after.png`, `03-log-light-round4-category-editor-after.png`
- Runtime defect fixed: the category symbol grid used the user-facing label as its React key, so the legacy Salary `cash` symbol collided with the separate Salary emoji preset and raised `Encountered two children with the same key, Salary`; icon values now provide stable unique identity
- Regression proof: after the fix, Metro/Android logcat contains no duplicate-key warning and the Salary editor correctly preselects its saved money symbol in both appearances; no category was saved or mutated during the audit
- Selection audit: Log category chips use a two-pixel contrast-safe boundary, tinted fill, coherent icon/label foreground, checkmark, and accessible selected state; type selection uses a filled segment and accessible selection, while the date picker combines tint, boundary, and selected semantics
- Research: React official Rendering Lists key rules; Apple HIG Icons, Focus and Selection, Color, and Accessibility; Google Android Material selection components and accessibility
- Backup: `_backups/before-round4-log-20260724-111539`
- Validation: targeted category identity and contrast regressions, TypeScript, ESLint, Prettier, 28 Jest suites / 133 tests

Dashboard Round 4 final evidence:

- Light full-module audit: `tmp/uiux-round4-20260724/04-dashboard-light-round4-top-before.png`, `04-dashboard-light-round4-mid-before.png`, `04-dashboard-light-round4-end-before.png`, `04-dashboard-light-round4-conservative-before.png`, `04-dashboard-light-round4-settings-before.png`, `04-dashboard-light-round4-method-editor-before.png`
- Dark full-module audit: `tmp/uiux-round4-20260724/04-dashboard-dark-round4-top-before.png`, `04-dashboard-dark-round4-mid-before.png`, `04-dashboard-dark-round4-end-before.png`, `04-dashboard-dark-round4-settings-after.png`
- Optimized editor context: `tmp/uiux-round4-20260724/04-dashboard-light-round4-method-editor-after.png`, `04-dashboard-dark-round4-method-editor-after.png`
- Scenario-state proof: `tmp/uiux-round4-20260724/04-dashboard-light-round4-conservative-before.png`, `04-dashboard-dark-round4-current-after.png`; reached and not-reached forecasts, exact dates, funded percentages, targets, chart crossings, and chart tooltip values remain intact
- Unit-context optimization: FIRE method and scenario editors now keep `HKD` beside monthly money labels and use consistent `(%)` labels for percentage inputs; values, validation, storage, and deterministic FIRE calculations are unchanged
- Module audit: all three scenarios, reached/not-reached hero states, funded progress, portfolio/FIRE-target chart and tooltip, monthly saving/spending/interest breakdown, plan assumptions, FIRE method list/default state, and method editor were visually checked in both appearances
- Research: Apple HIG Entering Data, Text Fields, Labels, Color, and Accessibility; Google Android text-field and accessibility guidance
- Backup: `_backups/before-round4-dashboard-20260724-113402`
- Validation: targeted FIRE-plan presentation and Dashboard regressions, TypeScript, ESLint, Prettier, 29 Jest suites / 135 tests

Portfolio Round 4 final evidence:

- Light full-module audit: `tmp/uiux-round4-20260724/05-portfolio-light-round4-top-restored.png`, `05-portfolio-light-round4-privacy-before.png`, `05-portfolio-light-round4-mid-restored.png`, `05-portfolio-light-round4-end-before.png`, `05-portfolio-light-round4-methods-before.png`, `05-portfolio-light-round4-milestones-before.png`, `05-portfolio-light-round4-settings-top-before.png`, `05-portfolio-light-round4-settings-mid-before.png`, `05-portfolio-light-round4-settings-end-before.png`
- Dark full-module audit: `tmp/uiux-round4-20260724/05-portfolio-dark-round4-top-before.png`, `05-portfolio-dark-round4-privacy-before.png`, `05-portfolio-dark-round4-assets-before.png`, `05-portfolio-dark-round4-mid-before.png`, `05-portfolio-dark-round4-end-before.png`, `05-portfolio-dark-round4-add-asset-bottom-before.png`, `05-portfolio-dark-round4-asset-editor-before.png`, `05-portfolio-dark-round4-asset-editor-mid-before.png`, `05-portfolio-dark-round4-methods-before.png`, `05-portfolio-dark-round4-milestones-before.png`, `05-portfolio-dark-round4-settings-top-before.png`, `05-portfolio-dark-round4-settings-mid-before.png`, `05-portfolio-dark-round4-settings-end-before.png`
- Optimized validation timing: `tmp/uiux-round4-20260724/05-portfolio-light-round4-add-asset-after.png`, `05-portfolio-dark-round4-add-asset-after.png` show a neutral untouched Name field; `05-portfolio-light-round4-add-asset-error-after.png`, `05-portfolio-dark-round4-add-asset-error-after.png` show the pink boundary only after the empty field loses focus, together with the text instruction `Enter an asset name.`
- Optimized unit context: `tmp/uiux-round4-20260724/05-portfolio-light-round4-milestone-editor-after.png`, `05-portfolio-dark-round4-milestone-editor-after.png` keep the goal currency visible as `Target amount (HKD)` without changing milestone values or FIRE calculations
- Allocation answer: the stacked ruler remains the proportional-length visualization; the ledger intentionally uses compact dots plus exact percentages, avoiding a second set of fake/equal-length bars while retaining exact values and accessible allocation semantics
- Selection and contrast audit: asset class, currency, update method, FIRE inclusion, and milestone state combine accent boundary, tonal fill, foreground/icon change, checkmark, and accessible selected state; none relies on border color alone
- State restoration: an audit-time Home asset inclusion change was restored from `Included` to the before-evidence `Excluded`; runtime proof returned Counted toward FIRE from HKD 1,171,232 to HKD 451,232
- Research: Apple HIG Text Fields, Feedback, Writing, and Accessibility; Google Material Text Fields and Errors; WCAG 2.2 Error Identification and Labels or Instructions
- Backup: `_backups/before-round4-portfolio-20260724-115148`
- Validation: targeted asset-editor, allocation, Portfolio, and FIRE-plan presentation regressions; TypeScript, ESLint, Prettier, clean React Native log scan, 30 Jest suites / 138 tests

## Fire Countdown — Home

- Screenshot: `tmp/ui-review-20260720/01-home-actual.png`
- Attachment verified in ChatGPT before sending: yes
- ChatGPT response completed: yes

### P0

- Bottom navigation obscures `Overall progress` and the lower Coast FIRE module. Add bottom scroll inset equal to the navigation height + system safe area + 16–24dp so the last module can scroll fully above the nav.
- Clarify the scope of every percentage: label `4.8% funded`, `Stage 1%`, and `Overall progress 29%` as, for example, `FIRE goal funded`, `Progress to next milestone`, and `Milestones completed`.

### P1

- Countdown ring endpoint looks like a draggable slider handle. Use a normal arc cap or a smaller non-interactive marker.
- `Today: +HKD 0` uses positive green for zero; use neutral gray for zero, green for positive, and red/orange for negative.
- Settings button is visually too large and competes with the page title. Use a standard 44–48dp touch target with a 22–24dp icon, lighter container treatment, and normal header alignment.

### P2

- Increase contrast of secondary labels, inactive navigation states, and card metadata.
- Replace mechanical date formatting such as `2028-05` with `2028年5月` or `May 2028`; keep exact formatting in detail views.

### Overall

Home's core hierarchy is clear: FIRE date, current assets, next milestone, and overall progress. The highest-impact improvements are content-safe bottom spacing, clearer percentage labels, and reducing the visual weight of Settings.

## Calendar

- Screenshot: `tmp/ui-review-20260720/02-calendar.png`
- Attachment verified in ChatGPT before sending: yes
- ChatGPT response completed: yes
- Overall: Structure is clear, but date states and data semantics need stronger visual distinction.
- P0: Separate Today, Selected, and Has entries states (for example: Today outline, Selected tonal background, Has entries dot or value marker).
- P0: Give the four month controls explicit labels/accessibility names: Previous year, Previous month, Next month, and Next year; do not make enabled controls look disabled.
- P0: Add bottom content inset equal to navigation height + system safe area + 16–24dp so long daily lists cannot be covered.
- P1: Treat zero values as neutral: avoid green/pink styling and remove the unnecessary `+` from `HKD 0`.
- P1: Remove duplicated dash/underline empty-state markers in calendar cells; keep cells blank when there are no entries.
- P1: Make the empty state actionable with a short hint that the center `+` logs income, expenses, or asset updates.
- P1: Clarify that daily figures are net cash flow and show positive/negative semantic signs consistently.
- P2: Reduce the vertical footprint of the month toolbar while keeping 44–48dp touch targets.
- P2: Define color roles: aqua for primary actions, optional purple only for date selection, green/red for non-zero financial semantics, and gray for neutral/inactive states.
- P2: Reduce Settings icon weight to a standard 44–48dp target with a 22–24dp icon.

## Log

- Screenshot: `tmp/ui-review-20260720/03-log.png`
- Attachment verified in ChatGPT before sending: yes
- Screenshot visually checked before sending: yes; left white vertical toolbar is an emulator overlay and was explicitly excluded from analysis
- ChatGPT response completed before recording: yes
- Overall: The Log sequence is understandable, but the primary Save action is obstructed and several controls need clearer input/feedback semantics.
- P0: Save is mostly covered by bottom navigation. Keep it fully visible above navigation and system safe area with 12–16dp separation; add enough bottom inset for the full button.
- P0: Use keyboard/IME-aware layout so Amount, preview, Category, and Save remain reachable when the keyboard opens.
- P0: Amount `0` looks like text selection. Use a caret/focus outline instead of a solid highlight around the whole digit.
- P1: Make Expense/Income selection use more than color (tinted background, weight, contrast, or check); keep the unselected option clearly enabled.
- P1: Clarify date controls with a field label, localized text date, and accessibility labels such as Previous day/Next day; make the calendar icon’s purpose clear.
- P1: Change `No note` to an input affordance such as `Add a note (optional)` with clear focus/typing feedback.
- P1: Explain the FIRE preview with an explicit metric and unit, such as `FIRE date impact` / `Moves FIRE 3 days later`; do not show an unexplained `0%` when no amount is entered.
- P1: Separate category identity colors from selected state using a distinct tinted background, border, or check; keep chips at least 44–48dp high.
- P2: Use aqua/neutral for page chrome; reserve pink for Expense/negative impact, green for Income/positive impact, and gray for zero/inactive states.
- P2: Reduce the vertical height of the Amount card so Preview, Category, and Save appear earlier.
- P2: Rename Category `Edit` to `Manage` if it manages categories, to distinguish it from the `Add` category action.

## Dashboard

- Screenshot: `tmp/ui-review-20260720/04-dashboard.png`
- Attachment verified in ChatGPT before sending: yes
- Screenshot visually checked before sending: yes; complete Dashboard UI, not a loading state
- ChatGPT response completed before recording: yes
- Overall: The forecast hierarchy is sensible, but chart semantics and the lower monthly module need clearer explanation and safe-area spacing.
- P0: Add bottom inset equal to navigation height + system safe area + 16–24dp so the full `This month` card and interactions are not covered by bottom navigation.
- P0: Add chart Y-axis currency scale or key value labels for Now, FIRE, and the end point; the current grid has no usable magnitude reference.
- P0: Explain why the FIRE target line rises and what changes after FIRE (savings stop, withdrawals begin); distinguish current target from inflation-adjusted future required assets.
- P1: Clarify scenario differences with a short assumption summary/info affordance, and identify `Current plan` as the baseline; provide brief transition feedback when switching.
- P1: Rename `Age 66` to `FIRE age 66` or `Estimated age 66`; group it with the estimated date and express `35.4 years` as a human-readable duration.
- P1: Make `Progress` semantic, e.g. `Goal funded 4.8%`, and keep summary number formatting/baselines consistent.
- P1: Use neutral gray for zero values; remove the positive `+` from `+HKD 0 today`, and distinguish no entries from net zero.
- P1: Reduce Settings/sliders icon to a standard 44–48dp action target and label it as forecast assumptions if that is its purpose.
- P2: Replace technical `2061-12` with `December 2061`; improve chart legend contrast, touch targets, tooltips, and non-color series cues.

## Portfolio

- Screenshot: `tmp/ui-review-20260720/05-portfolio.png`
- Attachment verified in ChatGPT before sending: yes
- Screenshot visually checked before sending: yes; complete Portfolio UI
- ChatGPT response completed before recording: yes
- Overall: The structure is clear, but the asset list is obstructed and several financial/privacy states need more explicit semantics.
- P0: Add bottom inset equal to navigation height + system safe area + 16–24dp so the full Assets list can scroll above bottom navigation.
- P0: Separate `Total assets` from `Included in FIRE projection` (or use `Net assets` when appropriate) and explain why the values differ.
- P0: Give Market prices explicit Updating／Updated／Stale／Failed states with last-updated time; preserve last-known values on failure.
- P1: Make the eye control stateful (`Eye`/`Eye-off`), define whether it hides all sensitive values, and add clear accessibility labels and pressed feedback.
- P1: Clarify `5.0% expected return` as an annual portfolio/FIRE-portfolio assumption and keep it visually separate from the current asset amount.
- P1: Label the large allocation callout as `Largest allocation · Real estate 62%`; supplement chart colors with labels, selection state, or accessible descriptions.
- P1: Turn `Add` into a clear `+ Add asset` button with a minimum 44dp target, distinct from the center Log `+`.
- P2: Reduce/responsive-scale the oversized total amount and Settings action for narrow screens and larger font sizes; use neutral styling for privacy/loading/stale states.

## Portfolio modules (scrolled)

- Screenshot: `tmp/ui-review-20260720/05-portfolio-scroll.png`
- Attachment verified in ChatGPT before sending: yes
- Screenshot visually checked before sending: yes; complete scrolled modules
- ChatGPT response completed before recording: yes
- Overall: Asset data is comprehensive, but each row has too many equally prominent elements and two overlay defects are visible.
- P0: Add bottom inset equal to navigation height + system safe area + 16–24dp so the full FIRE settings card can scroll above bottom navigation.
- P0: Make the fixed Settings action scroll with the Portfolio header, or place it inside a proper opaque sticky app bar; it currently covers Allocation content.
- P1: Replace `Included`/`Excluded` with `Included in FIRE`/`Excluded from FIRE` so the state is not confused with being in the Portfolio.
- P1: Rename `7.0% expected return` to `Expected annual return` or `Projection return · 7.0% p.a.`, and separate it from `Today −1.1%`.
- P1: Treat Market price／Manual value as lower-emphasis status tags with update time and explicit stale/loading/failed states; do not make read-only tags look like buttons.
- P1: Increase pencil hit areas to at least 44×44dp, add pressed feedback, and label them with the asset name (e.g. `Edit VOO ETF`).
- P1: Reduce the size of Included/Excluded chips so asset name and value remain primary; keep check/minus icons so state is not color-only.
- P2: Use a stable three-column asset-row grid for long names such as Emergency fund, and distinguish Portfolio Add asset from the center Log `+`.
- P2: Clarify FIRE settings `Edit` versus row chevrons; avoid two affordances for the same action and show Current age distinctly from Estimated FIRE age.

## FIRE plan edit sheet

- Screenshot: `tmp/ui-review-20260720/07-fire-settings-open.png`
- Attachment verified in ChatGPT before sending: yes
- Screenshot visually checked before sending: yes; complete Edit FIRE plan bottom sheet, not loading
- ChatGPT response completed before recording: yes
- Overall: The field order is sensible, but units, validation states, keyboard behavior, and safe-area handling need clearer treatment.
- P0: Make the sheet keyboard-aware so Withdrawal rate, Inflation, and Save remain reachable; use IME-aware scrolling or a Save action fixed above the keyboard.
- P0: Show explicit units: `HKD 28,000 / month`, `HKD 18,000 / month`, and `%` suffixes for rates; keep the underlying FIRE calculations unchanged.
- P0: Add inline validation and clear Save states for unchanged, valid edited, invalid, saving, and saved states; preserve entered values on save failure.
- P1: Format monetary values with thousands separators after input/blur and use consistent currency/month spacing.
- P1: Replace dense all-caps labels with sentence case, clarify `Monthly savings`, and add concise helper text where the meaning could be confused with income or cash balance.
- P1: Use numeric keyboards and a predictable Next/Done flow; scroll the next field into view, let the first Back dismiss the keyboard, and the second close the sheet.
- P1: Define consistent dismiss behavior for drag, Close, backdrop, and system Back; confirm before discarding unsaved edits and restore focus to the opening control.
- P1: Use clear default/focused/filled/error/disabled states with text or icons in addition to color, and stack the two rate fields on narrow screens or large text sizes.
- P2: Tighten excess header spacing, align Save margins with inputs, use dynamic system gesture insets, and keep modal focus/accessibility contained within the sheet.

## Asset edit sheet (upper form)

- Screenshot: `tmp/ui-review-20260720/08-asset-editor.png`
- Attachment verified in ChatGPT before sending: yes
- Screenshot visually checked before sending: yes; loaded Edit asset sheet, with the visible upper form captured
- ChatGPT response completed before recording: yes
- Overall: The structure and field order are clear, but units, formatting, chip density, focus/validation states, and keyboard scrolling need stronger treatment.
- P0: Make the form IME-aware: keep the active field above the keyboard, scroll to the next field, keep Update method reachable, and include dynamic gesture/navigation insets.
- P0: Give Value explicit currency context and formatting, e.g. `HKD 242,000`; keep numeric input validation and underlying values unchanged.
- P0: Clarify Expected annual return as a yearly/projection assumption, show a `%` suffix, and define focused, error, disabled, and selected states with inline feedback.
- P0: Preserve bottom-sheet scroll position when the keyboard opens/closes; Back should dismiss the keyboard before dismissing the sheet.
- P1: Keep Asset class and Currency chips at least 44dp high, wrap safely on narrow screens and large text, and use selection cues beyond color alone.
- P1: Add concise helper text explaining Manual versus Auto quote and how the selected method affects displayed value; preserve cached/manual fallback behavior.
- P1: Use sentence-case labels, reduce header/field spacing, and keep Close, backdrop, drag, system Back, and unsaved-change behavior consistent and accessible.
- P2: Distinguish sheet/input/chip/utility radii, raise contrast for unselected chips and labels, and expose semantic labels such as selected asset class, currency, numeric value, and percent field.

## FIRE method settings

- Screenshot: `tmp/ui-review-20260720/09-fire-methods.png`
- Attachment verified in ChatGPT before sending: yes
- Screenshot visually checked before sending: yes; complete FIRE method settings sheet
- ChatGPT response completed before recording: yes
- Overall: Three methods are visible together, but long prose rows make comparison harder and the Dashboard default state is too subtle.
- P0: Reformat each method into the same fixed fields/order: Retirement spending, Monthly savings, Withdrawal rate, and Expected annual return; keep values unchanged.
- P0: Make `Current plan`’s Dashboard default an explicit badge/status with a non-color cue and accessible announcement.
- P0: Make each whole method row a clear, pressed, accessible edit target; keep the chevron as a directional cue rather than the only hit target.
- P0: Add independent scrolling and dynamic bottom safe-area padding so the last method remains reachable at large text sizes, on short screens, and with different navigation modes.
- P1: Replace ambiguous `Save HKD ...` with `Monthly savings: HKD ...`; standardize `HKD 30,000 / month` and `Expected annual return 2.1%` formatting.
- P1: Add subtle dividers/row surfaces, elevate method name and default status, and keep all three rows aligned for fast comparison.
- P1: Reduce the oversized `Up to 3 FIRE methods` pill to helper text such as `You can configure up to 3 FIRE methods`.
- P2: Tighten sheet header spacing, standardize dismiss behavior and accessibility labels, and test 150–200% text scaling and longer localized labels without shrinking text.

## Milestone settings

- Screenshot: `tmp/ui-review-20260720/10-milestones.png`
- Attachment verified in ChatGPT before sending: yes
- Screenshot visually checked before sending: yes; complete Milestone settings sheet with Add milestone and three active rows
- ChatGPT response completed before recording: yes
- Overall: The list is easy to scan, but Active is weakly expressed, amounts lack target semantics, rows lack separators/progress, and Add milestone dominates.
- P0: Use an explicit status badge/icon for Active and keep it distinct from selected or completed states; do not rely on color alone.
- P0: Label every amount as a milestone target/threshold, e.g. `Target: HKD 450,000`, with consistent tabular formatting.
- P0: Make the list independently scrollable with dynamic system/navigation insets; preserve access to the final row at larger text sizes and on shorter screens.
- P0: Make the entire milestone row a single accessible edit target with pressed feedback; the chevron should not be the only hit area.
- P1: Show computed milestone progress or remaining amount with an explicit denominator, such as `51% funded` or `HKD ... remaining`, without changing calculations.
- P1: Clarify the meaning of Milestone 1/2/3 ordering and distinguish `FIRE target milestone` from the global FIRE target wording.
- P1: Add subtle dividers or tonal rows, reduce the oversized Add milestone button to a lighter secondary action, and provide a useful empty-state explanation.
- P2: Standardize sentence-case labels, amount formatting, chevron alignment/contrast, close/dismiss behavior, focus return, and 200% text/localization behavior.

## Add milestone editor

- Screenshot: `tmp/ui-review-20260720/11-add-milestone.png`
- Attachment verified in ChatGPT before sending: yes
- Screenshot visually checked before sending: yes; complete Add/Edit milestone editor
- ChatGPT response completed before recording: yes
- Overall: 欄位次序合理，但 target amount、date、expected return、toggle 語意同 keyboard/safe-area 狀態仍然唔夠 user-facing。
- P0: keyboard/IME-aware scroll、sticky 或可完整滾到鍵盤上方嘅 Save、動態 bottom inset；Target amount 加目前計劃貨幣、千位分隔、numeric validation；Target date 提供 calendar affordance、可讀日期格式及即時 validation；Expected return 明確寫 annual return、% 單位及「-」實際代表未設定定沿用假設；所有欄位加入 inline error、focus、disabled、saving 狀態。
- P1: Target date 同 Expected return 改為窄屏/大字體時 responsive stack；Active milestone 同 Show on FIRE path 改成清晰 setting rows + switch/checkbox，整行最少 44–48dp，並交代兩者依賴；Add/Edit mode 顯示正確文案；Save 按 valid/dirty/saving/error 狀態變化；未儲存關閉時一致處理。
- P2: label 改 sentence case；收緊 sheet header 留更多表單空間；只為 expected return、active/path 差異加 helper text；補 screen-reader 語意、focus 順序、error announcement、200% text support。
