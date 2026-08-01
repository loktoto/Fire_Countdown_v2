import { StyleSheet, Text, View } from "react-native";
import Animated, { Easing, FadeInUp, FadeOut } from "react-native-reanimated";

import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { TimeLensValue, type TimeLensKind } from "./TimeLens";

function splitMetricValue(value: string) {
  const daysMatch = value.match(/^(.+?)\s+(days?)$/i);
  if (!daysMatch) {
    return { number: value, unit: null };
  }

  return { number: daysMatch[1], unit: daysMatch[2] };
}

export function HeroMetric({
  label,
  value,
  caption,
  align = "left",
  timeLens,
}: {
  label: string;
  value: string;
  caption?: string;
  align?: "left" | "center" | "right";
  timeLens?: { amount: number; kind: TimeLensKind; disabled?: boolean };
}) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();
  const alignItems = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  const textAlign = align;
  const captionJustify =
    align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
  const captionParts =
    caption
      ?.split("|")
      .map((part) => part.trim())
      .filter(Boolean) ?? [];
  const metric = splitMetricValue(value);

  return (
    <View style={[styles.root, { alignItems }]}>
      <Text style={[styles.label, typography.button, { color: colors.textMuted, textAlign }]}>
        {label}
      </Text>
      <Animated.View
        key={value}
        entering={
          reducedMotion ? undefined : FadeInUp.duration(220).easing(Easing.bezier(0.16, 1, 0.3, 1))
        }
        exiting={reducedMotion ? undefined : FadeOut.duration(90)}
        style={[styles.valueRow, { justifyContent: captionJustify }]}
      >
        {timeLens ? (
          <TimeLensValue
            amount={timeLens.amount}
            kind={timeLens.kind}
            moneyText={value}
            disabled={timeLens.disabled}
            style={styles.timeLensValue}
            textStyle={[styles.value, typography.display, { color: colors.text, textAlign }]}
            minimumFontScale={0.72}
          />
        ) : (
          <Text
            selectable
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            numberOfLines={1}
            style={[styles.value, typography.display, { color: colors.text, textAlign }]}
          >
            {metric.number}
            {metric.unit ? (
              <Text style={[styles.unit, typography.display, { color: colors.text }]}>
                {" "}
                {metric.unit}
              </Text>
            ) : null}
          </Text>
        )}
      </Animated.View>
      {captionParts.length > 0 ? (
        <View style={[styles.captionWrap, { justifyContent: captionJustify }]}>
          {captionParts.map((part, index) => (
            <Text
              key={`${part}-${index}`}
              style={[styles.caption, typography.body, { color: colors.textSubtle, textAlign }]}
            >
              {part}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    maxWidth: "100%",
    gap: 10,
  },
  label: {
    fontSize: 12,
    lineHeight: 18,
    textTransform: "uppercase",
  },
  valueRow: {
    alignSelf: "stretch",
    minHeight: 78,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  value: {
    maxWidth: "100%",
    flexShrink: 1,
    fontSize: 44,
    lineHeight: 60,
    fontVariant: ["tabular-nums"],
  },
  timeLensValue: { maxWidth: "100%", flexShrink: 1 },
  unit: {
    fontSize: 24,
    lineHeight: 38,
  },
  captionWrap: {
    alignSelf: "stretch",
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: tokens.spacing.md,
    rowGap: 6,
  },
  caption: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 22,
  },
});
