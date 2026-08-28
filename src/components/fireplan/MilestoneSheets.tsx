import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";

import {
  BaseSheet,
  Field,
  normalizeDateInput,
  normalizeNumberInput,
  numberFromText,
  percentText,
  ResponsiveSplitFields,
  SaveButton,
  SheetHeader,
  TonalAddButton,
  ToggleRow,
  type MilestonePatch,
} from "./firePlanSheetKit";
import { styles } from "./sharedStyles";
import { MotionPressable } from "../MotionPressable";
import { fieldLabelWithUnit } from "../firePlanPresentation";
import { typography, useThemeColors } from "../../design/theme";
import type { Milestone } from "../../features/types";
import { useI18n } from "../../i18n";
import { money } from "../../utils/format";

export function MilestoneEditorSheet({
  visible,
  milestone,
  currency,
  onClose,
  onSave,
  onArchive,
}: {
  visible: boolean;
  milestone: Milestone | null;
  currency: string;
  onClose: () => void;
  onSave: (milestoneId: string, patch: MilestonePatch) => boolean;
  onArchive?: (milestoneId: string) => boolean;
}) {
  if (!visible || !milestone) {
    return null;
  }

  return (
    <BaseSheet visible={visible} onClose={onClose}>
      <MilestoneEditorContent
        key={milestone.id}
        milestone={milestone}
        currency={currency}
        onClose={onClose}
        onSave={onSave}
        onArchive={onArchive}
      />
    </BaseSheet>
  );
}

