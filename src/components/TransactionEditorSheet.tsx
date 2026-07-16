import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

import { CategoryGlyph } from "./CategoryGlyph";
import { LogDatePickerSheet } from "./LogDatePickerSheet";
import { MotionPressable } from "./MotionPressable";
import { SegmentedControl } from "./SegmentedControl";
import { sheetBackdropEnter, sheetBackdropExit, sheetEnter, sheetExit } from "../design/motion";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { Category, Transaction, TransactionType } from "../features/types";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useI18n } from "../i18n";
import { formatDateInputLabel, todayIso } from "../utils/format";

type CalendarTransaction = Transaction & {
  category: Category | null;
};

type TransactionPatch = Partial<
  Pick<Transaction, "amount" | "categoryId" | "currency" | "date" | "note" | "type">
>;

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  return !Number.isNaN(Date.parse(`${value}T00:00:00`));
}

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

export function TransactionEditorSheet({
  visible,
  transaction,
  categories,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  transaction: CalendarTransaction | null;
  categories: Category[];
  onClose: () => void;
  onSave: (id: string, patch: TransactionPatch) => void;
  onDelete: (id: string) => void;
}) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  if (!visible || !transaction) {
    return null;
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.modalRoot}
      >
        <Animated.View
          entering={reducedMotion ? undefined : sheetBackdropEnter}
          exiting={reducedMotion ? undefined : sheetBackdropExit}
          style={styles.scrim}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          entering={reducedMotion ? undefined : sheetEnter}
          exiting={reducedMotion ? undefined : sheetExit}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surfaceSolid,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <TransactionEditorContent
            key={transaction.id}
            transaction={transaction}
            categories={categories}
            onClose={onClose}
            onSave={onSave}
            onDelete={onDelete}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TransactionEditorContent({
  transaction,
  categories,
  onClose,
  onSave,
  onDelete,
}: {
  transaction: CalendarTransaction;
  categories: Category[];
  onClose: () => void;
  onSave: (id: string, patch: TransactionPatch) => void;
  onDelete: (id: string) => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const [amountText, setAmountText] = useState(String(transaction.amount));
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [date, setDate] = useState(transaction.date);
  const [note, setNote] = useState(transaction.note ?? "");
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const categoriesForType = categories.filter((category) => category.type === type);
  const activeCategoryId = categoriesForType.some((category) => category.id === categoryId)
    ? categoryId
    : (categoriesForType[0]?.id ?? categoryId);
  const amount = Number.parseFloat(amountText) || 0;
  const canSave = amount > 0 && activeCategoryId.length > 0 && isIsoDate(date);

  function save() {
    if (!canSave) {
      return;
    }
    onSave(transaction.id, {
      amount,
      type,
      categoryId: activeCategoryId,
      currency: transaction.currency,
      date,
      note: note.trim().length > 0 ? note.trim() : null,
    });
    onClose();
  }

  function deleteRecord() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    onDelete(transaction.id);
    onClose();
  }

  return (
    <>
      <View style={[styles.grabber, { backgroundColor: colors.surfaceBorder }]} />
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, typography.button, { color: colors.primary }]}>
            {t.transactions.transaction}
          </Text>
          <Text style={[styles.title, typography.title, { color: colors.text }]}>
            {t.transactions.editRecord}
          </Text>
        </View>
        <MotionPressable
          onPress={onClose}
          accessibilityLabel={t.transactions.closeEditor}
          style={[styles.closeButton, { backgroundColor: colors.backgroundAlt }]}
        >
          <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
        </MotionPressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
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
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            {t.transactions.amount}
          </Text>
          <View
            style={[
              styles.amountRow,
              { backgroundColor: colors.backgroundAlt, borderColor: colors.surfaceBorder },
            ]}
          >
            <Text style={[styles.currency, typography.title, { color: colors.textMuted }]}>
              {transaction.currency}
            </Text>
            <TextInput
              value={amountText}
              onChangeText={(value) => setAmountText(normalizeAmountInput(value))}
              keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
              inputMode="decimal"
              selectTextOnFocus
              selectionColor={colors.primary}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              style={[styles.amountInput, typography.display, { color: colors.text }]}
              accessibilityLabel={t.log.transactionAmount}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            {t.common.category}
          </Text>
          <View style={styles.categoryWrap}>
            {categoriesForType.map((category) => {
              const active = category.id === activeCategoryId;
              const categoryColor = category.color ?? colors.primary;
              return (
                <MotionPressable
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
                  accessibilityLabel={t.log.categoryA11y(category.name)}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.category,
                    {
                      borderColor: active ? categoryColor : colors.surfaceBorder,
                      backgroundColor: active ? `${categoryColor}22` : colors.backgroundAlt,
                    },
                  ]}
                >
                  <CategoryGlyph icon={category.icon} color={categoryColor} size={30} />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.categoryText,
                      typography.button,
                      { color: active ? categoryColor : colors.text },
                    ]}
                  >
                    {category.name}
                  </Text>
                </MotionPressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            {t.common.date}
          </Text>
          <MotionPressable
            onPress={() => setDatePickerVisible(true)}
            haptic="selection"
            accessibilityLabel={t.transactions.transactionDate}
            style={[
              styles.dateButton,
              {
                borderColor: colors.surfaceBorder,
                backgroundColor: colors.backgroundAlt,
              },
            ]}
          >
            <Text style={[styles.dateText, typography.button, { color: colors.text }]}>
              {formatDateInputLabel(date, t.locale)}
            </Text>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={20}
              color={colors.primary}
            />
          </MotionPressable>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            {t.common.notes}
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={120}
            multiline
            placeholder={t.log.noNoteYet}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            style={[
              styles.input,
              styles.noteInput,
              typography.body,
              {
                color: colors.text,
                borderColor: colors.surfaceBorder,
                backgroundColor: colors.backgroundAlt,
              },
            ]}
            accessibilityLabel={t.log.transactionNote}
          />
        </View>

        <View style={styles.actions}>
          <MotionPressable
            onPress={deleteRecord}
            haptic={confirmingDelete ? "medium" : "light"}
            accessibilityLabel={
              confirmingDelete
                ? t.transactions.confirmDeleteTransaction
                : t.transactions.deleteTransaction
            }
            style={[
              styles.secondaryAction,
              {
                borderColor: colors.negative,
                backgroundColor: confirmingDelete ? `${colors.negative}18` : "transparent",
              },
            ]}
          >
            <MaterialCommunityIcons name="delete-outline" size={18} color={colors.negative} />
            <Text
              style={[styles.secondaryActionText, typography.button, { color: colors.negative }]}
            >
              {confirmingDelete ? t.common.confirmDelete : t.common.delete}
            </Text>
          </MotionPressable>
          <MotionPressable
            onPress={save}
            disabled={!canSave}
            accessibilityLabel={t.transactions.saveTransaction}
            accessibilityState={{ disabled: !canSave }}
            style={[
              styles.primaryAction,
              { backgroundColor: canSave ? colors.primary : colors.surfaceBorder },
            ]}
          >
            <Text
              style={[
                styles.primaryActionText,
                typography.button,
                { color: canSave ? colors.onPrimary : colors.textMuted },
              ]}
            >
              {t.common.save}
            </Text>
          </MotionPressable>
        </View>
      </ScrollView>

      <LogDatePickerSheet
        visible={datePickerVisible}
        selectedDate={date}
        onSelect={setDate}
        onToday={() => setDate(todayIso())}
        onClose={() => setDatePickerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.58)",
  },
  sheet: {
    maxHeight: "88%",
    borderTopLeftRadius: tokens.radius.card,
    borderTopRightRadius: tokens.radius.card,
    borderWidth: 1,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  grabber: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: tokens.radius.pill,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 26,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
  },
  fieldGroup: {
    gap: tokens.spacing.sm,
  },
  fieldLabel: {
    fontSize: 12,
    textTransform: "uppercase",
  },
  amountRow: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  currency: {
    fontSize: 18,
  },
  amountInput: {
    flex: 1,
    minHeight: 58,
    padding: 0,
    fontSize: 32,
    lineHeight: 38,
    fontVariant: ["tabular-nums"],
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
  },
  category: {
    minHeight: 44,
    maxWidth: "48%",
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingLeft: 6,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  categoryText: {
    flexShrink: 1,
    fontSize: 13,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 0,
    fontSize: 15,
  },
  dateButton: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.sm,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ["tabular-nums"],
  },
  noteInput: {
    minHeight: 78,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
  },
  secondaryAction: {
    minHeight: 52,
    flex: 1,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 13,
  },
  primaryAction: {
    minHeight: 52,
    flex: 1.4,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    fontSize: 14,
  },
});
