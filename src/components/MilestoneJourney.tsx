import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { money, percent } from "../utils/format";

type JourneyItem = {
  id: string;
  name: string;
  targetAmount: number;
  estimatedDate: string | null;
  isReached: boolean;
};

type MilestoneState = "reached" | "active" | "future";

type RowLayout = {
  y: number;
  height: number;
};

const TIMELINE_NODE_RADIUS = 18;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function monthLabel(date: string | null) {
  return date ? date.slice(0, 7) : "Pending";
}

function statusForItem(item: JourneyItem, index: number, activeIndex: number): MilestoneState {
  if (item.isReached) {
    return "reached";
  }

  return index === activeIndex ? "active" : "future";
}

function useNodePulse(active: boolean) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(active && reducedMotion ? 1 : 0);

  useEffect(() => {
    if (!active || reducedMotion) {
      pulse.value = active ? 1 : 0;
      return;
    }

    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
        withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.cubic) }),
      ),
      -1,
      true,
    );
  }, [active, pulse, reducedMotion]);

  return useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.16, 0.38], "clamp"),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.58], "clamp") }],
  }));
}

function useLoopedHeightStyle(targetHeight: number, active: boolean) {
  const reducedMotion = useReducedMotion();
  const height = useSharedValue(Math.max(0, targetHeight));

  useEffect(() => {
    const nextHeight = Math.max(0, targetHeight);

    if (!active || reducedMotion) {
      height.value = nextHeight;
      return;
    }

    height.value = 0;
    height.value = withRepeat(
      withSequence(
        withTiming(nextHeight, {
          duration: 950 + Math.min(450, Math.round(nextHeight * 2)),
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(nextHeight, { duration: 260 }),
        withTiming(0, { duration: 1 }),
      ),
      -1,
      false,
    );
  }, [active, height, reducedMotion, targetHeight]);

  return useAnimatedStyle(() => ({ height: height.value }));
}

function TimelineRail({
  activeDone,
  activeIndex,
  centers,
  primaryColor,
  positiveColor,
  stageProgress,
  trackColor,
}: {
  activeDone: boolean;
  activeIndex: number;
  centers: number[];
  primaryColor: string;
  positiveColor: string;
  stageProgress: number;
  trackColor: string;
}) {
  const hasCenters = centers.length > 1 && centers.every(Number.isFinite);
  const firstCenter = hasCenters ? (centers[0] ?? 0) : 0;
  const lastCenter = hasCenters ? (centers[centers.length - 1] ?? firstCenter) : firstCenter;
  const firstRailTop = firstCenter + TIMELINE_NODE_RADIUS;
  const lastRailBottom = Math.max(firstRailTop, lastCenter - TIMELINE_NODE_RADIUS);
  const completedEndIndex = activeDone
    ? centers.length - 1
    : Math.max(0, Math.min(activeIndex, centers.length - 1));
  const completedEndCenter = centers[completedEndIndex] ?? firstCenter;
  const completedBottom = Math.max(firstRailTop, completedEndCenter - TIMELINE_NODE_RADIUS);
  const completedHeight = hasCenters ? Math.max(0, completedBottom - firstRailTop) : 0;
  const activeEndIndex = activeIndex + 1;
  const hasActiveSegment = hasCenters && !activeDone && activeEndIndex < centers.length;
  const activeTop = hasActiveSegment
    ? (centers[activeIndex] ?? firstCenter) + TIMELINE_NODE_RADIUS
    : firstRailTop;
  const activeBottom = hasActiveSegment
    ? Math.max(activeTop, (centers[activeEndIndex] ?? activeTop) - TIMELINE_NODE_RADIUS)
    : activeTop;
  const activeTargetHeight = hasActiveSegment
    ? Math.max(0, (activeBottom - activeTop) * clamp01(stageProgress))
    : 0;
  const activeFillStyle = useLoopedHeightStyle(activeTargetHeight, activeTargetHeight > 0);

  if (!hasCenters) {
    return null;
  }

  return (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.timelineRail,
          {
            top: firstRailTop,
            height: Math.max(0, lastRailBottom - firstRailTop),
            backgroundColor: trackColor,
          },
        ]}
      />
      {completedHeight > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.timelineRail,
            {
              top: firstRailTop,
              height: completedHeight,
              backgroundColor: positiveColor,
            },
          ]}
        />
      ) : null}
      {activeTargetHeight > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.timelineRail,
            {
              top: activeTop,
              backgroundColor: primaryColor,
            },
            activeFillStyle,
          ]}
        />
      ) : null}
    </>
  );
}

