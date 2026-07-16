import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeIn, FadeInRight } from "react-native-reanimated";

import { allocationPresentation, type AllocationInput } from "./allocationPresentation";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useI18n } from "../i18n";

const darkPalette = [
  tokens.color.cyan,
  "#93A3B8",
  tokens.color.ochre,
  tokens.color.indigo,
  "#C98068",
  tokens.color.emerald,
];

function formatAllocationLabel(label: string) {
  return label
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "etf") {
        return "ETF";
      }
      return `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
    })
    .join(" ");
}

function roundedPercentages(values: number[]) {
  if (values.length === 0) {
    return [];
  }

  const raw = values.map((value) => value * 100);
  const rounded = raw.map(Math.floor);
  let remaining = Math.max(0, 100 - rounded.reduce((sum, value) => sum + value, 0));
  const priority = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (const item of priority) {
    if (remaining <= 0) {
      break;
    }
    rounded[item.index] = (rounded[item.index] ?? 0) + 1;
    remaining -= 1;
  }

  return rounded;
}

export function AllocationBar({
  motionKey = 0,
  segments,
}: {
  motionKey?: number;
  segments: AllocationInput[];
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const reducedMotion = useReducedMotion();
  const palette =
    colors.mode === "dark"
      ? darkPalette
      : [colors.primary, "#62748A", colors.target, colors.projection, "#A75D45", colors.positive];
  const allocation = allocationPresentation(segments);
  const visibleSegments = allocation.rows.map((segment, index) => ({
    ...segment,
    color: palette[index % palette.length] ?? colors.primary,
  }));
  const percentages = roundedPercentages(visibleSegments.map((segment) => segment.percent));
  const dominantIndex = visibleSegments.reduce(
    (largest, segment, index, rows) =>
      segment.value > (rows[largest]?.value ?? -1) ? index : largest,
    0,
  );
  const dominant = visibleSegments[dominantIndex];
  const allocationLabel = (label: string) => {
    switch (label) {
      case "cash":
        return t.assets.classOptions.cash;
      case "etf":
        return t.assets.classOptions.etf;
      case "stock":
        return t.assets.classOptions.stock;
      case "crypto":
        return t.assets.classOptions.crypto;
      case "bond":
        return t.assets.classOptions.bond;
      case "real_estate":
        return t.assets.classOptions.realEstate;
      case "pension":
        return t.assets.classOptions.pension;
      case "private_investment":
        return t.assets.classOptions.privateInvestment;
      case "business":
        return t.assets.classOptions.business;
      case "custom":
        return t.assets.classOptions.custom;
      default:
        return formatAllocationLabel(label);
    }
  };

  if (allocation.total <= 0 || !dominant) {
    return (
      <Text style={[styles.empty, typography.body, { color: colors.textMuted }]}>
        {t.portfolio.noAllocation}
      </Text>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={t.portfolio.allocationSummary(
        visibleSegments
          .map((segment, index) =>
            t.portfolio.allocationPercent(allocationLabel(segment.label), percentages[index] ?? 0),
          )
          .join(", "),
      )}
      style={styles.root}
    >
      <View style={styles.leadMetric}>
        <Text style={[styles.leadValue, typography.display, { color: colors.text }]}>
          {percentages[dominantIndex] ?? 0}%
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.leadLabel, typography.title, { color: dominant.color }]}
        >
          {allocationLabel(dominant.label)}
        </Text>
      </View>

      <View style={[styles.ruler, { backgroundColor: colors.surfaceElevated }]}>
        {visibleSegments.map((segment, index) => (
          <Animated.View
            key={`${segment.label}-${motionKey}`}
            entering={
              reducedMotion
                ? undefined
                : FadeIn.duration(180)
                    .delay(index * 24)
                    .easing(Easing.out(Easing.cubic))
            }
            style={[
              styles.rulerSegment,
              {
                backgroundColor: segment.color,
                borderRightColor: colors.surface,
                borderRightWidth: index < visibleSegments.length - 1 ? 2 : 0,
                width: `${segment.percent * 100}%`,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.ledger}>
        {visibleSegments.map((segment, index) => (
          <Animated.View
            key={`${segment.label}-row-${motionKey}`}
            entering={
              reducedMotion
                ? undefined
                : FadeInRight.duration(210)
                    .delay(45 + index * 28)
                    .easing(Easing.out(Easing.cubic))
            }
            style={[
              styles.ledgerRow,
              index < visibleSegments.length - 1
                ? { borderBottomColor: colors.surfaceBorder }
                : undefined,
            ]}
          >
            <View style={[styles.colorRail, { backgroundColor: segment.color }]} />
            <Text
              numberOfLines={1}
              style={[styles.ledgerLabel, typography.bodyMedium, { color: colors.text }]}
            >
              {allocationLabel(segment.label)}
            </Text>
            <Text style={[styles.ledgerValue, typography.title, { color: colors.textSubtle }]}>
              {percentages[index] ?? 0}%
            </Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: tokens.spacing.lg,
  },
  empty: {
    paddingVertical: tokens.spacing.lg,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  leadMetric: {
    alignItems: "flex-start",
    gap: 2,
  },
  leadValue: {
    fontSize: 42,
    lineHeight: 48,
    fontVariant: ["tabular-nums"],
  },
  leadLabel: {
    maxWidth: "100%",
    fontSize: 16,
    lineHeight: 21,
  },
  ruler: {
    height: 20,
    borderRadius: 7,
    borderCurve: "continuous",
    flexDirection: "row",
    overflow: "hidden",
  },
  rulerSegment: {
    height: "100%",
  },
  ledger: {
    gap: 0,
  },
  ledgerRow: {
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  colorRail: {
    width: 4,
    height: 26,
    borderRadius: 2,
  },
  ledgerLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 20,
  },
  ledgerValue: {
    fontSize: 18,
    lineHeight: 23,
    fontVariant: ["tabular-nums"],
  },
});
