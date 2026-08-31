import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FormBottomSheet } from "./FormBottomSheet";
import { MotionPressable } from "./MotionPressable";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useI18n } from "../i18n";

type MonthYearPickerSheetProps = {
  visible: boolean;
  selectedYear: number;
  selectedMonth: number;
  onSelect: (year: number, month: number) => void;
  onClose: () => void;
};

export function MonthYearPickerSheet(props: MonthYearPickerSheetProps) {
  if (!props.visible) return null;
  return <VisibleMonthYearPickerSheet {...props} />;
}

function VisibleMonthYearPickerSheet({
  visible,
  selectedYear,
  selectedMonth,
  onSelect,
  onClose,
}: MonthYearPickerSheetProps) {
  const colors = useThemeColors();
  const t = useI18n();
  const [year, setYear] = useState(selectedYear);
  const months = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        number: index + 1,
        short: new Date(2026, index, 1).toLocaleDateString(t.locale, { month: "short" }),
        full: new Date(year, index, 1).toLocaleDateString(t.locale, {
          month: "long",
          year: "numeric",
        }),
      })),
    [t.locale, year],
  );

  return (
    <FormBottomSheet
      visible={visible}
      kicker={t.calendar.title}
      title={t.calendar.chooseMonth}
      closeLabel={t.calendar.closeMonthPicker}
      onClose={onClose}
    >
      <Text style={[styles.hint, typography.body, { color: colors.textMuted }]}>
        {t.calendar.chooseMonthHint}
      </Text>

      <View
        accessibilityRole="adjustable"
        accessibilityLabel={String(year)}
        style={[
          styles.yearControl,
          { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder },
        ]}
      >
        <MotionPressable
          onPress={() => setYear((value) => value - 1)}
          onLongPress={() => setYear((value) => value - 10)}
          accessibilityLabel={t.calendar.previousYear}
          holdLabel="−10"
          haptic="selection"
          style={styles.yearButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.primary} />
        </MotionPressable>
        <Text style={[styles.year, typography.title, { color: colors.text }]}>{year}</Text>
        <MotionPressable
          onPress={() => setYear((value) => value + 1)}
          onLongPress={() => setYear((value) => value + 10)}
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
          const selected = year === selectedYear && month.number === selectedMonth;
          return (
            <MotionPressable
              key={month.number}
              onPress={() => onSelect(year, month.number)}
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
              {selected ? (
                <MaterialCommunityIcons name="check" size={16} color={colors.primary} />
              ) : null}
            </MotionPressable>
          );
        })}
      </View>
    </FormBottomSheet>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 15, lineHeight: 21 },
  yearControl: {
    height: 58,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.card,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  yearButton: { width: 52, height: 52, alignItems: "center", justifyContent: "center" },
  year: { fontSize: 26, lineHeight: 32, fontVariant: ["tabular-nums"] },
  monthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  month: {
    width: "31%",
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    borderCurve: "continuous",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  monthText: { fontSize: 15, lineHeight: 20 },
});
