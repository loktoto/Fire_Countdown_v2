import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useState, type ComponentProps } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppHeader } from "../components/AppHeader";
import { EditableRow } from "../components/EditableRow";
import { FireCompanionPickerSheet } from "../components/FireCompanionPickerSheet";
import { FireDestinationPickerSheet } from "../components/FireDestinationPickerSheet";
import {
  FirePlanEditorSheet,
  MilestoneEditorSheet,
  MilestoneListSheet,
  ScenarioEditorSheet,
  ScenarioListSheet,
} from "../components/FirePlanSettingsSheets";
import { GlassCard } from "../components/GlassCard";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenContainer } from "../components/ScreenContainer";
import { SegmentedControl } from "../components/SegmentedControl";
import { StatusBadge } from "../components/StatusBadge";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { FireSnapshot, Milestone, ProjectionScenario } from "../features/types";
import { useSettingsViewModel } from "../hooks/useSettingsViewModel";
import { useI18n } from "../i18n";
import { buildCsvExport, buildGoogleSheetsExport } from "../utils/exportData";
import { shareExportWithFallback } from "../utils/shareExport";
import { shortDateTime } from "../utils/format";

const currencyOptions = ["HKD", "USD", "TWD", "JPY", "EUR", "GBP", "CNY", "SGD"].map(
  (currency) => ({
    label: currency,
    value: currency,
  }),
);

const languageOptions: { label: string; value: FireSnapshot["language"] }[] = [
  { label: "English", value: "en" },
  { label: "繁體中文", value: "zhHant" },
];

