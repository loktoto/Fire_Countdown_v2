import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../components/AppHeader";
import { CategoryGlyph } from "../components/CategoryGlyph";
import { GlassCard } from "../components/GlassCard";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenContainer } from "../components/ScreenContainer";
import { TransactionEditorSheet } from "../components/TransactionEditorSheet";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useCalendarViewModel } from "../hooks/useCalendarViewModel";
import { useI18n } from "../i18n";
import { formatFullDate, money, signedMoney } from "../utils/format";

export function CalendarScreen() {
  const colors = useThemeColors();
  const t = useI18n();
  const vm = useCalendarViewModel();
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
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
    <ScreenContainer>
      <AppHeader
        eyebrow={t.calendar.kicker}
        title={t.calendar.title}
        subtitle={`${vm.monthLabel}. ${t.calendar.subtitle}`}
        accentColor={colors.projection}
      />

      <View
        style={[
          styles.summaryBand,
          { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, typography.body, { color: colors.textMuted }]}>
              {t.common.income}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.summaryValue, typography.title, { color: colors.positive }]}
            >
              {money(vm.summary.income, vm.currency)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, typography.body, { color: colors.textMuted }]}>
              {t.common.expense}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.summaryValue, typography.title, { color: colors.negative }]}
            >
              {money(vm.summary.expense, vm.currency)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, typography.body, { color: colors.textMuted }]}>
              {t.common.net}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.summaryValue, typography.title, { color: colors.text }]}
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
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.monthControlLabel, typography.title, { color: colors.text }]}
            >
              {vm.monthLabel}
            </Text>
            <MotionPressable
              onPress={vm.goToToday}
              accessibilityLabel={t.calendar.jumpToday}
              style={[styles.todayButton, { backgroundColor: colors.projectionSoft }]}
            >
              <MaterialCommunityIcons name="calendar-today" size={14} color={colors.projection} />
              <Text style={[styles.todayText, typography.button, { color: colors.projection }]}>
                {t.common.today}
              </Text>
            </MotionPressable>
          </View>
          <View style={styles.navigationRow}>
            <MotionPressable
              onPress={vm.goToPreviousYear}
              accessibilityLabel={t.calendar.previousYear}
              style={[styles.navButton, { borderColor: colors.surfaceBorder }]}
            >
              <MaterialCommunityIcons
                name="chevron-double-left"
                size={18}
                color={colors.textMuted}
              />
            </MotionPressable>
            <MotionPressable
              onPress={vm.goToPreviousMonth}
              accessibilityLabel={t.calendar.previousMonth}
              style={[styles.navButton, { borderColor: colors.surfaceBorder }]}
            >
              <MaterialCommunityIcons name="chevron-left" size={20} color={colors.projection} />
            </MotionPressable>
            <MotionPressable
              onPress={vm.goToNextMonth}
              accessibilityLabel={t.calendar.nextMonth}
              style={[styles.navButton, { borderColor: colors.surfaceBorder }]}
            >
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.projection} />
            </MotionPressable>
            <MotionPressable
              onPress={vm.goToNextYear}
              accessibilityLabel={t.calendar.nextYear}
              style={[styles.navButton, { borderColor: colors.surfaceBorder }]}
            >
              <MaterialCommunityIcons
                name="chevron-double-right"
                size={18}
                color={colors.textMuted}
              />
            </MotionPressable>
          </View>
        </View>

        <View style={styles.weekdayRow}>
          {vm.weekdays.map((weekday) => (
            <Text
              key={weekday}
              style={[styles.weekday, typography.button, { color: colors.textMuted }]}
            >
              {weekday}
            </Text>
          ))}
        </View>
        <View style={styles.grid}>
          {calendarRows.map((week) => (
            <View key={week[0]?.key ?? "week"} style={styles.weekRow}>
              {week.map((day) => {
                const selected = day.date === vm.selectedDate;
                const textColor = selected
                  ? colors.projection
                  : day.isCurrentMonth
                    ? colors.text
                    : colors.textMuted;
                const netColor =
                  !day.isCurrentMonth || day.net === 0
                    ? colors.textMuted
                    : day.net > 0
                      ? colors.positive
                      : colors.negative;
                return (
                  <MotionPressable
                    key={day.key}
                    onPress={() => vm.setSelectedDate(day.date)}
                    accessibilityLabel={t.calendar.dayNet(
                      day.date,
                      signedMoney(day.net, vm.currency),
                    )}
                    accessibilityState={{ selected }}
                    style={[
                      styles.day,
                      {
                        borderColor: selected ? `${colors.projection}66` : "transparent",
                        backgroundColor: selected ? colors.projectionSoft : "transparent",
                      },
                    ]}
                  >
                    <View style={styles.dayTopLine}>
                      <Text style={[styles.dayNumber, typography.button, { color: textColor }]}>
                        {day.day}
                      </Text>
                      {day.isToday ? (
                        <View style={[styles.todayDot, { backgroundColor: colors.projection }]} />
                      ) : null}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[styles.dayNet, typography.body, { color: netColor }]}
                    >
                      {day.net === 0
                        ? "-"
                        : signedMoney(day.net, vm.currency).replace(`${vm.currency} `, "")}
                    </Text>
                    <View style={[styles.cashflowTrack, { backgroundColor: colors.surfaceBorder }]}>
                      {day.net !== 0 ? (
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
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          {formatFullDate(vm.selectedDate, t.locale)}
        </Text>
        {vm.selectedTransactions.length === 0 ? (
          <Text style={[styles.empty, typography.body, { color: colors.textMuted }]}>
            {t.calendar.noRecordsForDate}
          </Text>
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
                <MotionPressable
                  key={transaction.id}
                  onPress={() => setEditingTransactionId(transaction.id)}
                  accessibilityLabel={t.calendar.editTransaction(
                    transaction.category?.name ?? t.calendar.uncategorized,
                    signedAmount,
                  )}
                  style={[
                    styles.transactionRow,
                    {
                      borderColor: colors.surfaceBorder,
                      backgroundColor: colors.backgroundAlt,
                    },
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
                      style={[styles.transactionCategory, typography.title, { color: colors.text }]}
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
                      {transaction.note ?? t.common.noNote}
                    </Text>
                  </View>
                  <View style={styles.transactionMeta}>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[styles.transactionAmount, typography.button, { color: amountColor }]}
                    >
                      {signedAmount}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={colors.textMuted}
                    />
                  </View>
                </MotionPressable>
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
    </ScreenContainer>
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
  summaryLabel: {
    fontSize: 11,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  calendarCard: {
    gap: tokens.spacing.sm,
  },
  calendarControls: {
    gap: tokens.spacing.sm,
  },
  navigationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  navButton: {
    flex: 1,
    minWidth: 44,
    height: 44,
    borderRadius: tokens.radius.utility,
    borderWidth: StyleSheet.hairlineWidth,
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
    gap: 6,
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
    gap: 7,
  },
  day: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 0.88,
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
  cashflowTrack: {
    width: "76%",
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
  transactionAmount: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: 13,
  },
});
