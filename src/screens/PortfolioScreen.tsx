import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AllocationBar } from "../components/AllocationBar";
import { AssetEditorSheet } from "../components/AssetEditorSheet";
import { EditableRow } from "../components/EditableRow";
import {
  FirePlanEditorSheet,
  MilestoneEditorSheet,
  MilestoneListSheet,
  ScenarioEditorSheet,
  ScenarioListSheet,
} from "../components/FirePlanSettingsSheets";
import { GlassCard } from "../components/GlassCard";
import { HeroMetric } from "../components/HeroMetric";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenContainer } from "../components/ScreenContainer";
import { StatusBadge } from "../components/StatusBadge";
import { resolveAssetValue } from "../engine/fireEngine";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { Asset, Milestone, ProjectionScenario } from "../features/types";
import { usePortfolioViewModel } from "../hooks/usePortfolioViewModel";
import { money, percent } from "../utils/format";

export function PortfolioScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const navigation = useNavigation() as unknown as {
    addListener: (event: "tabPress", callback: () => void) => () => void;
  };
  const vm = usePortfolioViewModel();
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [milestoneListOpen, setMilestoneListOpen] = useState(false);
  const [scenarioListOpen, setScenarioListOpen] = useState(false);
  const [firePlanEditorOpen, setFirePlanEditorOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [creatingMilestone, setCreatingMilestone] = useState(false);
  const [editingScenario, setEditingScenario] = useState<ProjectionScenario | null>(null);
  const [creatingScenario, setCreatingScenario] = useState(false);
  const [assetAmountsHidden, setAssetAmountsHidden] = useState(false);
  const [allocationMotionKey, setAllocationMotionKey] = useState(0);
  const assetVisibilityLabel = assetAmountsHidden ? "Show asset amounts" : "Hide asset amounts";
  const goalCurrency = vm.goal.baseCurrency;
  const totalAssetValue = assetAmountsHidden ? "***" : money(vm.totalAssets, goalCurrency);
  const includedAssetValue = assetAmountsHidden ? "***" : money(vm.includedAssets, goalCurrency);
  const currentAgeLabel =
    vm.goal.currentAge == null ? "Not set" : `${vm.goal.currentAge} years old`;

  const replayAllocationMotion = useCallback(() => {
    setAllocationMotionKey((current) => current + 1);
  }, []);

  useFocusEffect(
    useCallback(() => {
      replayAllocationMotion();
    }, [replayAllocationMotion]),
  );

  useEffect(
    () => navigation.addListener("tabPress", replayAllocationMotion),
    [navigation, replayAllocationMotion],
  );

  function privateMoney(value: number, currency?: string) {
    return assetAmountsHidden ? "***" : money(value, currency);
  }

  function toggleAssetAmounts() {
    setAssetAmountsHidden((current) => !current);
  }

  function openAssetEditor(asset: Asset) {
    setEditingAsset(asset);
  }

  function addMilestone() {
    const milestone = vm.newMilestoneDraft();
    if (milestone) {
      setMilestoneListOpen(false);
      setCreatingMilestone(true);
      setEditingMilestone(milestone);
    }
  }

  function openMilestone(milestone: Milestone) {
    setMilestoneListOpen(false);
    setCreatingMilestone(false);
    setEditingMilestone(milestone);
  }

  function closeMilestoneEditor() {
    setEditingMilestone(null);
    setCreatingMilestone(false);
  }

  function addScenario() {
    const scenario = vm.newScenarioDraft();
    setScenarioListOpen(false);
    setCreatingScenario(true);
    setEditingScenario(scenario);
  }

  function openScenario(scenario: ProjectionScenario) {
    setScenarioListOpen(false);
    setCreatingScenario(false);
    setEditingScenario(scenario);
  }

  function closeScenarioEditor() {
    setEditingScenario(null);
    setCreatingScenario(false);
  }

  function saveMilestone(milestoneId: string, patch: Partial<Milestone>) {
    if (creatingMilestone && editingMilestone) {
      const draft = { ...editingMilestone, ...patch };
      vm.createMilestone({
        archivedAt: draft.archivedAt ?? null,
        expectedReturnOverride: draft.expectedReturnOverride ?? null,
        goalId: draft.goalId,
        isActive: draft.isActive,
        isHidden: draft.isHidden,
        name: draft.name,
        order: draft.order,
        targetAmount: draft.targetAmount,
        targetDate: draft.targetDate ?? null,
      });
    } else {
      vm.updateMilestone(milestoneId, patch);
    }
    closeMilestoneEditor();
  }

  function saveScenario(scenarioId: string, patch: Partial<ProjectionScenario>) {
    if (creatingScenario && editingScenario) {
      const draft = { ...editingScenario, ...patch };
      vm.createScenario({
        archivedAt: draft.archivedAt ?? null,
        expectedReturnAdjustment: draft.expectedReturnAdjustment,
        inflationAdjustment: draft.inflationAdjustment,
        isDefault: draft.isDefault,
        monthlySavingAdjustment: draft.monthlySavingAdjustment,
        name: draft.name,
        targetSpendingAdjustment: draft.targetSpendingAdjustment,
        withdrawalRateAdjustment: draft.withdrawalRateAdjustment ?? 0,
      });
    } else {
      vm.updateScenario(scenarioId, patch);
    }
    closeScenarioEditor();
  }

  function archiveMilestone(milestoneId: string) {
    vm.archiveMilestone(milestoneId);
    closeMilestoneEditor();
  }

  function archiveScenario(scenarioId: string) {
    vm.archiveScenario(scenarioId);
    closeScenarioEditor();
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, typography.button, { color: colors.primary }]}>
            Asset book
          </Text>
          <Text style={[styles.title, typography.display, { color: colors.text }]}>Portfolio</Text>
        </View>
        <MotionPressable onPress={() => router.push("/settings")} style={styles.settingsButton}>
          <Text style={[typography.button, { color: colors.primary }]}>Settings</Text>
        </MotionPressable>
      </View>

      <MotionPressable
        onPress={toggleAssetAmounts}
        accessibilityLabel={assetVisibilityLabel}
        accessibilityState={{ selected: assetAmountsHidden }}
        hitSlop={8}
      >
        <HeroMetric
          label="Total assets"
          value={totalAssetValue}
          caption={`Included in FIRE ${includedAssetValue} | ${percent(vm.weightedReturn)} return`}
        />
      </MotionPressable>

      <MotionPressable
        onPress={replayAllocationMotion}
        accessibilityLabel="Replay allocation animation"
        style={styles.allocationButton}
      >
        <GlassCard>
          <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
            Allocation
          </Text>
          <AllocationBar motionKey={allocationMotionKey} segments={vm.allocation} />
        </GlassCard>
      </MotionPressable>

      <GlassCard>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
            Assets
          </Text>
          <MotionPressable onPress={vm.addManualAsset}>
            <Text style={[typography.button, { color: colors.primary }]}>Add</Text>
          </MotionPressable>
        </View>
        {vm.assets.map((asset) => {
          const resolved = resolveAssetValue(asset, vm.quoteCache, goalCurrency);
          return (
            <View
              key={asset.id}
              style={[styles.assetRow, { borderBottomColor: colors.surfaceBorder }]}
            >
              <MotionPressable
                onPress={() => openAssetEditor(asset)}
                accessibilityLabel={`Edit ${asset.name}`}
                style={styles.assetMain}
              >
                <Text style={[styles.assetName, typography.title, { color: colors.text }]}>
                  {asset.name}
                </Text>
                <Text style={[styles.assetMeta, typography.body, { color: colors.textMuted }]}>
                  {asset.assetClass} | {percent(asset.expectedAnnualReturn)} expected
                </Text>
                <StatusBadge
                  label={
                    resolved.source === "quote"
                      ? "Google Sheet quote"
                      : resolved.source === "manual_fallback"
                        ? "Manual fallback"
                        : "Manual value"
                  }
                  tone={resolved.source === "quote" ? "primary" : "neutral"}
                />
              </MotionPressable>
              <View style={styles.assetSide}>
                <MotionPressable
                  onPress={() => openAssetEditor(asset)}
                  accessibilityLabel={`Edit ${asset.name} value`}
                  hitSlop={8}
                  style={styles.assetValueButton}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[styles.assetValue, typography.title, { color: colors.text }]}
                  >
                    {privateMoney(resolved.value, resolved.currency)}
                  </Text>
                  <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.primary} />
                </MotionPressable>
                <MotionPressable
                  onPress={() => vm.updateAsset(asset.id, { includeInFire: !asset.includeInFire })}
                  accessibilityLabel={
                    asset.includeInFire
                      ? `Exclude ${asset.name} from FIRE`
                      : `Include ${asset.name} in FIRE`
                  }
                  accessibilityState={{ selected: asset.includeInFire }}
                >
                  <Text
                    style={[
                      typography.button,
                      { color: asset.includeInFire ? colors.positive : colors.textMuted },
                    ]}
                  >
                    {asset.includeInFire ? "Included" : "Excluded"}
                  </Text>
                </MotionPressable>
              </View>
            </View>
          );
        })}
      </GlassCard>

      <GlassCard>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
            FIRE Settings
          </Text>
        </View>
        <EditableRow
          label="Current age"
          value={currentAgeLabel}
          onPress={() => setFirePlanEditorOpen(true)}
        />
        <View style={styles.quickActions}>
          <MotionPressable
            onPress={() => setFirePlanEditorOpen(true)}
            accessibilityLabel="Edit FIRE setup"
            style={[
              styles.quickAction,
              {
                backgroundColor: colors.backgroundAlt,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <MaterialCommunityIcons name="target" size={18} color={colors.primary} />
            <Text style={[styles.quickActionText, typography.button, { color: colors.text }]}>
              FIRE setup
            </Text>
          </MotionPressable>
          <MotionPressable
            onPress={() => setScenarioListOpen(true)}
            accessibilityLabel="Edit FIRE methods"
            style={[
              styles.quickAction,
              {
                backgroundColor: `${colors.primary}14`,
                borderColor: colors.primary,
              },
            ]}
          >
            <MaterialCommunityIcons name="source-branch" size={18} color={colors.primary} />
            <Text style={[styles.quickActionText, typography.button, { color: colors.primary }]}>
              FIRE methods
            </Text>
          </MotionPressable>
          <MotionPressable
            onPress={() => setMilestoneListOpen(true)}
            accessibilityLabel="Edit milestones"
            style={[
              styles.quickAction,
              {
                backgroundColor: colors.backgroundAlt,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <MaterialCommunityIcons name="flag-checkered" size={18} color={colors.primary} />
            <Text style={[styles.quickActionText, typography.button, { color: colors.text }]}>
              Milestones
            </Text>
          </MotionPressable>
        </View>
      </GlassCard>
      <MilestoneListSheet
        visible={milestoneListOpen}
        milestones={vm.rawMilestones}
        currency={goalCurrency}
        onClose={() => setMilestoneListOpen(false)}
        onAdd={addMilestone}
        onEdit={openMilestone}
      />
      <ScenarioListSheet
        visible={scenarioListOpen}
        goal={vm.goal}
        scenarios={vm.scenarios}
        currency={goalCurrency}
        onClose={() => setScenarioListOpen(false)}
        onAdd={addScenario}
        onEdit={openScenario}
      />
      <FirePlanEditorSheet
        visible={firePlanEditorOpen}
        goal={vm.goal}
        onClose={() => setFirePlanEditorOpen(false)}
        onSave={vm.updateGoal}
      />
      <AssetEditorSheet
        visible={editingAsset !== null}
        asset={editingAsset}
        onClose={() => setEditingAsset(null)}
        onSave={vm.updateAsset}
      />
      <MilestoneEditorSheet
        visible={editingMilestone !== null}
        milestone={editingMilestone}
        onClose={closeMilestoneEditor}
        onSave={saveMilestone}
        onArchive={creatingMilestone ? undefined : archiveMilestone}
      />
      <ScenarioEditorSheet
        visible={editingScenario !== null}
        goal={vm.goal}
        scenario={editingScenario}
        onClose={closeScenarioEditor}
        onSave={saveScenario}
        onArchive={creatingScenario || vm.scenarios.length <= 1 ? undefined : archiveScenario}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  kicker: {
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 38,
    lineHeight: 44,
  },
  settingsButton: {
    minHeight: 42,
    justifyContent: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  allocationButton: {
    borderRadius: tokens.radius.card,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  quickActions: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
  },
  quickAction: {
    minHeight: 42,
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  quickActionText: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  assetRow: {
    minHeight: 96,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: tokens.spacing.md,
    paddingVertical: tokens.spacing.md,
  },
  assetMain: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  assetName: {
    fontSize: 18,
    lineHeight: 23,
  },
  assetMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  assetSide: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minWidth: 118,
    maxWidth: "45%",
    gap: tokens.spacing.sm,
  },
  assetValueButton: {
    minHeight: 32,
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  assetValue: {
    fontSize: 18,
    lineHeight: 23,
    flexShrink: 1,
  },
});
