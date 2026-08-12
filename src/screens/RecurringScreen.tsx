import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { CategoryGlyph } from "../components/CategoryGlyph";
import { GlassCard } from "../components/GlassCard";
import { MotionPressable } from "../components/MotionPressable";
import { RecurringEditorSheet } from "../components/RecurringEditorSheet";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { RecurrenceFrequency } from "../features/types";
import { useRecurringViewModel } from "../hooks/useRecurringViewModel";
import { useI18n } from "../i18n";
import { formatDateInputLabel, money, signedMoney } from "../utils/format";

export function RecurringScreen() {
  const colors = useThemeColors();
  const t = useI18n();
  const router = useRouter();
  const vm = useRecurringViewModel();
  const { scheduleId } = useLocalSearchParams<{ scheduleId?: string | string[] }>();
  const requestedScheduleId = Array.isArray(scheduleId) ? scheduleId[0] : scheduleId;
  const { fontScale, width } = useWindowDimensions();
  const [editingId, setEditingId] = useState<string | null>(
    () => requestedScheduleId ?? null,
  );
  const editingSchedule = vm.schedules.find((schedule) => schedule.id === editingId) ?? null;
  const stackSummary = width < 360 || fontScale > 1.25;
  const stackSchedules = width < 380 || fontScale > 1.2;

  function frequencyLabel(frequency: RecurrenceFrequency) {
    return {
      weekly: t.recurring.weekly,
      biweekly: t.recurring.biweekly,
      monthly: t.recurring.monthly,
      yearly: t.recurring.yearly,
    }[frequency];
  }

  return (
    <ScreenScaffold hasBottomNavigation={false}>
      <AppHeader
        eyebrow={t.recurring.kicker}
        title={t.recurring.title}
        subtitle={t.recurring.subtitle}
        accentColor={colors.primary}
        action={
          <MotionPressable
            onPress={() => router.back()}
            accessibilityLabel={t.common.done}
            haptic="light"
            style={[styles.closeButton, { backgroundColor: colors.surface }]}
          >
            <MaterialCommunityIcons name="close" size={22} color={colors.textSubtle} />
          </MotionPressable>
        }
      />

      {vm.schedules.length > 0 ? (
        <GlassCard compact tone="accent" motionIndex={1}>
          <View style={styles.summaryHeader}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="calendar-sync" size={22} color={colors.primary} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={[styles.summaryTitle, typography.title, { color: colors.text }]}>
                {t.recurring.monthlyRhythm}
              </Text>
              <Text style={[styles.summaryMeta, typography.body, { color: colors.textMuted }]}>
                {t.recurring.monthlyRhythmHint(vm.currency)}
              </Text>
            </View>
          </View>
          <View style={[styles.summaryValues, stackSummary && styles.summaryValuesStacked]}>
            <View style={[styles.summaryValue, stackSummary && styles.summaryValueStacked]}>
              <Text style={[styles.summaryLabel, typography.body, { color: colors.textMuted }]}>
                {t.common.income}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={[styles.summaryAmount, typography.title, { color: colors.positive }]}
              >
                {money(vm.monthlyTotals.income, vm.currency)}
              </Text>
            </View>
            <View
              style={[
                stackSummary ? styles.summaryDividerHorizontal : styles.summaryDivider,
                { backgroundColor: colors.surfaceBorder },
              ]}
            />
            <View style={[styles.summaryValue, stackSummary && styles.summaryValueStacked]}>
              <Text style={[styles.summaryLabel, typography.body, { color: colors.textMuted }]}>
                {t.common.expense}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={[styles.summaryAmount, typography.title, { color: colors.negative }]}
              >
                {money(vm.monthlyTotals.expense, vm.currency)}
              </Text>
            </View>
            <View
              style={[
                stackSummary ? styles.summaryDividerHorizontal : styles.summaryDivider,
                { backgroundColor: colors.surfaceBorder },
              ]}
            />
            <View style={[styles.summaryValue, stackSummary && styles.summaryValueStacked]}>
              <Text style={[styles.summaryLabel, typography.body, { color: colors.textMuted }]}>
                {t.common.net}
              </Text>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
                style={[
                  styles.summaryAmount,
                  typography.title,
                  { color: vm.monthlyTotals.net < 0 ? colors.negative : colors.positive },
                ]}
              >
                {signedMoney(vm.monthlyTotals.net, vm.currency)}
              </Text>
            </View>
          </View>
          <View style={styles.fireImpactHint}>
            <MaterialCommunityIcons name="information-outline" size={18} color={colors.primary} />
            <Text style={[styles.fireImpactHintText, typography.body, { color: colors.textMuted }]}>
              {t.recurring.fireImpactHint}
            </Text>
          </View>
        </GlassCard>
      ) : null}

      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
            {t.recurring.schedules}
          </Text>
          <Text style={[styles.sectionMeta, typography.body, { color: colors.textMuted }]}>
            {t.recurring.activeCount(vm.activeCount)}
          </Text>
        </View>
        <MotionPressable
          onPress={() => router.replace("/(tabs)/log")}
          accessibilityLabel={t.recurring.addFromLog}
          haptic="light"
          style={[
            styles.addButton,
            { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
          ]}
        >
          <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
          <Text style={[styles.addButtonText, typography.button, { color: colors.primary }]}>
            {t.common.add}
          </Text>
        </MotionPressable>
      </View>

      {vm.schedules.length === 0 ? (
        <View
          style={[
            styles.emptyState,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="repeat-off" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, typography.title, { color: colors.text }]}>
            {t.recurring.emptyTitle}
          </Text>
          <Text style={[styles.emptyText, typography.body, { color: colors.textMuted }]}>
            {t.recurring.emptyHint}
          </Text>
          <MotionPressable
            onPress={() => router.replace("/(tabs)/log")}
            accessibilityLabel={t.recurring.goToLog}
            haptic="medium"
            style={[styles.primaryButton, { backgroundColor: colors.primaryFill }]}
          >
            <Text
              style={[styles.primaryButtonText, typography.button, { color: colors.onPrimary }]}
            >
              {t.recurring.goToLog}
            </Text>
          </MotionPressable>
        </View>
      ) : (
        <GlassCard compact motionIndex={2} style={styles.scheduleCard}>
          {vm.schedules.map((schedule, index) => {
            const title =
              schedule.note?.trim() || schedule.category?.name || t.calendar.uncategorized;
            const statusColor = schedule.isActive ? colors.positive : colors.textMuted;
            const statusBackground = schedule.isActive ? colors.positiveSoft : colors.backgroundAlt;
            return (
              <View key={schedule.id}>
                {index > 0 ? (
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                ) : null}
                <MotionPressable
                  onPress={() => setEditingId(schedule.id)}
                  accessibilityLabel={t.recurring.editSchedule(title)}
                  haptic="light"
                  style={[styles.scheduleRow, stackSchedules && styles.scheduleRowStacked]}
                >
                  <View style={styles.scheduleIdentity}>
                    <CategoryGlyph
                      icon={schedule.category?.icon}
                      color={schedule.category?.color ?? colors.primary}
                      size={40}
                    />
                    <View style={styles.scheduleCopy}>
                      <View style={styles.scheduleTitleRow}>
                        <Text
                          numberOfLines={1}
                          style={[styles.scheduleTitle, typography.title, { color: colors.text }]}
                        >
                          {title}
                        </Text>
                        <View style={[styles.statusPill, { backgroundColor: statusBackground }]}>
                          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                          <Text
                            style={[styles.statusText, typography.button, { color: statusColor }]}
                          >
                            {schedule.isActive ? t.recurring.active : t.recurring.paused}
                          </Text>
                        </View>
                      </View>
                      <Text
                        numberOfLines={1}
                        style={[styles.scheduleMeta, typography.body, { color: colors.textMuted }]}
                      >
                        {frequencyLabel(schedule.frequency)} ·{" "}
                        {schedule.category?.name ?? t.calendar.uncategorized}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[styles.nextDate, typography.body, { color: colors.textMuted }]}
                      >
                        {schedule.isActive
                          ? t.recurring.nextDate(formatDateInputLabel(schedule.nextDate, t.locale))
                          : t.recurring.pausedNoBackfill}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.amountColumn, stackSchedules && styles.amountColumnStacked]}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.scheduleAmount,
                        typography.button,
                        {
                          color: schedule.type === "income" ? colors.positive : colors.negative,
                        },
                      ]}
                    >
                      {schedule.type === "income" ? "+" : "-"}
                      {money(schedule.amount, schedule.currency)}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={colors.textMuted}
                    />
                  </View>
                </MotionPressable>
              </View>
            );
          })}
        </GlassCard>
      )}

      <RecurringEditorSheet
        visible={Boolean(editingSchedule)}
        schedule={editingSchedule}
        categories={vm.categories}
        onClose={() => setEditingId(null)}
        onSave={vm.updateRecurringTransaction}
        onArchive={vm.archiveRecurringTransaction}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCopy: { flex: 1, minWidth: 0, gap: 2 },
  summaryTitle: { fontSize: 18, lineHeight: 23 },
  summaryMeta: { fontSize: 13, lineHeight: 18 },
  summaryValues: { flexDirection: "row", alignItems: "stretch" },
  summaryValuesStacked: { flexDirection: "column" },
  summaryValue: { flex: 1, minWidth: 0, gap: 3 },
  summaryValueStacked: { paddingVertical: 4 },
  summaryDivider: { width: StyleSheet.hairlineWidth, marginHorizontal: 10 },
  summaryDividerHorizontal: { width: "100%", height: StyleSheet.hairlineWidth, marginVertical: 5 },
  summaryLabel: { fontSize: 12, lineHeight: 16 },
  summaryAmount: { fontSize: 16, lineHeight: 21, fontVariant: ["tabular-nums"] },
  fireImpactHint: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  fireImpactHintText: { flex: 1, fontSize: 12, lineHeight: 17 },
  sectionHeader: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12 },
  sectionCopy: { flex: 1, minWidth: 0, gap: 2 },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  sectionMeta: { fontSize: 13, lineHeight: 18 },
  addButton: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  addButtonText: { fontSize: 14, lineHeight: 19 },
  emptyState: {
    minHeight: 300,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: tokens.spacing.sm,
  },
  emptyTitle: { fontSize: 20, lineHeight: 26, textAlign: "center" },
  emptyText: { maxWidth: 360, fontSize: 15, lineHeight: 21, textAlign: "center" },
  primaryButton: {
    minHeight: 50,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: tokens.spacing.md,
  },
  primaryButtonText: { fontSize: 15, lineHeight: 20 },
  scheduleCard: { paddingVertical: 0 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 52 },
  scheduleRow: {
    minHeight: 94,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scheduleRowStacked: { alignItems: "stretch", flexDirection: "column" },
  scheduleIdentity: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12 },
  scheduleCopy: { flex: 1, minWidth: 0, gap: 3 },
  scheduleTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  scheduleTitle: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 21 },
  scheduleMeta: { fontSize: 13, lineHeight: 18 },
  nextDate: { fontSize: 12, lineHeight: 16 },
  statusPill: {
    minHeight: 24,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, lineHeight: 15 },
  amountColumn: { alignItems: "flex-end", gap: 5 },
  amountColumnStacked: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scheduleAmount: { maxWidth: 126, fontSize: 14, lineHeight: 19, fontVariant: ["tabular-nums"] },
});
