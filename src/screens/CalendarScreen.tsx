import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import {
  calendarLayout,
  calendarNetColorRole,
  calendarSummaryColorRole,
} from "../components/calendarPresentation";
import { CategoryGlyph } from "../components/CategoryGlyph";
import { GlassCard } from "../components/GlassCard";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { TransactionEditorSheet } from "../components/TransactionEditorSheet";
import { TimeLensValue } from "../components/TimeLens";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useCalendarViewModel } from "../hooks/useCalendarViewModel";
import { useI18n } from "../i18n";
import { formatFullDate, money, signedMoney } from "../utils/format";

export function CalendarScreen() {
  const colors = useThemeColors();
  const t = useI18n();
  const vm = useCalendarViewModel();
  const { fontScale, width } = useWindowDimensions();
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const { compactDayMetrics, stackSummary, stackTransactions } = calendarLayout({
    fontScale,
    width,
  });
  const editingTransaction =
    vm.selectedTransactions.find((transaction) => transaction.id === editingTransactionId) ?? null;
  const calendarRows = useMemo(
    () =>
      Array.from({ length: Math.ceil(vm.calendarCells.length / 7) }, (_, index) =>
        vm.calendarCells.slice(index * 7, index * 7 + 7),
      ),
    [vm.calendarCells],
  );
  const maxAbsCurrentMonthNet = useMemo(
    () =>
      Math.max(
        1,
        ...vm.calendarCells.filter((day) => day.isCurrentMonth).map((day) => Math.abs(day.net)),
      ),
    [vm.calendarCells],
  );

  return (
    <ScreenScaffold>
      <AppHeader
        eyebrow={t.calendar.kicker}
        title={t.calendar.title}
        subtitle={`${vm.monthLabel}. ${t.calendar.subtitle}`}
        accentColor={colors.primary}
      />

      <View
        style={[
          styles.summaryBand,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={[styles.summary, stackSummary && styles.summaryStacked]}>
          <View style={[styles.summaryItem, stackSummary && styles.summaryItemStacked]}>
            <Text style={[styles.summaryLabel, typography.body, { color: colors.textMuted }]}>
              {t.common.income}
            </Text>
            <TimeLensValue
              amount={vm.summary.income}
              moneyText={money(vm.summary.income, vm.currency)}
              kind="income"
              accessibilityLabel={t.calendar.summaryValue(
                t.common.income,
                money(vm.summary.income, vm.currency),
              )}
              adjustsFontSizeToFit={false}
              numberOfLines={2}
              style={styles.summaryLens}
              textStyle={[
                styles.summaryValue,
                typography.title,
                {
                  color:
                    colors[
                      calendarSummaryColorRole({
                        amount: vm.summary.income,
                        kind: "income",
                      })
                    ],
                },
              ]}
            />
          </View>
          <View style={[styles.summaryItem, stackSummary && styles.summaryItemStacked]}>
            <Text style={[styles.summaryLabel, typography.body, { color: colors.textMuted }]}>
              {t.common.expense}
            </Text>
            <TimeLensValue
              amount={vm.summary.expense}
              moneyText={money(vm.summary.expense, vm.currency)}
              kind="expense"
              accessibilityLabel={t.calendar.summaryValue(
                t.common.expense,
                money(vm.summary.expense, vm.currency),
              )}
              adjustsFontSizeToFit={false}
              numberOfLines={2}
              style={styles.summaryLens}
              textStyle={[
                styles.summaryValue,
                typography.title,
                {
                  color:
                    colors[
                      calendarSummaryColorRole({
                        amount: vm.summary.expense,
                        kind: "expense",
                      })
                    ],
                },
              ]}
            />
          </View>
          <View style={[styles.summaryItem, stackSummary && styles.summaryItemStacked]}>
            <Text style={[styles.summaryLabel, typography.body, { color: colors.textMuted }]}>
              {t.calendar.netCashFlow}
            </Text>
            <Text
              numberOfLines={2}
              style={[
                styles.summaryValue,
                typography.title,
                {
                  color: colors[calendarNetColorRole(vm.summary.net)],
                },
              ]}
            >
              {signedMoney(vm.summary.net, vm.currency)}
            </Text>
          </View>
        </View>
      </View>

      <GlassCard style={styles.calendarCard}>
        <View style={styles.calendarControls}>
          <View style={styles.monthTitleRow}>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.monthControlLabel, typography.title, { color: colors.text }]}
            >
              {vm.monthLabel}
            </Text>
            <MotionPressable
              onPress={vm.goToToday}
              accessibilityLabel={t.calendar.jumpToday}
              style={[
                styles.todayButton,
                { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
              ]}
            >
              <MaterialCommunityIcons name="calendar-today" size={14} color={colors.primary} />
              <Text style={[styles.todayText, typography.button, { color: colors.primary }]}>
                {t.common.today}
              </Text>
            </MotionPressable>
          </View>
          <View
            accessibilityRole="toolbar"
            style={[
              styles.navigationRow,
              {
                backgroundColor: colors.backgroundAlt,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <MotionPressable
              onPress={vm.goToPreviousYear}
              accessibilityLabel={t.calendar.previousYear}
              style={styles.navButton}
            >
              <MaterialCommunityIcons name="chevron-double-left" size={18} color={colors.primary} />
            </MotionPressable>
            <MotionPressable
              onPress={vm.goToPreviousMonth}
              accessibilityLabel={t.calendar.previousMonth}
              style={styles.navButton}
            >
              <MaterialCommunityIcons name="chevron-left" size={20} color={colors.primary} />
            </MotionPressable>
            <MotionPressable
              onPress={vm.goToNextMonth}
              accessibilityLabel={t.calendar.nextMonth}
              style={styles.navButton}
            >
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary} />
            </MotionPressable>
            <MotionPressable
              onPress={vm.goToNextYear}
              accessibilityLabel={t.calendar.nextYear}
              style={styles.navButton}
            >
              <MaterialCommunityIcons
                name="chevron-double-right"
                size={18}
                color={colors.primary}
              />
            </MotionPressable>
          </View>
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
        <View style={styles.grid}>
          {calendarRows.map((week) => (
            <View key={week[0]?.key ?? "week"} style={styles.weekRow}>
              {week.map((day) => {
                const selected = day.date === vm.selectedDate;
                const textColor = selected
                  ? colors.primary
                  : day.isCurrentMonth
                    ? colors.text
                    : colors.textTertiary;
                const netColor =
                  !day.isCurrentMonth || day.net === 0
                    ? colors.textTertiary
                    : day.net > 0
                      ? colors.positive
                      : colors.negative;
                return (
                  <MotionPressable
                    key={day.key}
                    onPress={() => vm.setSelectedDate(day.date)}
                    accessibilityLabel={t.calendar.dayNet(
                      formatFullDate(day.date, t.locale),
                      signedMoney(day.net, vm.currency),
                      day.isToday,
                    )}
                    accessibilityState={{ selected }}
                    style={[
                      styles.day,
                      {
                        borderColor: selected ? colors.primaryBorder : "transparent",
                        backgroundColor: selected ? colors.primarySoft : "transparent",
                      },
                    ]}
                  >
                    <View style={styles.dayTopLine}>
                      <Text style={[styles.dayNumber, typography.button, { color: textColor }]}>
                        {day.day}
                      </Text>
                      {day.isToday ? (
                        <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
                      ) : null}
                    </View>
                    <View style={styles.dayMetricSlot}>
                      {day.net !== 0 ? (
                        compactDayMetrics ? (
                          <MaterialCommunityIcons
                            name={day.net > 0 ? "arrow-up-bold" : "arrow-down-bold"}
                            size={12}
                            color={netColor}
                          />
                        ) : (
                          <Text
                            numberOfLines={1}
                            style={[styles.dayNet, typography.body, { color: netColor }]}
                          >
                            {signedMoney(day.net, vm.currency).replace(`${vm.currency} `, "")}
                          </Text>
                        )
                      ) : null}
                    </View>
                    <View style={styles.cashflowSlot}>
                      {day.net !== 0 ? (
                        <View
                          style={[styles.cashflowTrack, { backgroundColor: colors.surfaceBorder }]}
                        >
                          <View
                            style={[
                              styles.cashflowFill,
                              {
                                alignSelf: day.net > 0 ? "flex-start" : "flex-end",
                                backgroundColor: netColor,
                                width: `${Math.max(
                                  12,
                                  Math.sqrt(Math.abs(day.net) / maxAbsCurrentMonthNet) * 100,
                                )}%`,
                              },
                            ]}
                          />
                        </View>
                      ) : null}
                    </View>
                  </MotionPressable>
                );
              })}
            </View>
          ))}
        </View>
      </GlassCard>

      <View style={styles.transactionSection}>
        <Text
          accessibilityRole="header"
          style={[styles.sectionTitle, typography.title, { color: colors.text }]}
        >
          {formatFullDate(vm.selectedDate, t.locale)}
        </Text>
        {vm.selectedTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
            </View>
            <View style={styles.emptyCopy}>
              <Text style={[styles.emptyTitle, typography.bodyMedium, { color: colors.text }]}>
                {t.calendar.noRecordsForDate}
              </Text>
              <Text style={[styles.empty, typography.body, { color: colors.textMuted }]}>
                {t.calendar.noRecordsHint}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.transactionList}>
            {vm.selectedTransactions.map((transaction) => {
              const categoryColor = transaction.category?.color ?? colors.primary;
              const amountColor = transaction.type === "income" ? colors.positive : colors.negative;
              const signedAmount =
                transaction.type === "income"
                  ? money(transaction.amount, transaction.currency)
                  : `-${money(transaction.amount, transaction.currency)}`;
              return (
                <View
                  key={transaction.id}
                  style={[
                    styles.transactionRow,
                    {
                      borderColor: colors.surfaceBorder,
                      backgroundColor: colors.backgroundAlt,
                    },
                    stackTransactions && styles.transactionRowStacked,
                  ]}
                >
                  <MotionPressable
                    onPress={() => setEditingTransactionId(transaction.id)}
                    accessibilityLabel={t.calendar.editTransaction(
                      transaction.category?.name ?? t.calendar.uncategorized,
                      signedAmount,
                    )}
                    style={[
                      styles.transactionOpen,
                      stackTransactions && styles.transactionOpenStacked,
                    ]}
                  >
                    <CategoryGlyph
                      icon={transaction.category?.icon}
                      color={categoryColor}
                      size={40}
                    />
                    <View style={styles.transactionCopy}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.transactionCategory,
                          typography.title,
                          { color: colors.text },
                        ]}
                      >
                        {transaction.category?.name ?? t.calendar.uncategorized}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.transactionNote,
                          typography.body,
                          { color: transaction.note ? colors.textMuted : `${colors.textMuted}99` },
                        ]}
                      >
                        {transaction.note ?? t.calendar.noNoteAdded}
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
                      onPress={() => setEditingTransactionId(transaction.id)}
                      accessibilityLabel={t.calendar.editTransaction(
                        transaction.category?.name ?? t.calendar.uncategorized,
                        signedAmount,
                      )}
                      adjustsFontSizeToFit={false}
                      numberOfLines={2}
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
                      color={colors.textMuted}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <TransactionEditorSheet
        visible={Boolean(editingTransaction)}
        transaction={editingTransaction}
        categories={vm.categories}
        onClose={() => setEditingTransactionId(null)}
        onSave={vm.saveTransactionEdit}
        onDelete={vm.deleteTransaction}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: tokens.spacing.md,
    columnGap: tokens.spacing.sm,
  },
  summaryStacked: {
    alignItems: "stretch",
    flexDirection: "column",
  },
  summaryBand: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.card,
    borderCurve: "continuous",
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  summaryItem: {
    flex: 1,
    minWidth: 92,
    gap: 4,
  },
  summaryItemStacked: {
    minWidth: "100%",
  },
  summaryLabel: {
    fontSize: 11,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  summaryLens: { maxWidth: "100%", minHeight: 44, justifyContent: "center" },
  calendarCard: {
    gap: tokens.spacing.sm,
  },
  calendarControls: {
    gap: tokens.spacing.sm,
  },
  navigationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    padding: 2,
    overflow: "hidden",
  },
  navButton: {
    flex: 1,
    minWidth: 44,
    height: 44,
    borderRadius: tokens.radius.utility,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitleRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  monthControlLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 21,
    lineHeight: 27,
  },
  todayButton: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  todayText: {
    fontSize: 10,
    textTransform: "uppercase",
  },
  weekdayRow: {
    flexDirection: "row",
    gap: 2,
  },
  weekday: {
    flex: 1,
    minWidth: 0,
    textAlign: "center",
    fontSize: 11,
    textTransform: "uppercase",
  },
  grid: {
    gap: 7,
  },
  weekRow: {
    flexDirection: "row",
    gap: 4,
  },
  day: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    aspectRatio: 1,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 4,
  },
  dayTopLine: {
    minHeight: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  dayNumber: {
    fontSize: 14,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dayNet: {
    fontSize: 10,
  },
  dayMetricSlot: {
    minHeight: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cashflowSlot: {
    width: "76%",
    minHeight: 3,
  },
  cashflowTrack: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  cashflowFill: {
    height: "100%",
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  emptyTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  transactionList: {
    gap: tokens.spacing.sm,
  },
  transactionSection: {
    gap: tokens.spacing.md,
  },
  transactionRow: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    padding: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  transactionRowStacked: {
    alignItems: "stretch",
    flexDirection: "column",
  },
  transactionOpen: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  transactionOpenStacked: {
    minHeight: 44,
  },
  transactionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  transactionCategory: {
    fontSize: 16,
    lineHeight: 20,
  },
  transactionNote: {
    fontSize: 13,
    lineHeight: 17,
  },
  transactionMeta: {
    minWidth: 116,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
  },
  transactionMetaStacked: {
    minWidth: 0,
    alignSelf: "stretch",
    justifyContent: "flex-start",
  },
  transactionAmount: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: 13,
  },
  transactionAmountLens: { maxWidth: 150, minHeight: 44, justifyContent: "center" },
});