function SettingsSectionHeading({
  icon,
  title,
  meta,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  title: string;
  meta?: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.sectionHeading}>
      <View style={[styles.sectionIcon, { backgroundColor: colors.primarySoft }]}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.sectionHeadingCopy}>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>{title}</Text>
        {meta ? (
          <Text style={[styles.sectionMeta, typography.body, { color: colors.textMuted }]}>
            {meta}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function languageLabel(language: FireSnapshot["language"]) {
  return language === "zhHant" ? "繁體中文" : "English";
}

type ExportFormat = "csv" | "sheets";

const exportFileConfig: Record<ExportFormat, { extension: string; mimeType: string; uti: string }> =
  {
    csv: {
      extension: "csv",
      mimeType: "text/csv",
      uti: "public.comma-separated-values-text",
    },
    sheets: {
      extension: "tsv",
      mimeType: "text/tab-separated-values",
      uti: "public.tab-separated-values-text",
    },
  };

function PreferenceOptionSheet({
  visible,
  kicker,
  title,
  options,
  value,
  onClose,
  onSelect,
}: {
  visible: boolean;
  kicker: string;
  title: string;
  options: { label: string; value: string }[];
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel={t.settings.closePicker}
        style={styles.optionBackdrop}
        onPress={onClose}
      />
      <View pointerEvents="box-none" style={styles.optionSheetWrap}>
        <View
          accessibilityViewIsModal
          style={[
            styles.optionSheet,
            {
              backgroundColor: colors.surfaceSolid,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <View style={styles.optionHeader}>
            <View style={styles.optionTitleColumn}>
              <Text style={[styles.optionKicker, typography.button, { color: colors.primary }]}>
                {kicker}
              </Text>
              <Text style={[styles.optionTitle, typography.display, { color: colors.text }]}>
                {title}
              </Text>
            </View>
            <MotionPressable
              onPress={onClose}
              accessibilityLabel={t.settings.closePickerTitle(title)}
              style={[styles.optionClose, { backgroundColor: colors.backgroundAlt }]}
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
            </MotionPressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.optionList}
            showsVerticalScrollIndicator={false}
          >
            {options.map((option) => {
              const selected = option.value === value;

              return (
                <MotionPressable
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  accessibilityLabel={t.settings.selectOption(option.label)}
                  accessibilityState={{ selected }}
                  style={[
                    styles.optionRow,
                    {
                      backgroundColor: selected ? `${colors.primary}14` : colors.backgroundAlt,
                      borderColor: selected ? colors.primary : colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text style={[styles.optionLabel, typography.title, { color: colors.text }]}>
                    {option.label}
                  </Text>
                  {selected ? (
                    <MaterialCommunityIcons name="check" size={22} color={colors.primary} />
                  ) : null}
                </MotionPressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function SettingsScreen() {
  const colors = useThemeColors();
  const t = useI18n();
  const router = useRouter();
  const vm = useSettingsViewModel();
  const [milestoneListOpen, setMilestoneListOpen] = useState(false);
  const [scenarioListOpen, setScenarioListOpen] = useState(false);
  const [firePlanEditorOpen, setFirePlanEditorOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [creatingMilestone, setCreatingMilestone] = useState(false);
  const [editingScenario, setEditingScenario] = useState<ProjectionScenario | null>(null);
  const [creatingScenario, setCreatingScenario] = useState(false);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [companionPickerOpen, setCompanionPickerOpen] = useState(false);
  const [destinationPickerOpen, setDestinationPickerOpen] = useState(false);
  const [exportPickerOpen, setExportPickerOpen] = useState(false);
  const goalCurrency = vm.goal?.baseCurrency ?? vm.snapshot.currency;
  const scenarioCount = vm.scenarios.length;
  const companionId = vm.snapshot.fireCompanionId ?? "traveler_m";
  const destinationId = vm.snapshot.fireDestinationId ?? "camp";
  const currentAgeLabel =
    vm.goal?.currentAge == null ? t.common.notSet : t.common.yearsOld(vm.goal.currentAge);
  const quoteProvider = vm.snapshot.quoteSettings.provider;
  const quoteLastUpdated = shortDateTime(vm.lastRefreshAt, t.locale);
  const quoteCanRefresh =
    vm.snapshot.quoteSettings.enabled && vm.quoteUrlValid && vm.quoteAssetCount > 0;
  const refreshFailed = vm.refreshQuotes.error instanceof Error;
  const credentialFailed = vm.saveToken.error instanceof Error;
  const exportOptions: { label: string; value: ExportFormat }[] = [
    { label: t.settings.csvFile, value: "csv" },
    { label: t.settings.googleSheetsFile, value: "sheets" },
  ];

  function addMilestone() {
    const milestone = vm.newMilestoneDraft();
    if (milestone) {
      setMilestoneListOpen(false);
      setCreatingMilestone(true);
      setEditingMilestone(milestone);
    }
  }

  function editMilestone(milestone: Milestone) {
    setMilestoneListOpen(false);
    setCreatingMilestone(false);
    setEditingMilestone(milestone);
  }

  function addScenario() {
    const scenario = vm.newScenarioDraft();
    setScenarioListOpen(false);
    setCreatingScenario(true);
    setEditingScenario(scenario);
  }

  function editScenario(scenario: ProjectionScenario) {
    setScenarioListOpen(false);
    setCreatingScenario(false);
    setEditingScenario(scenario);
  }

  function closeScenarioEditor() {
    setEditingScenario(null);
    setCreatingScenario(false);
  }

  function closeMilestoneEditor() {
    setEditingMilestone(null);
    setCreatingMilestone(false);
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

  function archiveMilestone(milestoneId: string) {
    vm.archiveMilestone(milestoneId);
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

  function archiveScenario(scenarioId: string) {
    vm.archiveScenario(scenarioId);
    closeScenarioEditor();
  }

  async function shareExport(format: ExportFormat) {
    setExportPickerOpen(false);
    const config = exportFileConfig[format];
    const exportTitle = format === "csv" ? t.settings.csvExportTitle : t.settings.sheetsExportTitle;
    const message =
      format === "csv" ? buildCsvExport(vm.snapshot) : buildGoogleSheetsExport(vm.snapshot);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    try {
      const sharingAvailable = await Sharing.isAvailableAsync();
      const fileUri = `${FileSystem.cacheDirectory ?? ""}fire-countdown-${timestamp}.${config.extension}`;
      await shareExportWithFallback({
        cacheDirectory: FileSystem.cacheDirectory,
        fileUri,
        message,
        sharingAvailable,
        writeFile: async (uri, contents) => {
          await FileSystem.writeAsStringAsync(uri, contents, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        },
        shareFile: (uri) =>
          Sharing.shareAsync(uri, {
            dialogTitle: exportTitle,
            mimeType: config.mimeType,
            UTI: config.uti,
          }),
        shareText: (contents) => Share.share({ title: exportTitle, message: contents }),
      });
    } catch {
      Alert.alert(t.settings.exportFailedTitle, t.settings.exportFailedMessage);
    }
  }

  function confirmReset() {
    Alert.alert(t.settings.resetDemoData, t.settings.resetDemoDataWarning, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.settings.resetDemoData,
        style: "destructive",
        onPress: () => {
          vm.resetSeed();
          AccessibilityInfo.announceForAccessibility(t.settings.demoDataReset);
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <AppHeader
        eyebrow={t.settings.kicker}
        title={t.settings.title}
        subtitle={t.settings.subtitle}
        action={
          <MotionPressable onPress={() => router.back()} style={styles.doneButton}>
            <Text style={[typography.button, { color: colors.primary }]}>{t.settings.done}</Text>
          </MotionPressable>
        }
      />

      <GlassCard>
        <SettingsSectionHeading icon="palette-outline" title={t.settings.appearance} />
        <View style={styles.switchRow}>
          <Text style={[styles.rowText, typography.body, { color: colors.text }]}>
            {t.settings.darkMode}
          </Text>
          <Switch
            accessibilityLabel={t.settings.darkMode}
            value={vm.snapshot.themeMode === "dark"}
            onValueChange={(dark) => vm.setThemeMode(dark ? "dark" : "light")}
            trackColor={{ false: colors.surfaceBorder, true: colors.primary }}
            thumbColor={vm.snapshot.themeMode === "dark" ? tokens.color.obsidian : colors.text}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={[styles.rowText, typography.body, { color: colors.text }]}>
            {t.settings.hapticFeedback}
          </Text>
          <Switch
            accessibilityLabel={t.settings.hapticFeedback}
            value={vm.snapshot.hapticsEnabled}
            onValueChange={vm.setHapticsEnabled}
            trackColor={{ false: colors.surfaceBorder, true: colors.primary }}
            thumbColor={vm.snapshot.hapticsEnabled ? tokens.color.obsidian : colors.text}
          />
        </View>
        <EditableRow
          label={t.settings.fireCompanion}
          value={t.fireImpact.companionNames[companionId]}
          onPress={() => setCompanionPickerOpen(true)}
        />
        <EditableRow
          label={t.settings.fireDestination}
          value={t.fireImpact.destinationNames[destinationId]}
          onPress={() => setDestinationPickerOpen(true)}
        />
        <EditableRow
          label={t.settings.currency}
          value={vm.snapshot.currency}
          onPress={() => setCurrencyPickerOpen(true)}
        />
        <Text style={[styles.disclaimer, typography.body, { color: colors.textMuted }]}>
          {t.settings.currencyScope}
        </Text>
        <EditableRow
          label={t.settings.language}
          value={languageLabel(vm.snapshot.language)}
          onPress={() => setLanguagePickerOpen(true)}
        />
      </GlassCard>

      <GlassCard>
        <View style={styles.sectionHeader}>
          <SettingsSectionHeading icon="target" title={t.settings.fireSettings} />
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

      <GlassCard>
        <View style={styles.sectionHeader}>
          <SettingsSectionHeading
            icon="chart-line"
            title={t.settings.marketData}
            meta={t.settings.quoteAssets(vm.quoteAssetCount)}
          />
          <StatusBadge
            label={
              vm.snapshot.quoteSettings.enabled
                ? t.settings.enableLiveQuotes
                : t.portfolio.pricesDisabled
            }
            tone={vm.snapshot.quoteSettings.enabled ? "positive" : "neutral"}
          />
        </View>

        <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
          {t.settings.quoteProvider}
        </Text>
        <SegmentedControl
          value={quoteProvider}
          onChange={(provider) => {
            vm.updateQuoteSettings({ provider, enabled: provider === "free_market" });
            vm.setTokenDraft("");
            vm.saveToken.reset();
            vm.refreshQuotes.reset();
          }}
          options={[
            { label: t.settings.freeMarket, value: "free_market" },
            { label: t.settings.customBridge, value: "custom_bridge" },
          ]}
        />

        <Text style={[styles.providerHint, typography.body, { color: colors.textMuted }]}>
          {quoteProvider === "free_market"
            ? t.settings.freeMarketHint
            : t.settings.customBridgeHint}
        </Text>

        {quoteProvider === "free_market" ? (
          <StatusBadge label={t.settings.noApiKeyRequired} tone="positive" />
        ) : null}

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <Text style={[styles.rowText, typography.bodyMedium, { color: colors.text }]}>
              {t.settings.enableLiveQuotes}
            </Text>
            <Text style={[styles.switchMeta, typography.body, { color: colors.textMuted }]}>
              {quoteLastUpdated
                ? t.settings.lastUpdated(quoteLastUpdated)
                : t.settings.neverUpdated}
            </Text>
          </View>
          <Switch
            accessibilityLabel={t.settings.enableLiveQuotes}
            value={vm.snapshot.quoteSettings.enabled}
            onValueChange={(enabled) => vm.updateQuoteSettings({ enabled })}
            trackColor={{ false: colors.surfaceBorder, true: colors.primary }}
            thumbColor={colors.mode === "dark" ? tokens.color.obsidian : colors.surface}
          />
        </View>

        <View style={styles.cadenceHeader}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            {t.settings.refreshCadence}
          </Text>
          <View style={styles.cadenceOptions}>
            {[
              { label: t.settings.every15Minutes, value: 15 },
              { label: t.settings.everyHour, value: 60 },
              { label: t.settings.everyDay, value: 1440 },
            ].map((option) => {
              const selected = vm.snapshot.quoteSettings.refreshIntervalMinutes === option.value;
              return (
                <MotionPressable
                  key={option.value}
                  onPress={() => vm.updateQuoteSettings({ refreshIntervalMinutes: option.value })}
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected }}
                  style={[
                    styles.cadenceOption,
                    {
                      backgroundColor: selected ? colors.primarySoft : colors.surfaceElevated,
                      borderColor: selected ? `${colors.primary}66` : colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cadenceText,
                      typography.button,
                      { color: selected ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {option.label}
                  </Text>
                </MotionPressable>
              );
            })}
          </View>
        </View>

        {quoteProvider === "custom_bridge" ? (
          <>
            <TextInput
              placeholder={t.settings.googleAppsScriptUrl}
              placeholderTextColor={colors.textMuted}
              value={vm.snapshot.quoteSettings.scriptUrl ?? ""}
              onChangeText={(scriptUrl) => vm.updateQuoteSettings({ scriptUrl })}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              accessibilityLabel={t.settings.googleAppsScriptUrl}
              style={[
                styles.input,
                typography.body,
                {
                  color: colors.text,
                  borderColor: colors.surfaceBorder,
                  backgroundColor: colors.surfaceElevated,
                },
              ]}
            />
            <TextInput
              placeholder={t.settings.apiToken}
              placeholderTextColor={colors.textMuted}
              value={vm.tokenDraft}
              onChangeText={vm.setTokenDraft}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel={t.settings.apiToken}
              style={[
                styles.input,
                typography.body,
                {
                  color: colors.text,
                  borderColor: colors.surfaceBorder,
                  backgroundColor: colors.surfaceElevated,
                },
              ]}
            />
          </>
        ) : null}

        <View style={styles.buttonRow}>
          {quoteProvider === "custom_bridge" ? (
            <MotionPressable
              onPress={() => vm.saveToken.mutate()}
              disabled={!vm.tokenDraft.trim() || vm.saveToken.isPending}
              accessibilityLabel={t.settings.saveCredential}
              style={[
                styles.button,
                {
                  backgroundColor: vm.tokenDraft.trim()
                    ? colors.primarySoft
                    : colors.surfaceElevated,
                  borderColor: vm.tokenDraft.trim() ? colors.primary : colors.surfaceBorder,
                },
              ]}
            >
              {vm.saveToken.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={[typography.button, { color: colors.primary }]}>
                  {t.settings.saveCredential}
                </Text>
              )}
            </MotionPressable>
          ) : null}
          <MotionPressable
            onPress={() => vm.refreshQuotes.mutate()}
            disabled={!quoteCanRefresh || vm.refreshQuotes.isPending}
            accessibilityLabel={t.settings.refreshNow}
            style={[
              styles.button,
              {
                backgroundColor: quoteCanRefresh ? colors.primaryFill : colors.surfaceElevated,
                borderColor: quoteCanRefresh ? colors.primary : colors.surfaceBorder,
              },
            ]}
          >
            {vm.refreshQuotes.isPending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text
                style={[
                  typography.button,
                  { color: quoteCanRefresh ? colors.onPrimary : colors.textMuted },
                ]}
              >
                {t.settings.refreshNow}
              </Text>
            )}
          </MotionPressable>
        </View>

        {refreshFailed ? (
          <View accessible accessibilityLiveRegion="polite">
            <StatusBadge label={t.settings.quoteRefreshFailed} tone="negative" />
          </View>
        ) : null}
        {vm.refreshQuotes.isSuccess ? (
          <View accessible accessibilityLiveRegion="polite">
            <StatusBadge label={t.settings.quoteCacheUpdated} tone="positive" />
          </View>
        ) : null}
        {quoteProvider === "custom_bridge" && vm.saveToken.isSuccess ? (
          <View accessible accessibilityLiveRegion="polite">
            <StatusBadge label={t.settings.credentialSaved} tone="positive" />
          </View>
        ) : null}
        {quoteProvider === "custom_bridge" &&
        !vm.quoteUrlValid &&
        vm.snapshot.quoteSettings.scriptUrl?.trim() ? (
          <StatusBadge label={t.settings.quoteHttpsRequired} tone="negative" />
        ) : null}
        {quoteProvider === "custom_bridge" && credentialFailed ? (
          <StatusBadge label={t.settings.tokenSaveFailed} tone="negative" />
        ) : null}
      </GlassCard>

      <GlassCard>
        <SettingsSectionHeading icon="database-cog-outline" title={t.settings.maintenance} />
        <EditableRow
          label={t.settings.exportData}
          value={t.settings.exportValue}
          onPress={() => setExportPickerOpen(true)}
        />
        <EditableRow
          label={t.settings.resetDemoData}
          value={t.settings.restoreSeed}
          onPress={confirmReset}
        />
        <Text style={[styles.disclaimer, typography.body, { color: colors.textMuted }]}>
          {t.settings.marketDataPrivacy}
        </Text>
      </GlassCard>
      <MilestoneListSheet
        visible={milestoneListOpen}
        milestones={vm.milestones}
        currency={goalCurrency}
        onClose={() => setMilestoneListOpen(false)}
        onAdd={addMilestone}
        onEdit={editMilestone}
      />
      <ScenarioListSheet
        visible={scenarioListOpen}
        goal={vm.goal ?? null}
        scenarios={vm.scenarios}
        currency={goalCurrency}
        baseExpectedReturn={vm.weightedReturn}
        onClose={() => setScenarioListOpen(false)}
        onAdd={addScenario}
        onEdit={editScenario}
      />
      <FirePlanEditorSheet
        visible={firePlanEditorOpen}
        goal={vm.goal ?? null}
        onClose={() => setFirePlanEditorOpen(false)}
        onSave={vm.updateGoal}
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
        goal={vm.goal ?? null}
        scenario={editingScenario}
        baseExpectedReturn={vm.weightedReturn}
        onClose={closeScenarioEditor}
        onSave={saveScenario}
        onArchive={creatingScenario || scenarioCount <= 1 ? undefined : archiveScenario}
      />
      <PreferenceOptionSheet
        visible={currencyPickerOpen}
        kicker={t.settings.currency}
        title={t.settings.displayCurrency}
        options={currencyOptions}
        value={vm.snapshot.currency}
        onClose={() => setCurrencyPickerOpen(false)}
        onSelect={(currency) => {
          vm.setCurrency(currency);
          setCurrencyPickerOpen(false);
        }}
      />
      <FireCompanionPickerSheet
        visible={companionPickerOpen}
        value={companionId}
        onSelect={vm.setFireCompanion}
        onClose={() => setCompanionPickerOpen(false)}
      />
      <FireDestinationPickerSheet
        visible={destinationPickerOpen}
        value={destinationId}
        onSelect={vm.setFireDestination}
        onClose={() => setDestinationPickerOpen(false)}
      />
      <PreferenceOptionSheet
        visible={languagePickerOpen}
        kicker={t.settings.language}
        title={t.settings.appLanguage}
        options={languageOptions}
        value={vm.snapshot.language}
        onClose={() => setLanguagePickerOpen(false)}
        onSelect={(language) => {
          vm.setLanguage(language as FireSnapshot["language"]);
          setLanguagePickerOpen(false);
        }}
      />
      <PreferenceOptionSheet
        visible={exportPickerOpen}
        kicker={t.settings.export}
        title={t.settings.exportData}
        options={exportOptions}
        value=""
        onClose={() => setExportPickerOpen(false)}
        onSelect={(format) => {
          void shareExport(format as ExportFormat);
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  doneButton: {
    minHeight: 44,
    paddingHorizontal: tokens.spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  sectionHeading: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeadingCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  sectionMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  fieldLabel: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  providerHint: {
    fontSize: 13,
    lineHeight: 19,
  },
  headerAction: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: tokens.spacing.xs,
  },
  switchRow: {
    minHeight: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  switchCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  switchMeta: {
    fontSize: 12,
    lineHeight: 17,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 21,
  },
  cadenceHeader: {
    gap: tokens.spacing.sm,
  },
  cadenceOptions: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
  },
  cadenceOption: {
    flex: 1,
    minHeight: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.spacing.sm,
  },
  cadenceText: {
    fontSize: 12,
    lineHeight: 16,
  },
  inlineLink: {
    minHeight: 44,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 2,
  },
  inlineLinkText: {
    fontSize: 13,
    lineHeight: 18,
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
  input: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 10,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: tokens.spacing.sm,
    columnGap: tokens.spacing.sm,
  },
  button: {
    flex: 1,
    minWidth: 140,
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimer: {
    fontSize: 13,
    lineHeight: 19,
  },
  optionBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.42)",
    zIndex: 0,
  },
  optionSheetWrap: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
    zIndex: 1,
  },
  optionSheet: {
    maxHeight: "78%",
    borderWidth: 1,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.md,
    gap: tokens.spacing.md,
  },
  optionHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  optionTitleColumn: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  optionKicker: {
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  optionTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  optionClose: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  optionList: {
    gap: tokens.spacing.sm,
    paddingBottom: 2,
  },
  optionRow: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  optionLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    lineHeight: 22,
  },
});
