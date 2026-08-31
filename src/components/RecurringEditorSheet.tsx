import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Platform, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { CategoryGlyph } from "./CategoryGlyph";
import { FormBottomSheet } from "./FormBottomSheet";
import { LogDatePickerSheet } from "./LogDatePickerSheet";
import { MotionPressable } from "./MotionPressable";
import { SegmentedControl } from "./SegmentedControl";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type {
  Category,
  RecurrenceFrequency,
  RecurringTransaction,
  TransactionType,
} from "../features/types";
import { useI18n } from "../i18n";
import { formatDateInputLabel } from "../utils/format";

type RecurringPatch = Partial<Omit<RecurringTransaction, "id" | "createdAt" | "updatedAt">>;

function normalizeAmountInput(raw: string) {
  const decimalParts = raw
    .replace(",", ".")
    .replace(/[^\d.]/g, "")
    .split(".");
  const whole = decimalParts[0] ?? "";
  const decimals = decimalParts.slice(1).join("").slice(0, 2);
  const normalized = decimals.length > 0 ? `${whole}.${decimals}` : whole;
  return normalized.slice(0, 12);
}

export function RecurringEditorSheet({
  visible,
  schedule,
  categories,
  onClose,
  onSave,
  onArchive,
}: {
  visible: boolean;
  schedule: RecurringTransaction | null;
  categories: Category[];
  onClose: () => void;
  onSave: (id: string, patch: RecurringPatch) => boolean;
  onArchive: (id: string) => boolean;
}) {
  if (!visible || !schedule) {
    return null;
  }

  return (
    <RecurringEditorContent
      key={schedule.id}
      schedule={schedule}
      categories={categories}
      onClose={onClose}
      onSave={onSave}
      onArchive={onArchive}
    />
  );
}

