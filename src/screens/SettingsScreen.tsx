import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import {
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

import { EditableRow } from "../components/EditableRow";
import {
  MilestoneEditorSheet,
  MilestoneListSheet,
  ScenarioEditorSheet,
  ScenarioListSheet,
} from "../components/FirePlanSettingsSheets";
import { GlassCard } from "../components/GlassCard";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenContainer } from "../components/ScreenContainer";
import { StatusBadge } from "../components/StatusBadge";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { FireSnapshot, Milestone, ProjectionScenario } from "../features/types";
import { useSettingsViewModel } from "../hooks/useSettingsViewModel";
import { buildCsvExport, buildGoogleSheetsExport } from "../utils/exportData";

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

function languageLabel(language: FireSnapshot["language"]) {
  return language === "zhHant" ? "\u7e41\u9ad4\u4e2d\u6587" : "English";
}

type ExportFormat = "csv" | "sheets";

const exportOptions: { label: string; value: ExportFormat }[] = [
  { label: "CSV file", value: "csv" },
  { label: "Google Sheets file", value: "sheets" },
];

const exportFileConfig: Record<
  ExportFormat,
  { extension: string; mimeType: string; title: string; uti: string }
> = {
  csv: {
    extension: "csv",
    mimeType: "text/csv",
    title: "Fire Countdown CSV export",
    uti: "public.comma-separated-values-text",
  },
  sheets: {
    extension: "tsv",
    mimeType: "text/tab-separated-values",
    title: "Fire Countdown Google Sheets export",
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityLabel="Close setting picker"
        style={styles.optionBackdrop}
        onPress={onClose}
      />
      <View pointerEvents="box-none" style={styles.optionSheetWrap}>
        <View
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
              accessibilityLabel={`Close ${title}`}
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
                  accessibilityLabel={`Select ${option.label}`}
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
  const router = useRouter();
  const vm = useSettingsViewModel();
  const [milestoneListOpen, setMilestoneListOpen] = useState(false);
  const [scenarioListOpen, setScenarioListOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [creatingMilestone, setCreatingMilestone] = useState(false);
  const [editingScenario, setEditingScenario] = useState<ProjectionScenario | null>(null);
  const [creatingScenario, setCreatingScenario] = useState(false);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);
  const [exportPickerOpen, setExportPickerOpen] = useState(false);
  const goalCurrency = vm.goal?.baseCurrency ?? vm.snapshot.currency;
  const scenarioCount = vm.scenarios.length;

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
    const message =
      format === "csv" ? buildCsvExport(vm.snapshot) : buildGoogleSheetsExport(vm.snapshot);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    try {
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable && FileSystem.cacheDirectory) {
        const fileUri = `${FileSystem.cacheDirectory}fire-countdown-${timestamp}.${config.extension}`;
        await FileSystem.writeAsStringAsync(fileUri, message, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(fileUri, {
          dialogTitle: config.title,
          mimeType: config.mimeType,
          UTI: config.uti,
        });
        return;
      }

      await Share.share({ title: config.title, message });
    } catch {
      // Native share can be dismissed or unavailable; keep the Settings flow stable.
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, typography.button, { color: colors.primary }]}>
            Preferences
          </Text>
          <Text style={[styles.title, typography.display, { color: colors.text }]}>Settings</Text>
        </View>
        <MotionPressable onPress={() => router.back()}>
          <Text style={[typography.button, { color: colors.primary }]}>Done</Text>
        </MotionPressable>
      </View>

      <GlassCard>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          Appearance
        </Text>
        <View style={styles.switchRow}>
          <Text style={[styles.rowText, typography.body, { color: colors.text }]}>Dark mode</Text>
          <Switch
            value={vm.snapshot.themeMode === "dark"}
            onValueChange={(dark) => vm.setThemeMode(dark ? "dark" : "light")}
            trackColor={{ false: colors.surfaceBorder, true: colors.primary }}
            thumbColor={vm.snapshot.themeMode === "dark" ? tokens.color.obsidian : colors.text}
          />
        </View>
        <EditableRow
          label="Currency"
          value={vm.snapshot.currency}
          onPress={() => setCurrencyPickerOpen(true)}
        />
        <EditableRow
          label="Language"
          value={languageLabel(vm.snapshot.language)}
          onPress={() => setLanguagePickerOpen(true)}
        />
      </GlassCard>

      <GlassCard>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          FIRE Settings
        </Text>
        <View style={styles.quickActions}>
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

      <GlassCard>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          Quote Bridge
        </Text>
        <TextInput
          placeholder="Google Apps Script URL"
          placeholderTextColor={colors.textMuted}
          value={vm.snapshot.quoteSettings.scriptUrl ?? ""}
          onChangeText={(scriptUrl) => vm.updateQuoteSettings({ scriptUrl })}
          style={[
            styles.input,
            typography.body,
            {
              color: colors.text,
              borderColor: colors.surfaceBorder,
              backgroundColor: colors.surfaceSolid,
            },
          ]}
        />
        <TextInput
          placeholder="API token stored in SecureStore"
          placeholderTextColor={colors.textMuted}
          value={vm.tokenDraft}
          onChangeText={vm.setTokenDraft}
          secureTextEntry
          style={[
            styles.input,
            typography.body,
            {
              color: colors.text,
              borderColor: colors.surfaceBorder,
              backgroundColor: colors.surfaceSolid,
            },
          ]}
        />
        <View style={styles.buttonRow}>
          <MotionPressable
            onPress={() => void vm.saveToken()}
            style={[styles.button, { borderColor: colors.primary }]}
          >
            <Text style={[typography.button, { color: colors.primary }]}>Save token</Text>
          </MotionPressable>
          <MotionPressable
            onPress={() => vm.refreshQuotes.mutate()}
            style={[styles.button, { borderColor: colors.primary }]}
          >
            <Text style={[typography.button, { color: colors.primary }]}>Test refresh</Text>
          </MotionPressable>
        </View>
        {vm.refreshQuotes.isError ? (
          <StatusBadge label="Quote refresh failed" tone="negative" />
        ) : null}
        {vm.refreshQuotes.isSuccess ? (
          <StatusBadge label="Quote cache updated" tone="positive" />
        ) : null}
      </GlassCard>

      <GlassCard>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          Maintenance
        </Text>
        <EditableRow
          label="Export data"
          value="CSV / Google Sheets"
          onPress={() => setExportPickerOpen(true)}
        />
        <EditableRow label="Backup / Restore" value="Coming next" />
        <EditableRow label="Reset demo data" value="Restore seed" onPress={vm.resetSeed} />
        <Text style={[styles.disclaimer, typography.body, { color: colors.textMuted }]}>
          Financial data stays local by default. Quote Bridge sends only user-enabled asset symbols
          to the user-owned Apps Script endpoint.
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
        onClose={() => setScenarioListOpen(false)}
        onAdd={addScenario}
        onEdit={editScenario}
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
        onClose={closeScenarioEditor}
        onSave={saveScenario}
        onArchive={creatingScenario || scenarioCount <= 1 ? undefined : archiveScenario}
      />
      <PreferenceOptionSheet
        visible={currencyPickerOpen}
        kicker="Currency"
        title="Display currency"
        options={currencyOptions}
        value={vm.snapshot.currency}
        onClose={() => setCurrencyPickerOpen(false)}
        onSelect={(currency) => {
          vm.setCurrency(currency);
          setCurrencyPickerOpen(false);
        }}
      />
      <PreferenceOptionSheet
        visible={languagePickerOpen}
        kicker="Language"
        title="App language"
        options={languageOptions.map((option) =>
          option.value === "zhHant" ? { ...option, label: "\u7e41\u9ad4\u4e2d\u6587" } : option,
        )}
        value={vm.snapshot.language}
        onClose={() => setLanguagePickerOpen(false)}
        onSelect={(language) => {
          vm.setLanguage(language as FireSnapshot["language"]);
          setLanguagePickerOpen(false);
        }}
      />
      <PreferenceOptionSheet
        visible={exportPickerOpen}
        kicker="Export"
        title="Export data"
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
    fontSize: 36,
    lineHeight: 42,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  switchRow: {
    minHeight: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    lineHeight: 21,
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
  input: {
    minHeight: 48,
    borderWidth: 1,
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
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
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
    elevation: 1,
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
