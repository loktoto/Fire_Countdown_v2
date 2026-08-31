import { StyleSheet } from "react-native";

import { tokens } from "../../design/tokens";

export const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  sheet: {
    maxHeight: "90%",
    borderTopLeftRadius: tokens.radius.card,
    borderTopRightRadius: tokens.radius.card,
    borderWidth: 1,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  grabber: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: tokens.radius.pill,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
  },
  fieldGroup: {
    flex: 1,
    gap: tokens.spacing.sm,
  },
  fieldLabel: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 0,
    fontSize: 15,
  },
  splitFields: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
  },
  splitFieldsStack: {
    flexDirection: "column",
  },
  splitField: {
    flex: 1,
    minWidth: 0,
  },
  toggleRow: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  toggleText: {
    fontSize: 13,
  },
  save: {
    minHeight: 54,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    fontSize: 14,
  },
  tonalAddButton: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  tonalAddText: {
    fontSize: 14,
  },
  maxMethodsStatus: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  maxMethodsStatusText: {
    fontSize: 13,
  },
  listRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
    paddingVertical: 10,
  },
  scenarioComparison: { flex: 1, minWidth: 0, gap: 6 },
  scenarioComparisonTitle: { flexDirection: "row", alignItems: "center", gap: tokens.spacing.sm },
  scenarioName: { flex: 1, minWidth: 0, fontSize: 19, lineHeight: 24 },
  defaultBadge: {
    borderRadius: tokens.radius.pill,
    overflow: "hidden",
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    fontSize: 10,
    lineHeight: 14,
  },
  scenarioMetric: { flexDirection: "row", alignItems: "baseline", gap: tokens.spacing.md },
  scenarioMetricLabel: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 18 },
  scenarioMetricValue: {
    maxWidth: "58%",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  hidden: { display: "none" },
  listCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  listLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  listValue: {
    fontSize: 16,
    lineHeight: 21,
  },
  listMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  archive: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  archiveText: {
    fontSize: 13,
  },
});
