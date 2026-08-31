import { memo, useEffect, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useI18n } from "../i18n";
import { formatMonthYear, money, percent } from "../utils/format";
import {
  milestoneProgressValues,
  shouldStackMilestoneCards,
  shouldStackMilestoneSummary,
} from "./milestonePresentation";

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

function monthLabel(date: string | null, pendingLabel: string, locale: string) {
  return date ? formatMonthYear(date, locale) : pendingLabel;
}

function statusForItem(item: JourneyItem, index: number, activeIndex: number): MilestoneState {
  if (item.isReached) {
    return "reached";
  }

  return index === activeIndex ? "active" : "future";
}

function useNodePulse(active: boolean) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(pulse);

    if (!active || reducedMotion) {
      pulse.value = 0;
      return;
    }

    pulse.value = 0;
    pulse.value = withSequence(
      withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) }),
      withTiming(0.12, { duration: 110, easing: Easing.inOut(Easing.cubic) }),
    );
  }, [active, pulse, reducedMotion]);

  return useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.16, 0.38], "clamp"),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.58], "clamp") }],
  }));
}

function useProgressFillStyle(targetHeight: number, active: boolean) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    cancelAnimation(progress);

    if (!active || reducedMotion) {
      progress.value = 1;
      return;
    }

    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 240,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [active, progress, reducedMotion, targetHeight]);

  return useAnimatedStyle(() => ({
    transform: [{ translateY: -(1 - progress.value) * targetHeight }],
  }));
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
  const segments = hasCenters
    ? centers.slice(0, -1).map((center, index) => {
        const nextCenter = centers[index + 1] ?? center;
        const top = center + TIMELINE_NODE_RADIUS;
        const bottom = nextCenter - TIMELINE_NODE_RADIUS;

        return {
          index,
          top,
          height: Math.max(0, bottom - top),
        };
      })
    : [];
  const completedSegments = activeDone ? segments.length : Math.max(0, activeIndex);
  const activeSegment = !activeDone ? segments[activeIndex] : undefined;
  const activeTargetHeight = activeSegment
    ? Math.max(0, activeSegment.height * clamp01(stageProgress))
    : 0;
  const activeFillStyle = useProgressFillStyle(activeTargetHeight, activeTargetHeight > 0);

  if (!hasCenters) {
    return null;
  }

  return (
    <>
      {segments.map((segment) => (
        <View
          key={`track-${segment.index}`}
          pointerEvents="none"
          style={[
            styles.timelineRail,
            {
              top: segment.top,
              height: segment.height,
              backgroundColor: trackColor,
            },
          ]}
        />
      ))}
      {segments.slice(0, completedSegments).map((segment) => (
        <View
          key={`complete-${segment.index}`}
          pointerEvents="none"
          style={[
            styles.timelineRail,
            {
              top: segment.top,
              height: segment.height,
              backgroundColor: positiveColor,
            },
          ]}
        />
      ))}
      {activeSegment && activeTargetHeight > 0 ? (
        <View
          pointerEvents="none"
          style={[
            styles.timelineRailClip,
            {
              top: activeSegment.top,
              height: activeTargetHeight,
            },
          ]}
        >
          <Animated.View
            style={[styles.timelineRailFill, { backgroundColor: primaryColor }, activeFillStyle]}
          />
        </View>
      ) : null}
    </>
  );
}

function MilestoneProgressBar({
  accessibilityLabel,
  color,
  progress,
  trackColor,
}: {
  accessibilityLabel: string;
  color: string;
  progress: number;
  trackColor: string;
}) {
  const safeProgress = clamp01(progress);
  const displayProgress = safeProgress > 0 ? Math.max(0.03, safeProgress) : 0;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(safeProgress * 100) }}
      style={[styles.progressTrack, { backgroundColor: trackColor }]}
    >
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