function MilestoneProgressBar({
  color,
  progress,
  trackColor,
}: {
  color: string;
  progress: number;
  trackColor: string;
}) {
  const safeProgress = clamp01(progress);
  const displayProgress = safeProgress > 0 ? Math.max(0.03, safeProgress) : 0;

  return (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${displayProgress * 100}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

export function MilestoneJourney({
  currency = "HKD",
  currentAmount = 0,
  items,
}: {
  currency?: string;
  currentAmount?: number;
  items: JourneyItem[];
}) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();
  const [rowLayouts, setRowLayouts] = useState<Record<string, RowLayout>>({});
  const activeIndexRaw = items.findIndex((entry) => !entry.isReached);
  const activeIndex = activeIndexRaw === -1 ? Math.max(0, items.length - 1) : activeIndexRaw;
  const activeItem = items[activeIndex];
  const maxTarget = Math.max(1, ...items.map((item) => item.targetAmount));
  const journeyProgress = clamp01(currentAmount / maxTarget);
  const previousTarget = activeIndex > 0 ? (items[activeIndex - 1]?.targetAmount ?? 0) : 0;
  const activeTarget = Math.max(1, activeItem?.targetAmount ?? 1);
  const stageRange = Math.max(1, activeTarget - previousTarget);
  const stageProgress =
    activeIndexRaw === -1 ? 1 : clamp01((currentAmount - previousTarget) / stageRange);
  const activeGap = Math.max(0, activeTarget - currentAmount);
  const activeDone = activeIndexRaw === -1;
  const activePulseStyle = useNodePulse(items.length > 0);
  const nodeCenters = items.map((item) => {
    const layout = rowLayouts[item.id];
    return layout ? layout.y + layout.height / 2 : Number.NaN;
  });

  if (items.length === 0 || !activeItem) {
    return (
      <Text style={[styles.empty, typography.body, { color: colors.textMuted }]}>
        No milestones yet.
      </Text>
    );
  }

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.summary,
          {
            backgroundColor: `${colors.primary}0F`,
            borderColor: `${colors.primary}33`,
          },
        ]}
      >
        <View style={styles.summaryTop}>
          <View style={styles.summaryCopy}>
            <Text style={[styles.eyebrow, typography.button, { color: colors.primary }]}>
              Next checkpoint
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.activeName, typography.title, { color: colors.text }]}
            >
              {activeItem.name}
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: activeDone ? `${colors.positive}18` : `${colors.primary}18`,
                borderColor: activeDone ? `${colors.positive}66` : `${colors.primary}66`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                typography.button,
                { color: activeDone ? colors.positive : colors.primary },
              ]}
            >
              {activeDone ? "Complete" : "Next"}
            </Text>
          </View>
        </View>

        <View style={styles.metricRow}>
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, typography.body, { color: colors.textMuted }]}>
              To go
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.metricValue, typography.title, { color: colors.text }]}
            >
              {activeDone ? "Done" : money(activeGap, currency)}
            </Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, typography.body, { color: colors.textMuted }]}>
              Stage
            </Text>
            <Text style={[styles.metricValue, typography.title, { color: colors.text }]}>
              {percent(stageProgress, 0)}
            </Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.metric}>
            <Text style={[styles.metricLabel, typography.body, { color: colors.textMuted }]}>
              ETA
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.metricValue, typography.title, { color: colors.text }]}
            >
              {monthLabel(activeItem.estimatedDate)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.timelineHeader}>
        <Text style={[styles.timelineLabel, typography.button, { color: colors.textMuted }]}>
          Journey progress
        </Text>
        <Text style={[styles.timelineValue, typography.button, { color: colors.primary }]}>
          {percent(journeyProgress, 0)}
        </Text>
      </View>

      <View style={styles.timeline}>
        <TimelineRail
          activeDone={activeDone}
          activeIndex={activeIndex}
          centers={nodeCenters}
          primaryColor={colors.primary}
          positiveColor={colors.positive}
          stageProgress={stageProgress}
          trackColor={colors.surfaceBorder}
        />
        {items.map((item, index) => {
          const state = statusForItem(item, index, activeIndex);
          const itemProgress =
            state === "reached" ? 1 : clamp01(currentAmount / Math.max(1, item.targetAmount));
          const markerColor =
            state === "reached"
              ? colors.positive
              : state === "active"
                ? colors.primary
                : colors.textMuted;
          const statusLabel =
            state === "reached" ? "Reached" : state === "active" ? "Next" : "Later";
          const itemGap = Math.max(0, item.targetAmount - currentAmount);

          return (
            <Animated.View
              key={item.id}
              entering={
                reducedMotion
                  ? undefined
                  : FadeInUp.duration(260)
                      .delay(index * tokens.motion.staggerMs)
                      .easing(Easing.out(Easing.cubic))
              }
              onLayout={({ nativeEvent }) => {
                const { height, y } = nativeEvent.layout;

                setRowLayouts((currentLayouts) => {
                  const current = currentLayouts[item.id];

                  if (
                    current &&
                    Math.abs(current.y - y) < 0.5 &&
                    Math.abs(current.height - height) < 0.5
                  ) {
                    return currentLayouts;
                  }

                  return { ...currentLayouts, [item.id]: { y, height } };
                });
              }}
              style={styles.timelineItem}
            >
              <View style={styles.spine}>
                <View style={styles.nodeWrap}>
                  {state === "active" ? (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.nodePulse,
                        { backgroundColor: colors.primary },
                        activePulseStyle,
                      ]}
                    />
                  ) : null}
                  <View
                    style={[
                      styles.node,
                      {
                        backgroundColor:
                          state === "reached"
                            ? `${colors.positive}1F`
                            : state === "active"
                              ? `${colors.primary}1F`
                              : colors.background,
                        borderColor: markerColor,
                      },
                    ]}
                  >
                    <Text style={[styles.nodeIndex, typography.button, { color: markerColor }]}>
                      {index + 1}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.card,
                  {
                    opacity: state === "future" ? 0.68 : 1,
                    backgroundColor:
                      state === "active"
                        ? `${colors.primary}10`
                        : state === "reached"
                          ? `${colors.positive}0A`
                          : "transparent",
                    borderColor:
                      state === "active"
                        ? `${colors.primary}55`
                        : state === "reached"
                          ? `${colors.positive}33`
                          : colors.surfaceBorder,
                  },
                ]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardCopy}>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[styles.cardName, typography.title, { color: colors.text }]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[styles.cardMeta, typography.body, { color: colors.textMuted }]}
                    >
                      {money(item.targetAmount, currency)} target | ETA{" "}
                      {monthLabel(item.estimatedDate)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.cardStatus,
                      {
                        backgroundColor: `${markerColor}14`,
                        borderColor: `${markerColor}55`,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.cardStatusText, typography.button, { color: markerColor }]}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                <MilestoneProgressBar
                  color={markerColor}
                  progress={itemProgress}
                  trackColor={colors.surfaceBorder}
                />

                <View style={styles.cardFooter}>
                  <Text style={[styles.cardProgress, typography.button, { color: markerColor }]}>
                    {percent(itemProgress, 0)}
                  </Text>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[styles.cardGap, typography.body, { color: colors.textMuted }]}
                  >
                    {state === "reached" ? "Completed" : `${money(itemGap, currency)} left`}
                  </Text>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: tokens.spacing.md,
  },
  empty: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  summary: {
    borderWidth: 1,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
    gap: tokens.spacing.md,
  },
  summaryTop: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  summaryCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  activeName: {
    fontSize: 23,
    lineHeight: 29,
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  metricRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "stretch",
  },
  metric: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 4,
  },
  metricDivider: {
    width: 1,
    marginHorizontal: tokens.spacing.sm,
  },
  metricLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  metricValue: {
    fontSize: 16,
    lineHeight: 21,
  },
  timelineHeader: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timelineLabel: {
    fontSize: 12,
    lineHeight: 15,
    textTransform: "uppercase",
  },
  timelineValue: {
    fontSize: 13,
    lineHeight: 16,
  },
  timeline: {
    gap: 0,
    position: "relative",
  },
  timelineItem: {
    minHeight: 118,
    flexDirection: "row",
    gap: tokens.spacing.md,
    position: "relative",
    zIndex: 1,
  },
  timelineRail: {
    position: "absolute",
    left: 17,
    width: 2,
    borderRadius: tokens.radius.pill,
    zIndex: 0,
  },
  spine: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  nodePulse: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  node: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 15,
  },
  nodeIndex: {
    fontSize: 12,
    lineHeight: 15,
  },
  card: {
    flex: 1,
    minWidth: 0,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 18,
    padding: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  cardTop: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacing.sm,
  },
  cardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  cardName: {
    fontSize: 18,
    lineHeight: 23,
  },
  cardMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  cardStatus: {
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  cardStatusText: {
    fontSize: 10,
    lineHeight: 13,
    textTransform: "uppercase",
  },
  progressTrack: {
    height: 5,
    borderRadius: tokens.radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: tokens.radius.pill,
  },
  cardFooter: {
    minHeight: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.sm,
  },
  cardProgress: {
    fontSize: 13,
    lineHeight: 16,
  },
  cardGap: {
    flex: 1,
    minWidth: 0,
    textAlign: "right",
    fontSize: 12,
    lineHeight: 16,
  },
});