export function MilestoneListSheet({
  visible,
  milestones,
  currency,
  onClose,
  onAdd,
  onEdit,
}: {
  visible: boolean;
  milestones: Milestone[];
  currency: string;
  onClose: () => void;
  onAdd: () => void;
  onEdit: (milestone: Milestone) => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();

  if (!visible) {
    return null;
  }

  return (
    <BaseSheet visible={visible} onClose={onClose}>
      <SheetHeader
        kicker={t.firePlan.milestones}
        title={t.firePlan.milestoneSettings}
        closeLabel={t.firePlan.closeMilestoneSettings}
        onClose={onClose}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <TonalAddButton label={t.firePlan.addMilestone} onPress={onAdd} />
        {milestones.length > 0 ? (
          milestones.map((milestone, index) => {
            const state = milestone.isHidden
              ? t.firePlan.hidden
              : milestone.isActive
                ? t.firePlan.active
                : t.firePlan.paused;
            return (
              <MotionPressable
                key={milestone.id}
                onPress={() => onEdit(milestone)}
                accessibilityLabel={`${t.firePlan.editMilestone} ${milestone.name}`}
                style={styles.listRow}
              >
                <View style={styles.listCopy}>
                  <Text
                    numberOfLines={1}
                    style={[styles.listLabel, typography.body, { color: colors.textMuted }]}
                  >
                    {t.firePlan.milestoneRow(index + 1, state)}
                  </Text>
                  <Text
                    numberOfLines={2}
                    minimumFontScale={0.86}
                    adjustsFontSizeToFit
                    style={[styles.listValue, typography.title, { color: colors.text }]}
                  >
                    {milestone.name} · {money(milestone.targetAmount, currency)}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
              </MotionPressable>
            );
          })
        ) : (
          <Text style={[styles.emptyText, typography.body, { color: colors.textMuted }]}>
            {t.firePlan.noMilestonesYet}
          </Text>
        )}
      </ScrollView>
    </BaseSheet>
  );
}

function MilestoneEditorContent({
  milestone,
  currency,
  onClose,
  onSave,
  onArchive,
}: {
  milestone: Milestone;
  currency: string;
  onClose: () => void;
  onSave: (milestoneId: string, patch: MilestonePatch) => boolean;
  onArchive?: (milestoneId: string) => boolean;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const [name, setName] = useState(milestone.name);
  const [targetAmount, setTargetAmount] = useState(String(milestone.targetAmount));
  const [targetDate, setTargetDate] = useState(milestone.targetDate ?? "");
  const [expectedReturnOverride, setExpectedReturnOverride] = useState(
    percentText(milestone.expectedReturnOverride),
  );
  const [isActive, setIsActive] = useState(milestone.isActive);
  const [showOnPath, setShowOnPath] = useState(!milestone.isHidden);
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  const canSave = name.trim().length > 0 && numberFromText(targetAmount) > 0;

  function save() {
    if (!canSave) {
      return;
    }

    const persisted = onSave(milestone.id, {
      name: name.trim(),
      targetAmount: numberFromText(targetAmount),
      targetDate: targetDate.trim().length > 0 ? targetDate.trim() : null,
      expectedReturnOverride:
        expectedReturnOverride.trim().length > 0
          ? numberFromText(expectedReturnOverride) / 100
          : null,
      isActive,
      isHidden: !showOnPath,
    });
    if (persisted) {
      onClose();
    }
  }

  function archive() {
    if (!onArchive) {
      return;
    }

    if (!confirmingArchive) {
      setConfirmingArchive(true);
      return;
    }

    if (onArchive(milestone.id)) {
      onClose();
    }
  }

  return (
    <>
      <SheetHeader
        kicker={t.firePlan.milestones}
        title={t.firePlan.editMilestone}
        closeLabel={t.firePlan.closeMilestoneEditor}
        onClose={onClose}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Field
          label={t.firePlan.milestoneName}
          value={name}
          onChangeText={setName}
          placeholder={t.firePlan.coastFire}
          accessibilityLabel={t.firePlan.milestoneName}
        />
        <Field
          label={fieldLabelWithUnit(t.firePlan.targetAmount, currency)}
          value={targetAmount}
          onChangeText={(value) => setTargetAmount(normalizeNumberInput(value))}
          keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
          inputMode="decimal"
          placeholder="450000"
          accessibilityLabel={fieldLabelWithUnit(t.firePlan.targetAmount, currency)}
        />
        <ResponsiveSplitFields>
          <View style={styles.splitField}>
            <Field
              label={t.firePlan.targetDate}
              value={targetDate}
              onChangeText={(value) => setTargetDate(normalizeDateInput(value))}
              placeholder="YYYY-MM-DD"
              accessibilityLabel={t.firePlan.targetDate}
            />
          </View>
          <View style={styles.splitField}>
            <Field
              label={t.firePlan.returnOverride}
              value={expectedReturnOverride}
              onChangeText={(value) => setExpectedReturnOverride(normalizeNumberInput(value, true))}
              keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
              inputMode="decimal"
              placeholder="-"
              accessibilityLabel={t.firePlan.returnOverride}
            />
          </View>
        </ResponsiveSplitFields>
        <ToggleRow
          label={t.firePlan.activeMilestone}
          value={isActive}
          onPress={() => setIsActive((current) => !current)}
        />
        <ToggleRow
          label={t.firePlan.showOnFirePath}
          value={showOnPath}
          onPress={() => setShowOnPath((current) => !current)}
        />
        <SaveButton label={t.firePlan.saveMilestone} disabled={!canSave} onPress={save} />
        {onArchive ? (
          <MotionPressable
            onPress={archive}
            accessibilityLabel={
              confirmingArchive ? t.firePlan.confirmDeleteMilestone : t.firePlan.deleteMilestone
            }
            style={[
              styles.archive,
              {
                borderColor: confirmingArchive ? colors.negative : colors.surfaceBorder,
                backgroundColor: confirmingArchive ? `${colors.negative}18` : colors.backgroundAlt,
              },
            ]}
          >
            <Text
              style={[
                styles.archiveText,
                typography.button,
                { color: confirmingArchive ? colors.negative : colors.textMuted },
              ]}
            >
              {confirmingArchive ? t.common.confirmDelete : t.firePlan.deleteMilestone}
            </Text>
          </MotionPressable>
        ) : null}
      </ScrollView>
    </>
  );
}
