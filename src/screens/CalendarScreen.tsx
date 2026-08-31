import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, FadeIn } from "react-native-reanimated";

import {
  calendarActivityColorRole,
  calendarItemInteraction,
  calendarLayout,
  calendarNetColorRole,
  calendarSummaryColorRole,
  calendarTransactionColorRole,
  recurringScheduleRoute,
} from "../components/calendarPresentation";
import { CategoryGlyph } from "../components/CategoryGlyph";
import { GlassCard } from "../components/GlassCard";
import { MonthYearPickerSheet } from "../components/MonthYearPickerSheet";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { TransactionEditorSheet } from "../components/TransactionEditorSheet";
import { TimeLensValue } from "../components/TimeLens";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useCalendarViewModel } from "../hooks/useCalendarViewModel";
import type { CalendarTransactionDetail } from "../hooks/useCalendarViewModel";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useI18n } from "../i18n";
import { formatFullDate, isoDateParts, money, signedMoney } from "../utils/format";

export function CalendarScreen() {
  const colors = useThemeColors();
  const t = useI18n();
  const vm = useCalendarViewModel();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { fontScale, width } = useWindowDimensions();
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const { stackSummary, stackTransactions } = useMemo(
    () => calendarLayout({ fontScale, width }),
    [fontScale, width],
  );
  const editingTransaction =
    vm.selectedTransactions.find(
      (transaction) => transaction.id === editingTransactionId && !transaction.isProjected,
    ) ?? null;
  const hasPendingFireImpact = vm.selectedTransactions.some(
    (transaction) => transaction.isPendingFireImpact,
  );
  const calendarRows = useMemo(
    () =>
      Array.from({ length: Math.ceil(vm.calendarCells.length / 7) }, (_, index) =>
        vm.calendarCells.slice(index * 7, index * 7 + 7),
      ),
    [vm.calendarCells],
  );
  const selectedDateHeading = useMemo(() => {
    const parts = isoDateParts(vm.selectedDate);
    const date = new Date(parts.year, parts.month - 1, parts.day);
    return {
      primary: date.toLocaleDateString(t.locale, { day: "numeric", month: "short" }),
      secondary: `${date.toLocaleDateString(t.locale, { weekday: "long" })} · ${date.toLocaleDateString(t.locale, { year: "numeric" })}`,
    };
  }, [t.locale, vm.selectedDate]);

  function openTransaction(transaction: CalendarTransactionDetail) {
    const interaction = calendarItemInteraction(transaction);
    if (interaction.kind === "recurring") {
      router.push(recurringScheduleRoute(interaction.scheduleId));
      return;
    }

    setEditingTransactionId(interaction.transactionId);
  }

  const summaryItems = [
    {
      key: "income",
      label: t.common.income,
      amount: vm.summary.income,
      value: money(vm.summary.income, vm.currency),
      icon: "arrow-up" as const,
      color: colors[calendarSummaryColorRole({ amount: vm.summary.income, kind: "income" })],
      kind: "income" as const,
    },
    {
      key: "expense",
      label: t.common.expense,
      amount: vm.summary.expense,
      value: money(vm.summary.expense, vm.currency),
      icon: "arrow-down" as const,
      color: colors[calendarSummaryColorRole({ amount: vm.summary.expense, kind: "expense" })],
      kind: "expense" as const,
    },
    {
      key: "net",
      label: t.calendar.netCashFlow,
      amount: Math.abs(vm.summary.net),
      value: signedMoney(vm.summary.net, vm.currency),
      icon: "chart-line-variant" as const,
      color: colors[calendarNetColorRole(vm.summary.net)],
      kind: vm.summary.net < 0 ? ("expense" as const) : ("income" as const),
    },
  ];

  return (
    <ScreenScaffold>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text
            accessibilityRole="header"
            adjustsFontSizeToFit
            numberOfLines={1}
            minimumFontScale={0.82}
            style={[styles.pageTitle, typography.display, { color: colors.text }]}
          >
            {t.calendar.title}
          </Text>
        </View>
        <MotionPressable
          onPress={() => router.push("/settings")}
          accessibilityLabel={t.portfolio.settings}
          holdLabel={t.portfolio.settings}
          haptic="light"
          style={[
            styles.settingsButton,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <MaterialCommunityIcons name="cog" size={25} color={colors.textSubtle} />
        </MotionPressable>
      </View>

      <GlassCard compact style={styles.summaryCard} motionIndex={1}>
        <View style={[styles.summary, stackSummary && styles.summaryStacked]}>
          {summaryItems.map((item, index) => (
            <View
              key={item.key}
              style={[styles.summaryGroup, stackSummary && styles.summaryGroupStacked]}
            >
              {index > 0 ? (
                <View
                  style={[
                    stackSummary ? styles.summaryDividerHorizontal : styles.summaryDivider,
                    { backgroundColor: colors.divider },
                  ]}
                />
              ) : null}
              <View style={[styles.summaryItem, stackSummary && styles.summaryItemStacked]}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.primarySoft }]}>
                  <MaterialCommunityIcons name={item.icon} size={17} color={colors.primary} />
                </View>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.78}
                  style={[styles.summaryLabel, typography.body, { color: colors.textMuted }]}
                >
                  {item.label}
                </Text>
                <TimeLensValue
                  amount={item.amount}
                  moneyText={item.value}
                  kind={item.kind}
                  accessibilityLabel={t.calendar.summaryValue(item.label, item.value)}
                  numberOfLines={1}
                  style={styles.summaryLens}
                  textStyle={[styles.summaryValue, typography.title, { color: item.color }]}
                />
              </View>
            </View>
          ))}
        </View>
      </GlassCard>

      <GlassCard compact style={styles.calendarCard} motionIndex={3}>
        <View style={styles.calendarHeader}>
          <MotionPressable
            onPress={vm.goToPreviousMonth}
            onLongPress={vm.goToPreviousYear}
            accessibilityLabel={t.calendar.previousMonth}
            accessibilityHint={t.calendar.previousYear}
            holdLabel={t.calendar.previousYear}
            haptic="selection"
            hitSlop={2}
            style={[
              styles.arrowButton,
              { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder },
            ]}
          >
            <MaterialCommunityIcons name="chevron-left" size={25} color={colors.textSubtle} />
          </MotionPressable>
          <MotionPressable
            onPress={() => setMonthPickerVisible(true)}
            accessibilityLabel={t.calendar.chooseMonth}
            accessibilityHint={t.calendar.chooseMonthHint}
            haptic="selection"
            style={styles.monthTitleButton}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.monthTitle, typography.title, { color: colors.text }]}
            >
              {vm.monthLabel}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textMuted} />
          </MotionPressable>
          <MotionPressable
            onPress={vm.goToNextMonth}
            onLongPress={vm.goToNextYear}
            accessibilityLabel={t.calendar.nextMonth}
            accessibilityHint={t.calendar.nextYear}
            holdLabel={t.calendar.nextYear}
            haptic="selection"
            hitSlop={2}
            style={[
              styles.arrowButton,
              { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder },
            ]}
          >
            <MaterialCommunityIcons name="chevron-right" size={25} color={colors.textSubtle} />
          </MotionPressable>
          <MotionPressable
            onPress={vm.goToToday}
            accessibilityLabel={t.calendar.jumpToday}
            haptic="selection"
            hitSlop={2}
            style={[
              styles.todayButton,
              { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
            ]}
          >
            <Text style={[styles.todayText, typography.button, { color: colors.primary }]}>
              {t.common.today}
            </Text>
          </MotionPressable>
        </View>

        <View style={styles.weekdayRow}>
          {vm.weekdays.map((weekday) => (
            <Text
              key={weekday}
              accessibilityLabel={weekday}
              style={[styles.weekday, typography.button, { color: colors.textMuted }]}
            >
              {t.locale.startsWith("zh") ? weekday : weekday.slice(0, 1)}
            </Text>
          ))}
        </View>

        <Animated.View
          key={vm.monthLabel}
          entering={
            reducedMotion ? undefined : FadeIn.duration(180).easing(Easing.out(Easing.cubic))
          }
          style={styles.grid}
        >
          {calendarRows.map((week) => (
            <View key={week[0]?.key ?? "week"} style={styles.weekRow}>
              {week.map((day) => {
                const selected = day.date === vm.selectedDate;
                const textColor = selected
                  ? colors.primary
                  : day.isCurrentMonth
                    ? day.isToday
                      ? colors.primary
                      : colors.text
                    : colors.textTertiary;
                const hasActualActivity = day.hasIncome || day.hasExpense;
                const hasProjectedActivity = day.hasProjectedIncome || day.hasProjectedExpense;
                const actualActivityColor =
                  colors[
                    calendarActivityColorRole({
                      hasExpense: day.hasExpense,
                      hasIncome: day.hasIncome,
                      isFuture: day.isFuture,
                    })
                  ];
                const dayAccessibilityLabel = [
                  t.calendar.dayNet(
                    formatFullDate(day.date, t.locale),
                    signedMoney(day.net, vm.currency),
                    day.isToday,
                  ),
                  hasProjectedActivity ? t.calendar.pendingFireStatus : "",
                ]
                  .filter(Boolean)
                  .join(". ");

                return (
                  <MotionPressable
                    key={day.key}
                    onPress={() => vm.setSelectedDate(day.date)}
                    accessibilityLabel={dayAccessibilityLabel}
                    accessibilityState={{ selected }}
                    haptic="selection"
                    hitSlop={1}
                    style={[
                      styles.day,
                      {
                        borderColor: selected || day.isToday ? colors.primaryBorder : "transparent",
                        backgroundColor: selected ? colors.primarySoft : "transparent",
                      },
                    ]}
                  >
                    <Text style={[styles.dayNumber, typography.button, { color: textColor }]}>
                      {day.day}
                    </Text>
                    <View style={styles.activityDotSlot}>
                      <View style={styles.activityDotRow}>
                        {hasActualActivity ? (
                          <View
                            style={[styles.activityDot, { backgroundColor: actualActivityColor }]}
                          />
                        ) : null}
                        {hasProjectedActivity ? (
                          <View
                            style={[styles.activityDot, { backgroundColor: colors.textTertiary }]}
                          />
                        ) : null}
                      </View>
                    </View>
                  </MotionPressable>
                );
              })}
            </View>
          ))}
        </Animated.View>
      </GlassCard>

      <GlassCard style={styles.dailyCard} motionIndex={3}>
        <View style={styles.dateHeaderGroup}>
          <View
            accessibilityRole="header"
            accessibilityLabel={formatFullDate(vm.selectedDate, t.locale)}
            style={styles.dateHeading}
          >
            <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
              {selectedDateHeading.primary}
            </Text>
            <Text style={[styles.dateContext, typography.bodyMedium, { color: colors.textMuted }]}>
              {selectedDateHeading.secondary}
            </Text>
          </View>
          {hasPendingFireImpact ? (
            <View
              accessibilityRole="text"
              style={[
                styles.pendingFireStatus,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textTertiary} />
              <Text
                style={[
                  styles.pendingFireStatusText,
                  typography.bodyMedium,
                  { color: colors.textMuted },
                ]}
              >
                {t.calendar.pendingFireStatus}
              </Text>
            </View>
          ) : null}
        </View>

        {vm.selectedTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyCopy}>
              <Text style={[styles.emptyTitle, typography.title, { color: colors.text }]}>
                {t.calendar.noRecordsForDate}
              </Text>
              <Text style={[styles.emptyDescription, typography.body, { color: colors.textMuted }]}>
                {t.calendar.noRecordsHint}
              </Text>
            </View>
            <MotionPressable
              onPress={() => router.push("/(tabs)/log")}
              accessibilityLabel={t.calendar.addEntry}
              haptic="light"
              style={[
                styles.addButton,
                { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
              ]}
            >
              <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
              <Text style={[styles.addButtonText, typography.button, { color: colors.primary }]}>
                {t.calendar.addEntry}
              </Text>
            </MotionPressable>
          </View>
        ) : (
          <View style={styles.transactionList}>
            {vm.selectedTransactions.map((transaction, index) => {
              const interaction = calendarItemInteraction(transaction);
              const categoryColor = transaction.category?.color ?? colors.primary;
              const displayCategoryColor = transaction.isPendingFireImpact
                ? colors.textTertiary
                : categoryColor;
              const amountColor =
                colors[
                  calendarTransactionColorRole({
                    isPendingFireImpact: transaction.isPendingFireImpact,
                    type: transaction.type,
                  })
                ];
              const signedAmount =
                transaction.type === "income"
                  ? `+${money(transaction.amount, transaction.currency)}`
                  : `-${money(transaction.amount, transaction.currency)}`;
              const typeLabel = transaction.type === "income" ? t.common.income : t.common.expense;
              const itemAccessibilityLabel =
                transaction.isProjected && interaction.kind === "recurring"
                  ? t.recurring.editSchedule(transaction.category?.name ?? t.calendar.uncategorized)
                  : t.calendar.editTransaction(
                      transaction.category?.name ?? t.calendar.uncategorized,
                      signedAmount,
                    );

              return (
                <View key={transaction.id}>
                  {index > 0 ? (
                    <View
                      style={[styles.transactionDivider, { backgroundColor: colors.divider }]}
                    />
                  ) : null}
                  <View
                    style={[
                      styles.transactionRow,
                      stackTransactions && styles.transactionRowStacked,
                    ]}
                  >
                    <MotionPressable
                      onPress={() => openTransaction(transaction)}
                      accessibilityLabel={itemAccessibilityLabel}
                      accessibilityHint={
                        transaction.isPendingFireImpact
                          ? t.calendar.pendingFireAccessibility(
                              formatFullDate(transaction.date, t.locale),
                            )
                          : undefined
                      }
                      haptic="light"
                      style={[
                        styles.transactionOpen,
                        stackTransactions && styles.transactionOpenStacked,
                      ]}
                    >
                      <CategoryGlyph
                        icon={transaction.category?.icon}
                        color={displayCategoryColor}
                        size={40}
                      />
                      <View style={styles.transactionCopy}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.transactionCategory,
                            typography.title,
                            {
                              color: transaction.isPendingFireImpact
                                ? colors.textSubtle
                                : colors.text,
                            },
                          ]}
                        >
                          {transaction.category?.name ?? t.calendar.uncategorized}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.transactionNote,
                            typography.body,
                            { color: colors.textMuted },
                          ]}
                        >
                          {transaction.note ?? t.calendar.noNoteAdded} · {typeLabel}
                          {transaction.isProjected
                            ? ` · ${t.calendar.pendingFireStatus}`
                            : transaction.recurringTransactionId
                              ? ` · ${t.recurring.recurring}`
                              : ""}
                        </Text>
                      </View>
                    </MotionPressable>
                    <View
                      style={[
                        styles.transactionMeta,
                        stackTransactions && styles.transactionMetaStacked,
                      ]}
                    >
                      <TimeLensValue
                        amount={transaction.amount}
                        moneyText={signedAmount}
                        kind={transaction.type}
                        onPress={() => openTransaction(transaction)}
                        accessibilityLabel={[
                          itemAccessibilityLabel,
                          transaction.isPendingFireImpact
                            ? t.calendar.pendingFireAccessibility(
                                formatFullDate(transaction.date, t.locale),
                              )
                            : "",
                        ]
                          .filter(Boolean)
                          .join(". ")}
                        numberOfLines={1}
                        style={styles.transactionAmountLens}
                        textStyle={[
                          styles.transactionAmount,
                          typography.button,
                          { color: amountColor },
                        ]}
                      />
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={20}
                        color={transaction.isPendingFireImpact ? colors.disabled : colors.textMuted}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </GlassCard>

      <TransactionEditorSheet
        visible={Boolean(editingTransaction)}
        transaction={editingTransaction}
        categories={vm.categories}
        onClose={() => setEditingTransactionId(null)}
        onSave={vm.saveTransactionEdit}
        onDelete={vm.deleteTransaction}
      />
      <MonthYearPickerSheet
        visible={monthPickerVisible}
        selectedYear={vm.visibleYear}
        selectedMonth={vm.visibleMonthNumber}
        onClose={() => setMonthPickerVisible(false)}
        onSelect={(year, month) => {
          vm.selectMonth(year, month);
          setMonthPickerVisible(false);
        }}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  pageTitle: { fontSize: 43, lineHeight: 49, letterSpacing: -1.2 },
  settingsButton: {
    width: 50,
    height: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: { paddingVertical: 14 },
  summary: { flexDirection: "row", alignItems: "stretch" },
  summaryStacked: { flexDirection: "column" },
  summaryGroup: { flex: 1, minWidth: 0, flexDirection: "row" },
  summaryGroupStacked: { flexDirection: "column" },
  summaryDivider: { width: StyleSheet.hairlineWidth, alignSelf: "stretch" },
  summaryDividerHorizontal: { width: "100%", height: StyleSheet.hairlineWidth },
  summaryItem: { flex: 1, minWidth: 0, gap: 4, paddingHorizontal: 8 },
  summaryItemStacked: { paddingVertical: 10 },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryLabel: { minHeight: 16, fontSize: 13, lineHeight: 16 },
  summaryValue: { fontSize: 20, lineHeight: 25, fontVariant: ["tabular-nums"] },
  summaryLens: { maxWidth: "100%", minHeight: 28, justifyContent: "center" },
  calendarCard: { paddingVertical: 12 },
  calendarHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  arrowButton: {
    width: 40,
    height: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitleButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  monthTitle: { flexShrink: 1, minWidth: 0, fontSize: 24, lineHeight: 30 },
  todayButton: {
    minHeight: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  todayText: { fontSize: 15, lineHeight: 20 },
  weekdayRow: { flexDirection: "row" },
  weekday: { flex: 1, minWidth: 0, textAlign: "center", fontSize: 13, lineHeight: 18 },
  grid: { gap: 2 },
  weekRow: { flexDirection: "row", gap: 4 },
  day: {
    flex: 1,
    minWidth: 0,
    height: 42,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  dayNumber: { fontSize: 15, lineHeight: 20, fontVariant: ["tabular-nums"] },
  activityDotSlot: { height: 6, justifyContent: "center" },
  activityDotRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
  activityDot: { width: 6, height: 6, borderRadius: 3 },
  dailyCard: { gap: 18 },
  dateHeaderGroup: { gap: 9 },
  dateHeading: { gap: 2 },
  sectionTitle: { fontSize: 24, lineHeight: 30 },
  dateContext: { fontSize: 14, lineHeight: 19 },
  pendingFireStatus: {
    minHeight: 26,
    alignSelf: "flex-start",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  pendingFireStatusText: { fontSize: 12, lineHeight: 16 },
  emptyState: { gap: 14, paddingTop: 2 },
  emptyCopy: { gap: 5 },
  emptyTitle: { fontSize: 18, lineHeight: 23 },
  emptyDescription: { fontSize: 16, lineHeight: 22 },
  addButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  addButtonText: { fontSize: 15, lineHeight: 20 },
  transactionList: { gap: 0 },
  transactionDivider: { height: StyleSheet.hairlineWidth, marginLeft: 54 },
  transactionRow: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 12 },
  transactionRowStacked: { alignItems: "stretch", flexDirection: "column", paddingVertical: 10 },
  transactionOpen: {
    flex: 1,
    minWidth: 0,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transactionOpenStacked: { minHeight: 52 },
  transactionCopy: { flex: 1, minWidth: 0, gap: 3 },
  transactionCategory: { fontSize: 17, lineHeight: 22 },
  transactionNote: { fontSize: 14, lineHeight: 19 },
  transactionMeta: {
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
  },
  transactionMetaStacked: { minWidth: 0, alignSelf: "stretch", justifyContent: "flex-start" },
  transactionAmount: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: 17,
    lineHeight: 22,
    fontVariant: ["tabular-nums"],
  },
  transactionAmountLens: { maxWidth: 170, minHeight: 44, justifyContent: "center" },
});
