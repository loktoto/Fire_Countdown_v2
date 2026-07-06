import { useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import type { ProjectionPoint } from "../engine/fireEngine";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";

const viewBox = {
  width: 328,
  height: 286,
};
const chart = {
  left: 18,
  right: 312,
  top: 42,
  bottom: 220,
};
const monthsAfterFire = 15 * 12;

type ChartBounds = {
  visiblePoints: ProjectionPoint[];
  maxValue: number;
  endMonth: number;
};

type ScreenPoint = {
  x: number;
  y: number;
};

function buildChartBounds(points: ProjectionPoint[]): ChartBounds {
  if (points.length === 0) {
    return { visiblePoints: [], maxValue: 1, endMonth: 1 };
  }

  const reachedIndex = points.findIndex((point) => point.reached);
  const desiredEndIndex =
    reachedIndex >= 0
      ? Math.max(reachedIndex + monthsAfterFire, 12)
      : Math.min(points.length - 1, 40 * 12);
  const safeEndIndex = Math.min(points.length - 1, desiredEndIndex);
  const visiblePoints = points.slice(0, safeEndIndex + 1);
  const maxValue =
    Math.max(
      1,
      ...visiblePoints.map((point) => point.projectedAssets),
      ...visiblePoints.map((point) => point.fireTarget),
    ) * 1.08;

  return {
    visiblePoints,
    maxValue,
    endMonth: Math.max(1, points[safeEndIndex]?.monthIndex ?? 1),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function scaledPoint(
  bounds: ChartBounds,
  point: ProjectionPoint,
  key: "projectedAssets" | "fireTarget",
): ScreenPoint {
  const width = chart.right - chart.left;
  const height = chart.bottom - chart.top;
  const value = point[key];

  return {
    x: chart.left + (point.monthIndex / bounds.endMonth) * width,
    y: chart.bottom - (value / bounds.maxValue) * height,
  };
}

function smoothPath(points: ScreenPoint[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`;
  }

  const commands = [`M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[Math.max(0, index - 1)]!;
    const current = points[index]!;
    const next = points[index + 1]!;
    const following = points[Math.min(points.length - 1, index + 2)]!;
    const control1 = {
      x: current.x + (next.x - previous.x) / 6,
      y: current.y + (next.y - previous.y) / 6,
    };
    const control2 = {
      x: next.x - (following.x - current.x) / 6,
      y: next.y - (following.y - current.y) / 6,
    };

    commands.push(
      `C ${control1.x.toFixed(1)} ${control1.y.toFixed(1)}, ${control2.x.toFixed(
        1,
      )} ${control2.y.toFixed(1)}, ${next.x.toFixed(1)} ${next.y.toFixed(1)}`,
    );
  }

  return commands.join(" ");
}

function makePath(bounds: ChartBounds, key: "projectedAssets" | "fireTarget") {
  return smoothPath(bounds.visiblePoints.map((point) => scaledPoint(bounds, point, key)));
}

function makeAreaPath(bounds: ChartBounds) {
  const linePoints = bounds.visiblePoints.map((point) =>
    scaledPoint(bounds, point, "projectedAssets"),
  );
  const linePath = smoothPath(linePoints);

  if (!linePath || linePoints.length === 0) {
    return "";
  }

  const first = linePoints[0]!;
  const last = linePoints[linePoints.length - 1]!;
  return `${linePath} L ${last.x.toFixed(1)} ${chart.bottom} L ${first.x.toFixed(
    1,
  )} ${chart.bottom} Z`;
}

function nearestPoint(points: ProjectionPoint[], monthIndex: number) {
  return points.reduce<ProjectionPoint | null>((nearest, point) => {
    if (!nearest) {
      return point;
    }

    return Math.abs(point.monthIndex - monthIndex) < Math.abs(nearest.monthIndex - monthIndex)
      ? point
      : nearest;
  }, null);
}

function compactMoney(value: number, currency: string) {
  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    const digits = abs >= 10_000_000 ? 1 : 2;
    return `${currency} ${(value / 1_000_000).toFixed(digits).replace(/\.0+$/, "")}M`;
  }

  if (abs >= 1_000) {
    return `${currency} ${(value / 1_000).toFixed(1).replace(/\.0+$/, "")}K`;
  }

  return `${currency} ${Math.round(value).toLocaleString()}`;
}

function ageAtPoint(currentAge: number | null | undefined, point: ProjectionPoint) {
  if (currentAge === null || currentAge === undefined) {
    return null;
  }

  return Math.max(0, Math.floor(currentAge + point.monthIndex / 12));
}

function tooltipLayout(anchor: ScreenPoint) {
  const width = 138;
  const height = 82;
  const preferredX = anchor.x > viewBox.width / 2 ? anchor.x - width - 12 : anchor.x + 12;
  const preferredY = anchor.y < 120 ? anchor.y + 14 : anchor.y - height - 14;

  return {
    x: clamp(preferredX, 10, viewBox.width - width - 10),
    y: clamp(preferredY, 8, viewBox.height - height - 8),
    width,
    height,
  };
}

export function WealthCrossoverChart({
  projection,
  currency = "HKD",
  currentAge,
}: {
  projection: ProjectionPoint[];
  currency?: string;
  currentAge?: number | null;
}) {
  const colors = useThemeColors();
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const reached = projection.find((point) => point.reached);
  const bounds = useMemo(() => buildChartBounds(projection), [projection]);
  const selectedPoint = useMemo(() => {
    if (bounds.visiblePoints.length === 0) {
      return null;
    }

    return nearestPoint(bounds.visiblePoints, selectedMonth ?? reached?.monthIndex ?? 0);
  }, [bounds.visiblePoints, reached?.monthIndex, selectedMonth]);
  const current = bounds.visiblePoints[0];
  const currentPoint = current ? scaledPoint(bounds, current, "projectedAssets") : null;
  const reachedPoint =
    reached && reached.monthIndex <= bounds.endMonth
      ? scaledPoint(bounds, reached, "projectedAssets")
      : null;
  const selectedScreenPoint = selectedPoint
    ? scaledPoint(bounds, selectedPoint, "projectedAssets")
    : null;
  const selectedTooltip = selectedScreenPoint ? tooltipLayout(selectedScreenPoint) : null;
  const selectedAge = selectedPoint ? ageAtPoint(currentAge, selectedPoint) : null;

  function onLayout(event: LayoutChangeEvent) {
    setChartWidth(event.nativeEvent.layout.width);
  }

  function selectFromX(localX: number) {
    if (!chartWidth || bounds.visiblePoints.length === 0) {
      return;
    }

    const viewX = clamp((localX / chartWidth) * viewBox.width, chart.left, chart.right);
    const ratio = (viewX - chart.left) / (chart.right - chart.left);
    const month = ratio * bounds.endMonth;
    setSelectedMonth(nearestPoint(bounds.visiblePoints, month)?.monthIndex ?? 0);
  }

  function onResponder(event: GestureResponderEvent) {
    selectFromX(event.nativeEvent.locationX);
  }

  const webHoverProps =
    Platform.OS === "web"
      ? ({
          onMouseMove: (event: {
            nativeEvent?: { locationX?: number; offsetX?: number; layerX?: number };
          }) =>
            selectFromX(
              event.nativeEvent?.offsetX ??
                event.nativeEvent?.locationX ??
                event.nativeEvent?.layerX ??
                0,
            ),
        } as object)
      : {};

  return (
    <View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, typography.bodyMedium, { color: colors.text }]}>
            Portfolio
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: colors.negative }]} />
          <Text style={[styles.legendText, typography.bodyMedium, { color: colors.text }]}>
            FIRE target
          </Text>
        </View>
      </View>
      <View
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onResponder}
        onResponderMove={onResponder}
        {...webHoverProps}
      >
        <Svg
          accessibilityLabel={
            reached
              ? `Wealth crossover chart. Portfolio reaches the required FIRE target in ${reached.date.slice(
                  0,
                  7,
                )}. After FIRE, monthly savings stop and retirement withdrawals are modeled.`
              : "Wealth crossover chart. Portfolio does not reach the required FIRE target in the modeled window."
          }
          width="100%"
          height={viewBox.height}
          viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
        >
          <Defs>
            <LinearGradient id="portfolioArea" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity="0.24" />
              <Stop offset="1" stopColor={colors.primary} stopOpacity="0.03" />
            </LinearGradient>
          </Defs>
          <Line x1={chart.left} y1="54" x2={chart.right} y2="54" stroke={colors.surfaceBorder} />
          <Line x1={chart.left} y1="116" x2={chart.right} y2="116" stroke={colors.surfaceBorder} />
          <Line x1={chart.left} y1="178" x2={chart.right} y2="178" stroke={colors.surfaceBorder} />
          <Line
            x1={chart.left}
            y1={chart.bottom}
            x2={chart.right}
            y2={chart.bottom}
            stroke={colors.surfaceBorder}
          />
          <Path d={makeAreaPath(bounds)} fill="url(#portfolioArea)" />
          <Path
            d={makePath(bounds, "fireTarget")}
            stroke={colors.negative}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={makePath(bounds, "projectedAssets")}
            stroke={colors.primary}
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {currentPoint ? (
            <>
              <Circle
                cx={currentPoint.x}
                cy={currentPoint.y}
                r={7}
                fill={colors.surfaceSolid}
                stroke={colors.primary}
                strokeWidth={3}
              />
              <Circle cx={currentPoint.x} cy={currentPoint.y} r={3} fill={colors.primary} />
              <SvgText
                x={currentPoint.x + 10}
                y={clamp(currentPoint.y - 10, 26, 210)}
                fill={colors.textSubtle}
                fontSize="10"
                fontWeight="600"
              >
                Now
              </SvgText>
            </>
          ) : null}
          {reachedPoint ? (
            <>
              <Line
                x1={reachedPoint.x}
                y1={chart.top}
                x2={reachedPoint.x}
                y2={chart.bottom}
                stroke={colors.primary}
                strokeDasharray="4 5"
                opacity={0.34}
              />
              <Circle
                cx={reachedPoint.x}
                cy={reachedPoint.y}
                r={14}
                fill="none"
                stroke={colors.primary}
                opacity={0.24}
                strokeWidth={4}
              />
              <Circle
                cx={reachedPoint.x}
                cy={reachedPoint.y}
                r={7}
                fill={colors.primary}
                opacity={0.94}
              />
              <SvgText
                x={clamp(reachedPoint.x - 20, 18, 270)}
                y={clamp(reachedPoint.y - 16, 24, 210)}
                fill={colors.primary}
                fontSize="10"
                fontWeight="800"
              >
                FIRE
              </SvgText>
            </>
          ) : null}
          {selectedPoint && selectedScreenPoint && selectedTooltip ? (
            <G>
              <Line
                x1={selectedScreenPoint.x}
                y1={chart.top}
                x2={selectedScreenPoint.x}
                y2={chart.bottom}
                stroke={colors.textMuted}
                strokeDasharray="3 5"
                opacity={0.34}
              />
              <Circle
                cx={selectedScreenPoint.x}
                cy={selectedScreenPoint.y}
                r={5}
                fill={colors.surfaceSolid}
                stroke={colors.primary}
                strokeWidth={3}
              />
              <Rect
                x={selectedTooltip.x}
                y={selectedTooltip.y}
                width={selectedTooltip.width}
                height={selectedTooltip.height}
                rx={14}
                fill={colors.surfaceSolid}
                stroke={colors.surfaceBorder}
                strokeWidth={1}
              />
              <SvgText
                x={selectedTooltip.x + 12}
                y={selectedTooltip.y + 20}
                fill={colors.text}
                fontSize="11"
                fontWeight="800"
              >
                Projection
              </SvgText>
              <SvgText
                x={selectedTooltip.x + 12}
                y={selectedTooltip.y + 38}
                fill={colors.textMuted}
                fontSize="10"
                fontWeight="700"
              >
                {selectedAge === null ? "Age not set" : `Age ${selectedAge}`}
              </SvgText>
              <SvgText
                x={selectedTooltip.x + 12}
                y={selectedTooltip.y + 55}
                fill={colors.textMuted}
                fontSize="10"
                fontWeight="700"
              >
                {selectedPoint.date.slice(0, 7)}
              </SvgText>
              <SvgText
                x={selectedTooltip.x + 12}
                y={selectedTooltip.y + 72}
                fill={colors.primary}
                fontSize="10"
                fontWeight="800"
              >
                {compactMoney(selectedPoint.projectedAssets, currency)}
              </SvgText>
            </G>
          ) : null}
        </Svg>
      </View>
      <Text style={[styles.summary, typography.body, { color: colors.textMuted }]}>
        {reached
          ? `Crossover: ${reached.date.slice(
              0,
              7,
            )} | after FIRE, savings stop and withdrawals are modeled.`
          : "Projection does not reach FIRE in the modeled window."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: tokens.spacing.md,
    rowGap: tokens.spacing.sm,
    marginTop: tokens.spacing.sm,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendLine: {
    width: 22,
    height: 4,
    borderRadius: tokens.radius.pill,
  },
  legendText: {
    fontSize: 12,
    lineHeight: 17,
  },
  summary: {
    fontSize: 13,
    lineHeight: 19,
  },
});
