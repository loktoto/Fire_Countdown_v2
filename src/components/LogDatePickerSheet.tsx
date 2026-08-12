import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { MotionPressable } from "./MotionPressable";
import { sheetBackdropEnter, sheetBackdropExit, sheetEnter, sheetExit } from "../design/motion";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useI18n } from "../i18n";
import {
  addIsoDays,
  addIsoMonths,
  daysInIsoMonth,
  formatMonthYear,
  isoDateParts,
  todayIso,
  toIsoDate,
} from "../utils/format";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthStart(date: string) {
  const parts = isoDateParts(date);
  return toIsoDate(new Date(parts.year, parts.month - 1, 1));
}

type LogDatePickerSheetProps = {
  visible: boolean;
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  onToday: () => void;
};

export function LogDatePickerSheet(props: LogDatePickerSheetProps) {
  if (!props.visible) {
    return null;
  }

  return <VisibleLogDatePickerSheet {...props} />;
}

function VisibleLogDatePickerSheet({
  visible,
  selectedDate,
  onSelect,
  onClose,
  onToday,
}: LogDatePickerSheetProps) {
  const colors = useThemeColors();
  const t = useI18n();
  const reducedMotion = useReducedMotion();
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(selectedDate));
  const [monthYearPickerVisible, setMonthYearPickerVisible] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => isoDateParts(selectedDate).year);
  const today = todayIso();
  const monthParts = isoDateParts(visibleMonth);

  const calendarCells = useMemo(() => {
    const monthPrefix = `${monthParts.year}-${String(monthParts.month).padStart(2, "0")}`;
    const firstDate = `${monthPrefix}-01`;
    const leadingDays = (new Date(`${firstDate}T00:00:00`).getDay() + 6) % 7;
    const currentMonthDays = daysInIsoMonth(visibleMonth);
    const totalCells = Math.ceil((leadingDays + currentMonthDays) / 7) * 7;
    const startDate = addIsoDays(firstDate, -leadingDays);

    return Array.from({ length: totalCells }, (_, index) => {
      const date = addIsoDays(startDate, index);
      const parts = isoDateParts(date);
      return {
        key: date,
        date,
        day: parts.day,
        isCurrentMonth: parts.year === monthParts.year && parts.month === monthParts.month,
        isToday: date === today,
      };
    });
  }, [monthParts.month, monthParts.year, today, visibleMonth]);

  const calendarRows = useMemo(
    () =>
      Array.from({ length: Math.ceil(calendarCells.length / 7) }, (_, index) =>
        calendarCells.slice(index * 7, index * 7 + 7),
      ),
    [calendarCells],
  );

  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        number: index + 1,
        short: new Date(pickerYear, index, 1).toLocaleDateString(t.locale, { month: "short" }),
        full: new Date(pickerYear, index, 1).toLocaleDateString(t.locale, {
          month: "long",
          year: "numeric",
        }),
      })),
    [pickerYear, t.locale],
  );

  function selectDate(date: string) {
    onSelect(date);
    onClose();
  }

  function selectToday() {
    onToday();
    onClose();
  }

  return (
    <>
      <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
        <View style={styles.modalRoot}>
          <Animated.View
            entering={reducedMotion ? undefined : sheetBackdropEnter}
            exiting={reducedMotion ? undefined : sheetBackdropExit}
            style={styles.scrim}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </Animated.View>
          <Animated.View
            accessibilityViewIsModal
            entering={reducedMotion ? undefined : sheetEnter}
            exiting={reducedMotion ? undefined : sheetExit}
            style={[
              styles.sheet,
              { backgroundColor: colors.surfaceSolid, borderColor: colors.surfaceBorder },
            ]}
          >
            <View style={[styles.grabber, { backgroundColor: colors.surfaceBorder }]} />
            <View style={styles.header}>
              <MotionPressable
                onPress={selectToday}
                accessibilityLabel={t.datePicker.useToday}
                style={[
                  styles.todayButton,
                  { borderColor: colors.primaryBorder, backgroundColor: colors.primarySoft },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-today-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.todayText, typography.button, { color: colors.primary }]}>
                  {t.common.today}
                </Text>
              </MotionPressable>
              <MotionPressable
                onPress={onClose}
                accessibilityLabel={t.datePicker.close}
                style={[styles.closeButton, { backgroundColor: colors.backgroundAlt }]}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
              </MotionPressable>
            </View>

            {monthYearPickerVisible ? (
              <Animated.View
                entering={reducedMotion ? undefined : FadeIn.duration(180)}
                exiting={reducedMotion ? undefined : FadeOut.duration(120)}
                style={styles.monthYearPanel}
              >
                <View style={styles.pickerHeading}>
                  <MotionPressable
                    onPress={() => setMonthYearPickerVisible(false)}
                    accessibilityLabel={t.calendar.closeMonthPicker}
                    hitSlop={8}
                    haptic="selection"
                    style={styles.backButton}
                  >
                    <MaterialCommunityIcons name="arrow-left" size={22} color={colors.primary} />
                  </MotionPressable>
                  <Text style={[styles.pickerTitle, typography.title, { color: colors.text }]}>
                    {t.calendar.chooseMonth}
                  </Text>
                </View>

                <View
                  accessibilityRole="adjustable"
                  accessibilityLabel={String(pickerYear)}
                  style={[
                    styles.yearControl,
                    { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder },
                  ]}
                >
                  <MotionPressable
                    onPress={() => setPickerYear((value) => value - 1)}
                    onLongPress={() => setPickerYear((value) => value - 10)}
                    accessibilityLabel={t.calendar.previousYear}
                    holdLabel="−10"
                    haptic="selection"
                    style={styles.yearButton}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={24} color={colors.primary} />
                  </MotionPressable>
                  <Text style={[styles.year, typography.title, { color: colors.text }]}>
                    {pickerYear}
                  </Text>
                  <MotionPressable
                    onPress={() => setPickerYear((value) => value + 1)}
                    onLongPress={() => setPickerYear((value) => value + 10)}
                    accessibilityLabel={t.calendar.nextYear}
                    holdLabel="+10"
                    haptic="selection"
                    style={styles.yearButton}
                  >
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
                  </MotionPressable>
                </View>

                <View style={styles.monthGrid}>
                  {months.map((month) => {
                    const selected =
                      pickerYear === monthParts.year && month.number === monthParts.month;
                    return (
                      <MotionPressable
                        key={month.number}
                        onPress={() => {
                          setVisibleMonth(toIsoDate(new Date(pickerYear, month.number - 1, 1)));
                          setMonthYearPickerVisible(false);
                        }}
                        accessibilityLabel={t.calendar.selectMonth(month.full)}
                        accessibilityState={{ selected }}
                        haptic="selection"
                        style={[
                          styles.month,
                          {
                            backgroundColor: selected ? colors.primarySoft : colors.backgroundAlt,
                            borderColor: selected ? colors.primaryBorder : colors.surfaceBorder,
                          },
                        ]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.monthText,
                            typography.button,
                            { color: selected ? colors.primary : colors.text },
                          ]}
                        >
                          {month.short}
                        </Text>
                      </MotionPressable>
                    );
                  })}
                </View>
              </Animated.View>
            ) : (
              <Animated.View
                entering={reducedMotion ? undefined : FadeIn.duration(180)}
                exiting={reducedMotion ? undefined : FadeOut.duration(120)}
                style={styles.calendarPanel}
              >
                <View style={styles.monthControls}>
                  <MotionPressable
                    onPress={() => setVisibleMonth((current) => addIsoMonths(current, -1))}
                    accessibilityLabel={t.calendar.previousMonth}
                    hitSlop={8}
                    haptic="selection"
                    style={[styles.navButton, { borderColor: colors.surfaceBorder }]}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={22} color={colors.primary} />
                  </MotionPressable>
                  <MotionPressable
                    onPress={() => {
                      setPickerYear(monthParts.year);
                      setMonthYearPickerVisible(true);
                    }}
                    accessibilityLabel={t.calendar.chooseMonth}
                    accessibilityHint={t.calendar.chooseMonthHint}
                    haptic="selection"
                    style={styles.monthPickerButton}
                  >
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[styles.monthLabel, typography.title, { color: colors.text }]}
                    >
                      {formatMonthYear(visibleMonth, t.locale)}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={18} color={colors.primary} />
                  </MotionPressable>
                  <MotionPressable
                    onPress={() => setVisibleMonth((current) => addIsoMonths(current, 1))}
                    accessibilityLabel={t.calendar.nextMonth}
                    hitSlop={8}
                    haptic="selection"
                    style={[styles.navButton, { borderColor: colors.surfaceBorder }]}
                  >
                    <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
                  </MotionPressable>
                </View>

                <View style={styles.weekdayRow}>
                  {(t.locale === "zh-Hant-HK" ? t.dates.weekdays : weekdays).map((weekday) => (
                    <Text
                      key={weekday}
                      style={[styles.weekday, typography.button, { color: colors.textMuted }]}
                    >
                      {weekday}
                    </Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarRows.map((week) => (
                    <View key={week[0]?.key ?? "week"} style={styles.weekRow}>
                      {week.map((day) => {
                        const active = day.date === selectedDate;
                        return (
                          <MotionPressable
                            key={day.key}
                            onPress={() => selectDate(day.date)}
                            accessibilityLabel={t.datePicker.useDate(day.date)}
                            accessibilityState={{ selected: active }}
                            style={[
                              styles.day,
                              {
                                borderColor: active ? colors.primaryBorder : "transparent",
                                backgroundColor: active ? colors.primarySoft : "transparent",
                                opacity: day.isCurrentMonth ? 1 : 0.48,
                              },
                            ]}
                          >
                            <View style={styles.dayTopLine}>
                              <Text
                                style={[
                                  styles.dayNumber,
                                  typography.button,
                                  { color: active ? colors.primary : colors.text },
                                ]}
                              >
                                {day.day}
                              </Text>
                              {day.isToday ? (
                                <View
                                  style={[styles.todayDot, { backgroundColor: colors.primary }]}
                                />
                              ) : null}
                            </View>
                          </MotionPressable>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
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
    maxHeight: "84%",
    borderTopLeftRadius: tokens.radius.card,
    borderTopRightRadius: tokens.radius.card,
    borderWidth: 1,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: 12,
    paddingBottom: tokens.spacing.lg,
    gap: 12,
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
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  todayButton: {
    minHeight: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
  },
  todayText: {
    fontSize: 13,
  },
  calendarPanel: { gap: 12 },
  monthControls: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.sm,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  monthPickerButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: tokens.spacing.sm,
  },
  monthLabel: {
    minWidth: 0,
    textAlign: "center",
    fontSize: 17,
    lineHeight: 21,
  },
  weekdayRow: {
    flexDirection: "row",
    gap: 6,
  },
  weekday: {
    flex: 1,
    minWidth: 0,
    textAlign: "center",
    fontSize: 10,
    textTransform: "uppercase",
  },
  calendarGrid: {
    gap: 2,
  },
  weekRow: {
    flexDirection: "row",
    gap: 4,
  },
  day: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 1,
    borderRadius: tokens.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
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
  monthYearPanel: { gap: 14 },
  pickerHeading: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 0,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerTitle: { fontSize: 18, lineHeight: 24 },
  yearControl: {
    height: 56,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.card,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  yearButton: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  year: { fontSize: 25, lineHeight: 31, fontVariant: ["tabular-nums"] },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  month: {
    width: "31%",
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  monthText: { fontSize: 14, lineHeight: 19 },
});
