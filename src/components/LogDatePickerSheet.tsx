import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";

import { MotionPressable } from "./MotionPressable";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
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
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(selectedDate));
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

  function selectDate(date: string) {
    onSelect(date);
    onClose();
  }

  function selectToday() {
    onToday();
    onClose();
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Animated.View
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={styles.scrim}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          entering={SlideInDown.duration(260)}
          exiting={SlideOutDown.duration(180)}
          style={[
            styles.sheet,
            { backgroundColor: colors.surfaceSolid, borderColor: colors.surfaceBorder },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.header}>
            <MotionPressable
              onPress={onClose}
              accessibilityLabel="Close date picker"
              style={[styles.closeButton, { backgroundColor: colors.backgroundAlt }]}
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
            </MotionPressable>
          </View>

          <MotionPressable
            onPress={selectToday}
            accessibilityLabel="Use today"
            style={[
              styles.todayButton,
              { borderColor: colors.primary, backgroundColor: `${colors.primary}18` },
            ]}
          >
            <MaterialCommunityIcons
              name="calendar-today-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.todayText, typography.button, { color: colors.primary }]}>
              TODAY
            </Text>
          </MotionPressable>

          <View style={styles.monthControls}>
            <View style={styles.navCluster}>
              <MotionPressable
                onPress={() => setVisibleMonth((current) => addIsoMonths(current, -12))}
                accessibilityLabel="Previous year"
                style={[styles.navButton, { borderColor: colors.surfaceBorder }]}
              >
                <MaterialCommunityIcons
                  name="chevron-double-left"
                  size={18}
                  color={colors.textMuted}
                />
              </MotionPressable>
              <MotionPressable
                onPress={() => setVisibleMonth((current) => addIsoMonths(current, -1))}
                accessibilityLabel="Previous month"
                style={[styles.navButton, { borderColor: colors.surfaceBorder }]}
              >
                <MaterialCommunityIcons name="chevron-left" size={20} color={colors.primary} />
              </MotionPressable>
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.monthLabel, typography.title, { color: colors.text }]}
            >
              {formatMonthYear(visibleMonth)}
            </Text>
            <View style={styles.navCluster}>
              <MotionPressable
                onPress={() => setVisibleMonth((current) => addIsoMonths(current, 1))}
                accessibilityLabel="Next month"
                style={[styles.navButton, { borderColor: colors.surfaceBorder }]}
              >
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary} />
              </MotionPressable>
              <MotionPressable
                onPress={() => setVisibleMonth((current) => addIsoMonths(current, 12))}
                accessibilityLabel="Next year"
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
            {weekdays.map((weekday) => (
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
                      accessibilityLabel={`Use ${day.date}`}
                      accessibilityState={{ selected: active }}
                      style={[
                        styles.day,
                        {
                          borderColor: active ? colors.primary : colors.surfaceBorder,
                          backgroundColor: active ? `${colors.primary}20` : colors.backgroundAlt,
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
                          <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />
                        ) : null}
                      </View>
                    </MotionPressable>
                  );
                })}
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
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
    maxHeight: "88%",
    borderTopLeftRadius: tokens.radius.card,
    borderTopRightRadius: tokens.radius.card,
    borderWidth: 1,
    padding: tokens.spacing.lg,
    gap: 18,
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
    justifyContent: "flex-end",
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  todayButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  todayText: {
    fontSize: 13,
  },
  monthControls: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  navCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: tokens.radius.utility,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabel: {
    flex: 1,
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
    gap: 7,
  },
  weekRow: {
    flexDirection: "row",
    gap: 7,
  },
  day: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 1,
    borderRadius: tokens.radius.utility,
    borderWidth: 1,
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
});
