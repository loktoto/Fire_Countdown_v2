// Barrel re-exports. The FIRE plan sheets were split into focused modules:
// - fireplan/firePlanSheetKit.tsx  (shared primitives + styles)
// - fireplan/FirePlanSheets.tsx    (goal editor + summary)
// - fireplan/MilestoneSheets.tsx   (milestone editor + list)
// - fireplan/ScenarioSheets.tsx    (scenario editor + list)
export { FirePlanEditorSheet, FirePlanSummarySheet } from "./fireplan/FirePlanSheets";
export { MilestoneEditorSheet, MilestoneListSheet } from "./fireplan/MilestoneSheets";
export { ScenarioEditorSheet, ScenarioListSheet } from "./fireplan/ScenarioSheets";

export type { FireGoalPatch, MilestonePatch, ScenarioPatch } from "./fireplan/firePlanSheetKit";