export const MilestoneJourney = memo(function MilestoneJourneyBase({
  currency = "HKD",
  currentAmount = 0,
  items,
}: {
  currency?: string;
  currentAmount?: number;
  items: JourneyItem[];
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const reducedMotion = useReducedMotion();
  const { fontScale, width } = useWindowDimensions();
  const [rowLayouts, setRowLayouts] = useState<Record<string, RowLayout>>({});
  const stackSummary = shouldStackMilestoneSummary(width, fontScale);
  const stackCards = shouldStackMilestoneCards(width, fontScale);
  const activeIndexRaw = items.findIndex((entry) => !entry.isReached);
  const activeIndex = activeIndexRaw === -1 ? Math.max(0, items.length - 1) : activeIndexRaw;
  const activeItem = items[activeIndex];
  const maxTarget = Math.max(1, ...items.map((item) => item.targetAmount));
  const previousTarget = activeIndex > 0 ? (items[activeIndex - 1]?.targetAmount ?? 0) : 0;
  const activeTarget = Math.max(1, activeItem?.targetAmount ?? 1);
  const milestoneProgress = milestoneProgressValues({
    activeTarget,
    currentAmount,
    maxTarget,
    previousTarget,
  });
  const activeProgress = activeIndexRaw === -1 ? 1 : milestoneProgress.active;
  const journeyProgress = milestoneProgress.journey;
  const stageProgress = activeIndexRaw === -1 ? 1 : milestoneProgress.stage;
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
        {t.milestoneJourney.noMilestonesYet}
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
              {activeDone ? t.milestoneJourney.pathComplete : t.milestoneJourney.nextCheckpoint}
            </Text>
            <Text
              numberOfLines={2}
              style={[styles.activeName, typography.title, { color: colors.text }]}
            >
              {activeItem.name}
            </Text>
          </View>
        </View>

        <View style={[styles.metricRow, stackSummary && styles.metricRowStacked]}>
          <View style={[styles.metric, stackSummary && styles.metricStacked]}>
            <Text style={[styles.metricLabel, typography.body, { color: colors.textMuted }]}>
              {t.milestoneJourney.toGo}
            </Text>
            <Text
              numberOfLines={2}
              style={[styles.metricValue, typography.title, { color: colors.text }]}
            >
              {activeDone ? t.milestoneJourney.done : money(activeGap, currency)}
            </Text>
          </View>
          <View
            style={[
              styles.metricDivider,
              stackSummary && styles.metricDividerStacked,
              { backgroundColor: colors.surfaceBorder },
            ]}
          />
          <View style={[styles.metric, stackSummary && styles.metricStacked]}>
            <Text style={[styles.metricLabel, typography.body, { color: colors.textMuted }]}>
              {t.milestoneJourney.stage}
            </Text>
            <Text style={[styles.metricValue, typography.title, { color: colors.text }]}>
              {percent(activeProgress, 0)}
            </Text>
          </View>
          <View
            style={[
              styles.metricDivider,
              stackSummary && styles.metricDividerStacked,
              { backgroundColor: colors.surfaceBorder },
            ]}
          />
          <View style={[styles.metric, stackSummary && styles.metricStacked]}>
            <Text style={[styles.metricLabel, typography.body, { color: colors.textMuted }]}>
              {t.milestoneJourney.eta}
            </Text>
            <Text
              numberOfLines={2}
              style={[styles.metricValue, typography.title, { color: colors.text }]}
            >
              {monthLabel(activeItem.estimatedDate, t.milestoneJourney.pending, t.locale)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.timelineHeader}>
        <Text style={[styles.timelineLabel, typography.button, { color: colors.textMuted }]}>
          {t.milestoneJourney.journeyProgress}
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
            state === "reached"
              ? t.milestoneJourney.reached
              : state === "active"
                ? t.milestoneJourney.next
                : t.milestoneJourney.later;
          const itemGap = Math.max(0, item.targetAmount - currentAmount);

          return (
            <Animated.View
              key={item.id}
              entering={
                reducedMotion
                  ? undefined
                  : FadeInUp.duration(tokens.motion.enterMs)
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
                    backgroundColor: state === "active" ? `${colors.primary}10` : "transparent",
                    borderColor: state === "active" ? `${colors.primary}55` : "transparent",
                  },
                ]}
              >
                <View style={[styles.cardTop, stackCards && styles.cardTopStacked]}>
                  <View style={styles.cardCopy}>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.cardName,
                        typography.title,
                        { color: state === "future" ? colors.textMuted : colors.text },
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={[styles.cardMeta, typography.body, { color: colors.textMuted }]}
                    >
                      {t.milestoneJourney.targetEta(
                        money(item.targetAmount, currency),
                        monthLabel(item.estimatedDate, t.milestoneJourney.pending, t.locale),
                      )}
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
                  accessibilityLabel={`${item.name}. ${t.milestoneJourney.stage}: ${percent(
                    itemProgress,
                    0,
                  )}`}
                  color={markerColor}
                  progress={itemProgress}
                  trackColor={colors.surfaceBorder}
                />

                <View style={[styles.cardFooter, stackCards && styles.cardFooterStacked]}>
                  <Text style={[styles.cardProgress, typography.button, { color: markerColor }]}>
                    {percent(itemProgress, 0)}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.cardGap,
                      stackCards && styles.cardGapStacked,
                      typography.body,
                      { color: colors.textMuted },
                    ]}
                  >
                    {state === "reached"
                      ? t.milestoneJourney.completed
                      : t.milestoneJourney.left(money(itemGap, currency))}
                  </Text>
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
});

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
  metricRowStacked: {
    minHeight: 0,
    flexDirection: "column",
    gap: tokens.spacing.sm,
  },
  metricStacked: {
    minHeight: 44,
  },
  metricDivider: {
    width: 1,
    marginHorizontal: tokens.spacing.sm,
  },
  metricDividerStacked: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 0,
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
  timelineRailClip: {
    position: "absolute",
    left: 17,
    width: 2,
    overflow: "hidden",
    zIndex: 0,
  },
  timelineRailFill: {
    width: 2,
    height: "100%",
    borderRadius: tokens.radius.pill,
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
  cardTopStacked: {
    flexDirection: "column",
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
    alignSelf: "flex-start",
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
  cardFooterStacked: {
    alignItems: "flex-start",
    flexDirection: "column",
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
  cardGapStacked: {
    textAlign: "left",
  },
});