function RecurringEditorContent({
  schedule,
  categories,
  onClose,
  onSave,
  onArchive,
}: {
  schedule: RecurringTransaction;
  categories: Category[];
  onClose: () => void;
  onSave: (id: string, patch: RecurringPatch) => boolean;
  onArchive: (id: string) => boolean;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const [type, setType] = useState<TransactionType>(schedule.type);
  const [amountText, setAmountText] = useState(String(schedule.amount));
  const [categoryId, setCategoryId] = useState(schedule.categoryId);
  const [note, setNote] = useState(schedule.note ?? "");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(schedule.frequency);
  const [startDate, setStartDate] = useState(schedule.startDate);
  const [isActive, setIsActive] = useState(schedule.isActive);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const amount = Number.parseFloat(amountText) || 0;
  const categoriesForType = categories.filter((category) => category.type === type);
  const activeCategoryId = categoriesForType.some((category) => category.id === categoryId)
    ? categoryId
    : (categoriesForType[0]?.id ?? "");
  const canSave = amount > 0 && activeCategoryId.length > 0;
  const recurrenceOptions: { label: string; value: RecurrenceFrequency }[] = [
    { label: t.recurring.weekly, value: "weekly" },
    { label: t.recurring.biweekly, value: "biweekly" },
    { label: t.recurring.monthly, value: "monthly" },
    { label: t.recurring.yearly, value: "yearly" },
  ];

  function save() {
    if (!canSave) {
      return;
    }
    const persisted = onSave(schedule.id, {
      type,
      amount,
      categoryId: activeCategoryId,
      note: note.trim() || null,
      frequency,
      startDate,
      isActive,
    });
    if (persisted) {
      onClose();
    }
  }

  function archive() {
    if (!confirmingArchive) {
      setConfirmingArchive(true);
      return;
    }
    if (onArchive(schedule.id)) {
      onClose();
    }
  }

  return (
    <>
      <FormBottomSheet
        visible
        kicker={t.recurring.recurring}
        title={t.recurring.editRecurring}
        closeLabel={t.recurring.closeEditor}
        onClose={onClose}
        footer={
          <MotionPressable
            onPress={save}
            disabled={!canSave}
            accessibilityLabel={t.recurring.saveChanges}
            accessibilityState={{ disabled: !canSave }}
            haptic="medium"
            style={[
              styles.saveButton,
              { backgroundColor: canSave ? colors.primaryFill : colors.surfaceBorder },
            ]}
          >
            <Text
              style={[
                styles.saveButtonText,
                typography.button,
                { color: canSave ? colors.onPrimary : colors.textMuted },
              ]}
            >
              {t.recurring.saveChanges}
            </Text>
          </MotionPressable>
        }
      >
        <SegmentedControl
          value={type}
          onChange={(nextType) => {
            setType(nextType);
            const firstCategory = categories.find((category) => category.type === nextType);
            if (firstCategory) {
              setCategoryId(firstCategory.id);
            }
          }}
          options={[
            { label: t.common.expense, value: "expense" },
            { label: t.common.income, value: "income" },
          ]}
        />

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, typography.button, { color: colors.textMuted }]}>
            {t.transactions.amount}
          </Text>
          <View
            style={[
              styles.amountRow,
              { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder },
            ]}
          >
            <Text style={[styles.currency, typography.title, { color: colors.textMuted }]}>
              {schedule.currency}
            </Text>
            <TextInput
              value={amountText}
              onChangeText={(value) => setAmountText(normalizeAmountInput(value))}
              keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
              inputMode="decimal"
              selectTextOnFocus
              maxLength={12}
              selectionColor={colors.primary}
              style={[styles.amountInput, typography.display, { color: colors.text }]}
              accessibilityLabel={t.transactions.amount}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, typography.button, { color: colors.textMuted }]}>
            {t.common.category}
          </Text>
          <View style={styles.categoryWrap}>
            {categoriesForType.map((category) => {
              const active = category.id === activeCategoryId;
              return (
                <MotionPressable
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
                  accessibilityLabel={t.log.categoryA11y(category.name)}
                  accessibilityState={{ selected: active }}
                  haptic="selection"
                  style={[
                    styles.category,
                    {
                      borderColor: active ? colors.primary : colors.surfaceBorder,
                      backgroundColor: active ? colors.primarySoft : colors.backgroundAlt,
                    },
                  ]}
                >
                  <CategoryGlyph
                    icon={category.icon}
                    color={category.color ?? colors.primary}
                    size={28}
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.categoryText, typography.button, { color: colors.text }]}
                  >
                    {category.name}
                  </Text>
                </MotionPressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, typography.button, { color: colors.textMuted }]}>
            {t.recurring.frequency}
          </Text>
          <SegmentedControl value={frequency} onChange={setFrequency} options={recurrenceOptions} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, typography.button, { color: colors.textMuted }]}>
            {t.recurring.firstDate}
          </Text>
          <MotionPressable
            onPress={() => setDatePickerVisible(true)}
            accessibilityLabel={t.recurring.pickFirstDate}
            haptic="selection"
            style={[
              styles.dateButton,
              { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder },
            ]}
          >
            <Text style={[styles.dateText, typography.button, { color: colors.text }]}>
              {formatDateInputLabel(startDate, t.locale)}
            </Text>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={20}
              color={colors.primary}
            />
          </MotionPressable>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.label, typography.button, { color: colors.textMuted }]}>
            {t.common.notes}
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={120}
            multiline
            placeholder={t.log.addNoteOptional}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            style={[
              styles.noteInput,
              typography.body,
              {
                color: colors.text,
                backgroundColor: colors.backgroundAlt,
                borderColor: colors.surfaceBorder,
              },
            ]}
            accessibilityLabel={t.log.transactionNote}
          />
        </View>

        <View
          style={[
            styles.statusRow,
            { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder },
          ]}
        >
          <View style={styles.statusCopy}>
            <Text style={[styles.statusTitle, typography.button, { color: colors.text }]}>
              {isActive ? t.recurring.active : t.recurring.paused}
            </Text>
            <Text style={[styles.statusMeta, typography.body, { color: colors.textMuted }]}>
              {isActive ? t.recurring.activeHint : t.recurring.pausedHint}
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            accessibilityLabel={t.recurring.scheduleActive}
            trackColor={{ false: colors.surfaceBorder, true: colors.primaryBorder }}
            thumbColor={isActive ? colors.primary : colors.textMuted}
          />
        </View>

        <View style={[styles.notice, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="information-outline" size={19} color={colors.primary} />
          <Text style={[styles.noticeText, typography.body, { color: colors.textMuted }]}>
            {t.recurring.futureOnlyHint}
          </Text>
        </View>

        <MotionPressable
          onPress={archive}
          accessibilityLabel={
            confirmingArchive ? t.recurring.confirmDelete : t.recurring.deleteSchedule
          }
          haptic={confirmingArchive ? "medium" : "light"}
          style={[
            styles.deleteButton,
            {
              borderColor: colors.negative,
              backgroundColor: confirmingArchive ? colors.negativeSoft : "transparent",
            },
          ]}
        >
          <MaterialCommunityIcons name="delete-outline" size={19} color={colors.negative} />
          <Text style={[styles.deleteText, typography.button, { color: colors.negative }]}>
            {confirmingArchive ? t.recurring.confirmDelete : t.recurring.deleteSchedule}
          </Text>
        </MotionPressable>
      </FormBottomSheet>

      <LogDatePickerSheet
        visible={datePickerVisible}
        selectedDate={startDate}
        onSelect={setStartDate}
        onToday={() => setStartDate(formatToday())}
        onClose={() => setDatePickerVisible(false)}
      />
    </>
  );
}

function formatToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  fieldGroup: { gap: tokens.spacing.sm },
  label: { fontSize: 12, lineHeight: 16, textTransform: "uppercase" },
  amountRow: {
    minHeight: 64,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  currency: { fontSize: 18, lineHeight: 24 },
  amountInput: {
    flex: 1,
    minHeight: 58,
    padding: 0,
    fontSize: 32,
    lineHeight: 38,
    fontVariant: ["tabular-nums"],
  },
  categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: tokens.spacing.sm },
  category: {
    minHeight: 46,
    maxWidth: "48%",
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingLeft: 6,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  categoryText: { flexShrink: 1, fontSize: 13, lineHeight: 17 },
  dateButton: {
    minHeight: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.sm,
  },
  dateText: { flex: 1, fontSize: 15, lineHeight: 20 },
  noteInput: {
    minHeight: 78,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: "top",
  },
  statusRow: {
    minHeight: 72,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.md,
  },
  statusCopy: { flex: 1, minWidth: 0, gap: 2 },
  statusTitle: { fontSize: 15, lineHeight: 20 },
  statusMeta: { fontSize: 13, lineHeight: 18 },
  notice: {
    borderRadius: tokens.radius.utility,
    padding: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.spacing.sm,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18 },
  deleteButton: {
    minHeight: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  deleteText: { fontSize: 14, lineHeight: 19 },
  saveButton: {
    minHeight: 52,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: { fontSize: 15, lineHeight: 20 },
});
