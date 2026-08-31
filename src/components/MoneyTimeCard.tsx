import { MaterialCommunityIcons } from "@expo/vector-icons";
import { memo } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { CategoryGlyph } from "./CategoryGlyph";
import { GlassCard } from "./GlassCard";
import { MotionPressable } from "./MotionPressable";
import { moneyTimeImpactPresentation } from "./moneyTimePresentation";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { MoneyTimeConversion } from "../engine/selectors";
import { useI18n } from "../i18n";
import { signedMoney } from "../utils/format";

export const MoneyTimeCard = memo(function Base({
  entries,
  onAddEntry,
  onOpenCalendar,
}: {
  entries: MoneyTimeConversion[];
  onAddEntry: () => void;
  onOpenCalendar: () => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const { fontScale, width } = useWindowDimensions();
  const compact = width < 440 || fontScale > 1.08;
  const stackRows = width < 360 || fontScale > 1.22;

  return (
    <GlassCard motionIndex={3} style={styles.card}>
      <View style={styles.header}>
        <Text
          accessibilityRole="header"
          style={[styles.title, typography.title, { color: colors.text }]}
        >
          {t.home.moneyTimeTitle}
        </Text>
        <Text style={[styles.subtitle, typography.body, { color: colors.textMuted }]}>
          {t.home.moneyTimeSubtitle}
        </Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceElevated }]}>
            <MaterialCommunityIcons name="clock-outline" size={22} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyText, typography.body, { color: colors.textMuted }]}>
            {t.home.moneyTimeEmpty}
          </Text>
          <MotionPressable
            onPress={onAddEntry}
            haptic="light"
            accessibilityLabel={t.home.moneyTimeAddEntry}
            style={[
              styles.addButton,
              { backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder },
            ]}
          >
            <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
            <Text style={[styles.addButtonText, typography.button, { color: colors.primary }]}>
              {t.home.moneyTimeAddEntry}
            </Text>
          </MotionPressable>
        </View>
      ) : (
        <View style={styles.list}>
          {entries.map((entry, index) => {
            const impact = moneyTimeImpactPresentation(entry, t.locale);
            const toneColor =
              impact.tone === "positive"
                ? colors.positive
                : impact.tone === "negative"
                  ? colors.negative
                  : colors.textMuted;
            const toneBackground =
              impact.tone === "positive"
                ? colors.positiveSoft
                : impact.tone === "negative"
                  ? colors.negativeSoft
                  : colors.surfaceElevated;
            const impactLabel =
              impact.state === "days" && impact.value !== null
                ? t.home.moneyTimeFireDays(impact.value)
                : impact.state === "in-range"
                  ? t.home.moneyTimeBringsIntoRange
                  : impact.state === "out-of-range"
                    ? t.home.moneyTimeMovesOutOfRange
                    : t.home.moneyTimeNoEstimate;
            const amount = entry.type === "income" ? entry.amount : -entry.amount;
            const amountColor = entry.type === "income" ? colors.positive : colors.negative;
            const categoryColor = entry.categoryColor ?? amountColor;

            return (
              <View key={`${entry.type}-${entry.categoryId}`}>
                {index > 0 ? (
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                ) : null}
                <MotionPressable
                  testID={`home-money-time-${entry.type}`}
                  onPress={onOpenCalendar}
                  haptic="selection"
                  accessibilityLabel={`${t.home.moneyTimeOpenCalendar(entry.categoryName)}. ${signedMoney(amount, entry.currency)}. ${impactLabel}.`}
                  accessibilityHint={t.home.moneyTimeOpenCalendarHint}
                  style={[styles.row, stackRows && styles.rowStacked]}
                >
                  <View style={styles.moneySide}>
                    <CategoryGlyph icon={entry.categoryIcon} color={categoryColor} size={44} />
                    <View style={styles.identity}>
                      <Text
                        numberOfLines={1}
                        style={[styles.categoryName, typography.bodyMedium, { color: colors.text }]}
                      >
                        {entry.categoryName}
                      </Text>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.78}
                        style={[styles.amount, typography.bodyMedium, { color: amountColor }]}
                      >
                        {signedMoney(amount, entry.currency)}
                      </Text>
                    </View>
                  </View>

                  {!compact && !stackRows ? (
                    <Text
                      accessible={false}
                      style={[styles.equals, typography.body, { color: colors.textTertiary }]}
                    >
                      =
                    </Text>
                  ) : null}

                  <View
                    style={[
                      styles.impactPill,
                      stackRows && styles.impactPillStacked,
                      { backgroundColor: toneBackground, borderColor: `${toneColor}48` },
                    ]}
                  >
                    <MaterialCommunityIcons name="clock-outline" size={18} color={toneColor} />
                    <Text
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.72}
                      style={[styles.impactText, typography.button, { color: toneColor }]}
                    >
                      {impactLabel}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={toneColor} />
                  </View>
                </MotionPressable>
              </View>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: { gap: tokens.spacing.sm },
  header: { gap: tokens.spacing.xxs },
  title: { fontSize: 18, lineHeight: 24 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  list: { gap: 0 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 54 },
  row: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
    borderRadius: tokens.radius.utility,
    paddingVertical: tokens.spacing.sm,
  },
  rowStacked: { alignItems: "stretch", flexDirection: "column", gap: tokens.spacing.sm },
  moneySide: { minWidth: 0, flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  identity: { minWidth: 0, flex: 1, gap: 1 },
  categoryName: { fontSize: 15, lineHeight: 20 },
  amount: { fontSize: 15, lineHeight: 20, fontVariant: ["tabular-nums"] },
  equals: { width: 12, fontSize: 17, lineHeight: 22, textAlign: "center" },
  impactPill: {
    minHeight: 44,
    width: 146,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  impactPillStacked: { alignSelf: "stretch", width: "100%" },
  impactText: { minWidth: 0, flex: 1, fontSize: 13, lineHeight: 17, textAlign: "center" },
  emptyState: { gap: tokens.spacing.md, alignItems: "center", paddingVertical: tokens.spacing.sm },
  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { maxWidth: 260, fontSize: 14, lineHeight: 20, textAlign: "center" },
  addButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.md,
  },
  addButtonText: { fontSize: 14, lineHeight: 18 },
});
