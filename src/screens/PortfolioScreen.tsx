import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AllocationBar } from "../components/AllocationBar";
import { AppHeader } from "../components/AppHeader";
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
import { useI18n } from "../i18n";
import { money, percent, shortDateTime } from "../utils/format";

const assetClassIcons: Record<Asset["assetClass"], keyof typeof MaterialCommunityIcons.glyphMap> = {
  cash: "cash-multiple",
  etf: "chart-box-outline",
  stock: "chart-line",
  crypto: "currency-btc",
  bond: "file-certificate-outline",
  real_estate: "office-building-outline",
  pension: "shield-account-outline",
  private_investment: "briefcase-outline",
  business: "storefront-outline",
  custom: "shape-outline",
};

export function PortfolioScreen() {
  const colors = useThemeColors();
  const t = useI18n();
  const router = useRouter();
  const vm = usePortfolioViewModel();
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [creatingAsset, setCreatingAsset] = useState(false);
  const [milestoneListOpen, setMilestoneListOpen] = useState(false);
  const [scenarioListOpen, setScenarioListOpen] = useState(false);
  const [firePlanEditorOpen, setFirePlanEditorOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [creatingMilestone, setCreatingMilestone] = useState(false);
  const [editingScenario, setEditingScenario] = useState<ProjectionScenario | null>(null);
  const [creatingScenario, setCreatingScenario] = useState(false);
  const [assetAmountsHidden, setAssetAmountsHidden] = useState(false);
  const assetVisibilityLabel = assetAmountsHidden
    ? t.common.showAssetAmounts
    : t.common.hideAssetAmounts;
  const goalCurrency = vm.goal.baseCurrency;
  const totalAssetValue = assetAmountsHidden ? "***" : money(vm.totalAssets, goalCurrency);
  const includedAssetValue = assetAmountsHidden ? "***" : money(vm.includedAssets, goalCurrency);
  const currentAgeLabel =
    vm.goal.currentAge == null ? t.common.notSet : t.common.yearsOld(vm.goal.currentAge);
  const lastQuoteUpdate = shortDateTime(vm.lastRefreshAt, t.locale);
  const quoteError =
    vm.refreshQuotes.error instanceof Error ? vm.refreshQuotes.error.message : null;
  const refreshIfDue = vm.refreshIfDue;
  const quoteStatus = vm.refreshQuotes.isPending
    ? t.portfolio.pricesRefreshing
    : quoteError
      ? t.portfolio.pricesCached
      : !vm.quoteEnabled
        ? t.portfolio.pricesDisabled
        : lastQuoteUpdate
          ? t.portfolio.pricesUpdated(lastQuoteUpdate)
          : t.portfolio.pricesNeverUpdated;

  useFocusEffect(
    useCallback(() => {
      refreshIfDue();
    }, [refreshIfDue]),
  );

  function privateMoney(value: number, currency?: string) {
    return assetAmountsHidden ? "***" : money(value, currency);
  }

  function assetClassLabel(assetClass: Asset["assetClass"]) {
    switch (assetClass) {
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
    }
  }

  function assetClassColor(assetClass: Asset["assetClass"]) {
    switch (assetClass) {
      case "cash":
      case "business":
        return colors.positive;
      case "stock":
      case "bond":
      case "pension":
        return colors.projection;
      case "crypto":
      case "private_investment":
        return colors.target;
      case "real_estate":
      case "custom":
        return colors.textSubtle;
      case "etf":
      default:
        return colors.primary;
    }
  }

  function toggleAssetAmounts() {
    setAssetAmountsHidden((current) => !current);
  }

  function openAssetEditor(asset: Asset) {
    setCreatingAsset(false);
    setEditingAsset(asset);
  }

  function addAsset() {
    setCreatingAsset(true);
    setEditingAsset(vm.newAssetDraft());
  }

  function closeAssetEditor() {
    setEditingAsset(null);
    setCreatingAsset(false);
  }

  function saveAsset(assetId: string, patch: Partial<Asset>) {
    if (creatingAsset && editingAsset) {
      const draft = { ...editingAsset, ...patch };
      vm.createAsset({
        archivedAt: null,
        assetClass: draft.assetClass,
        currency: draft.currency,
        exchange: draft.exchange ?? null,
        expectedAnnualReturn: draft.expectedAnnualReturn,
        googleFinanceSymbol: draft.googleFinanceSymbol ?? null,
        includeInFire: draft.includeInFire,
        manualValue: draft.manualValue ?? 0,
        name: draft.name,
        notes: draft.notes ?? null,
        quantity: draft.quantity ?? null,
        ticker: draft.ticker ?? null,
        typeId: draft.typeId,
        updateMethod: draft.updateMethod,
      });
    } else {
      vm.updateAsset(assetId, patch);
    }
    closeAssetEditor();
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
      <AppHeader
        eyebrow={t.portfolio.kicker}
        title={t.portfolio.title}
        subtitle={t.portfolio.subtitle}
        action={
          <MotionPressable
            onPress={() => router.push("/settings")}
            accessibilityLabel={t.portfolio.settings}
            style={[
              styles.settingsButton,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder },
            ]}
          >
            <MaterialCommunityIcons name="cog-outline" size={22} color={colors.primary} />
          </MotionPressable>
        }
      />

      <View style={styles.heroBlock}>
        <HeroMetric
          label={t.portfolio.totalAssets}
          value={totalAssetValue}
          caption={t.portfolio.includedCaption(includedAssetValue, percent(vm.weightedReturn))}
        />
        <MotionPressable
          onPress={toggleAssetAmounts}
          accessibilityLabel={assetVisibilityLabel}
          accessibilityState={{ selected: assetAmountsHidden }}
          hitSlop={8}
          style={[
            styles.visibilityButton,
            { backgroundColor: colors.surfaceElevated, borderColor: colors.surfaceBorder },
          ]}
        >
          <MaterialCommunityIcons
            name={assetAmountsHidden ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={colors.primary}
          />
        </MotionPressable>
      </View>

      <View
        style={[
          styles.marketStrip,
          {
            backgroundColor: quoteError ? colors.warningSoft : colors.surface,
            borderColor: quoteError ? `${colors.warning}55` : colors.surfaceBorder,
          },
        ]}
      >
        <View
          style={[
            styles.marketIcon,
            { backgroundColor: quoteError ? `${colors.warning}22` : colors.surfaceElevated },
          ]}
        >
          <MaterialCommunityIcons
            name={quoteError ? "cloud-alert-outline" : "chart-line"}
            size={20}
            color={quoteError ? colors.warning : colors.primary}
          />
        </View>
        <View style={styles.marketCopy}>
          <Text style={[styles.marketTitle, typography.button, { color: colors.text }]}>
            {t.portfolio.marketPrices}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.marketStatus, typography.body, { color: colors.textMuted }]}
          >
            {quoteStatus}
          </Text>
        </View>
        <MotionPressable
          onPress={() => (vm.quoteEnabled ? vm.refreshQuotes.mutate() : router.push("/settings"))}
          disabled={vm.refreshQuotes.isPending}
          accessibilityLabel={t.portfolio.refreshPrices}
          style={[styles.marketRefresh, { borderColor: colors.surfaceBorder }]}
          haptic="selection"
        >
          {vm.refreshQuotes.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <MaterialCommunityIcons
              name={vm.quoteEnabled ? "refresh" : "arrow-right"}
              size={20}
              color={colors.primary}
            />
          )}
        </MotionPressable>
      </View>

      <View style={styles.allocationSection}>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          {t.portfolio.allocation}
        </Text>
        <View
          style={[
            styles.allocationStage,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <AllocationBar segments={vm.allocation} />
        </View>
      </View>

      <View style={styles.assetsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
            {t.portfolio.assets}
          </Text>
          <MotionPressable
            onPress={addAsset}
            accessibilityLabel={t.assets.addAsset}
            style={styles.headerAction}
          >
            <Text style={[typography.button, { color: colors.primary }]}>{t.common.add}</Text>
          </MotionPressable>
        </View>
        <View
          style={[
            styles.assetLedger,
            { borderColor: colors.surfaceBorder, backgroundColor: colors.surface },
          ]}
        >
          {vm.assets.map((asset) => {
            const resolved = resolveAssetValue(asset, vm.quoteCache, goalCurrency);
            const latestQuote = vm.quoteCache
              .filter((quote) => quote.assetId === asset.id)
              .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))[0];
            const quoteChange = latestQuote?.changePercent;
            const assetAccent = assetClassColor(asset.assetClass);
            return (
              <View
                key={asset.id}
                style={[styles.assetRow, { borderBottomColor: colors.surfaceBorder }]}
              >
                <MotionPressable
                  onPress={() => openAssetEditor(asset)}
                  accessibilityLabel={t.portfolio.editAsset(asset.name)}
                  style={styles.assetMain}
                >
                  <View style={[styles.assetGlyph, { backgroundColor: `${assetAccent}18` }]}>
                    <MaterialCommunityIcons
                      name={assetClassIcons[asset.assetClass]}
                      size={21}
                      color={assetAccent}
                    />
                  </View>
                  <View style={styles.assetCopy}>
                    <Text style={[styles.assetName, typography.title, { color: colors.text }]}>
                      {asset.name}
                    </Text>
                    <Text style={[styles.assetMeta, typography.body, { color: colors.textMuted }]}>
                      {assetClassLabel(asset.assetClass)} · {percent(asset.expectedAnnualReturn)}{" "}
                      {t.portfolio.expected}
                    </Text>
                    <View style={styles.assetStatusRow}>
                      <StatusBadge
                        label={
                          resolved.source === "quote"
                            ? latestQuote?.source === "FREE_MARKET" ||
                              latestQuote?.source === "COINBASE"
                              ? t.portfolio.freeQuote
                              : latestQuote?.source === "GOOGLEFINANCE"
                                ? t.portfolio.googleSheetQuote
                                : t.portfolio.liveQuote
                            : resolved.source === "manual_fallback"
                              ? t.portfolio.manualFallback
                              : t.portfolio.manualValue
                        }
                        tone={resolved.source === "quote" ? "primary" : "neutral"}
                      />
                      {resolved.source === "quote" && quoteChange != null ? (
                        <Text
                          style={[
                            styles.quoteChange,
                            typography.button,
                            { color: quoteChange >= 0 ? colors.positive : colors.negative },
                          ]}
                        >
                          {t.portfolio.priceChange(
                            `${quoteChange >= 0 ? "+" : ""}${percent(quoteChange)}`,
                          )}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </MotionPressable>
                <View style={styles.assetSide}>
                  <MotionPressable
                    onPress={() => openAssetEditor(asset)}
                    accessibilityLabel={t.portfolio.editAssetValue(asset.name)}
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
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={15}
                      color={colors.primary}
                    />
                  </MotionPressable>
                  <MotionPressable
                    onPress={() =>
                      vm.updateAsset(asset.id, { includeInFire: !asset.includeInFire })
                    }
                    accessibilityLabel={
                      asset.includeInFire
                        ? t.portfolio.excludeAsset(asset.name)
                        : t.portfolio.includeAsset(asset.name)
                    }
                    accessibilityRole="switch"
                    accessibilityState={{ checked: asset.includeInFire }}
                    style={[
                      styles.includeButton,
                      {
                        backgroundColor: asset.includeInFire
                          ? colors.positiveSoft
                          : colors.surfaceElevated,
                        borderColor: asset.includeInFire
                          ? `${colors.positive}55`
                          : colors.surfaceBorder,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={asset.includeInFire ? "check-circle-outline" : "minus-circle-outline"}
                      size={16}
                      color={asset.includeInFire ? colors.positive : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.includeText,
                        typography.button,
                        { color: asset.includeInFire ? colors.positive : colors.textMuted },
                      ]}
                    >
                      {asset.includeInFire ? t.common.included : t.common.excluded}
                    </Text>
                  </MotionPressable>
                </View>
              </View>
            );
          })}
          {vm.assets.length === 0 ? (
            <Text style={[styles.emptyAssets, typography.body, { color: colors.textMuted }]}>
              {t.portfolio.noAssets}
            </Text>
          ) : null}
        </View>
      </View>

      <GlassCard>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
            {t.portfolio.fireSettings}
          </Text>
          <MotionPressable
            onPress={() => setFirePlanEditorOpen(true)}
            haptic="selection"
            style={styles.headerAction}
          >
            <Text style={[typography.button, { color: colors.primary }]}>{t.common.edit}</Text>
          </MotionPressable>
        </View>
        <EditableRow
          label={t.common.currentAge}
          value={currentAgeLabel}
          onPress={() => setFirePlanEditorOpen(true)}
        />
        <View style={styles.quickActions}>
          <MotionPressable
            onPress={() => setScenarioListOpen(true)}
            accessibilityLabel={t.firePlan.editFireMethods}
            haptic="selection"
            style={[
              styles.quickAction,
              {
                backgroundColor: `${colors.primary}14`,
                borderColor: colors.primary,
              },
            ]}
          >
            <MaterialCommunityIcons name="source-branch" size={18} color={colors.primary} />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.quickActionText, typography.button, { color: colors.primary }]}
            >
              {t.firePlan.methodShortcut}
            </Text>
          </MotionPressable>
          <MotionPressable
            onPress={() => setMilestoneListOpen(true)}
            accessibilityLabel={t.firePlan.editMilestones}
            haptic="selection"
            style={[
              styles.quickAction,
              {
                backgroundColor: colors.backgroundAlt,
                borderColor: colors.surfaceBorder,
              },
            ]}
          >
            <MaterialCommunityIcons name="flag-checkered" size={18} color={colors.primary} />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.quickActionText, typography.button, { color: colors.text }]}
            >
              {t.firePlan.milestoneShortcut}
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
        baseExpectedReturn={vm.weightedReturn}
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
        isCreating={creatingAsset}
        onClose={closeAssetEditor}
        onSave={saveAsset}
        onArchive={creatingAsset ? undefined : vm.archiveAsset}
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
        baseExpectedReturn={vm.weightedReturn}
        onClose={closeScenarioEditor}
        onSave={saveScenario}
        onArchive={creatingScenario || vm.scenarios.length <= 1 ? undefined : archiveScenario}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroBlock: {
    position: "relative",
  },
  visibilityButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  marketStrip: {
    minHeight: 72,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.card,
    borderCurve: "continuous",
    padding: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  marketIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  marketCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  marketTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  marketStatus: {
    fontSize: 12,
    lineHeight: 17,
  },
  marketRefresh: {
    width: 44,
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAction: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: tokens.spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  allocationSection: {
    gap: tokens.spacing.md,
  },
  allocationStage: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.card,
    borderCurve: "continuous",
    padding: tokens.spacing.md,
  },
  assetsSection: {
    gap: tokens.spacing.md,
  },
  assetLedger: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.card,
    borderCurve: "continuous",
    paddingHorizontal: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  quickActions: {
    flexDirection: "row",
    gap: tokens.spacing.md,
  },
  quickAction: {
    minHeight: 46,
    flex: 1,
    minWidth: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  quickActionText: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    textAlign: "center",
  },
  assetRow: {
    minHeight: 112,
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
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.spacing.md,
  },
  assetGlyph: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  assetCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  assetStatusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  assetName: {
    fontSize: 18,
    lineHeight: 23,
  },
  assetMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  quoteChange: {
    fontSize: 12,
    lineHeight: 16,
  },
  assetSide: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minWidth: 112,
    maxWidth: "42%",
    gap: tokens.spacing.sm,
  },
  assetValueButton: {
    minHeight: 44,
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
    fontVariant: ["tabular-nums"],
  },
  includeButton: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  includeText: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyAssets: {
    paddingVertical: tokens.spacing.lg,
    textAlign: "center",
  },
});
