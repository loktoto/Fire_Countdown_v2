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
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";

import { CategoryGlyph } from "./CategoryGlyph";
import { MotionPressable } from "./MotionPressable";
import { SegmentedControl } from "./SegmentedControl";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { Category, Transaction, TransactionType } from "../features/types";

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
  onArchive,
}: {
  visible: boolean;
  transaction: CalendarTransaction | null;
  categories: Category[];
  onClose: () => void;
  onSave: (id: string, patch: TransactionPatch) => void;
  onArchive: (id: string) => void;
}) {
  const colors = useThemeColors();

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
          entering={FadeIn.duration(160)}
          exiting={FadeOut.duration(120)}
          style={styles.scrim}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <Animated.View
          entering={SlideInDown.duration(260)}
          exiting={SlideOutDown.duration(180)}
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
            onArchive={onArchive}
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
  onArchive,
}: {
  transaction: CalendarTransaction;
  categories: Category[];
  onClose: () => void;
  onSave: (id: string, patch: TransactionPatch) => void;
  onArchive: (id: string) => void;
}) {
  const colors = useThemeColors();
  const [amountText, setAmountText] = useState(String(transaction.amount));
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [date, setDate] = useState(transaction.date);
  const [note, setNote] = useState(transaction.note ?? "");
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

  function archive() {
    onArchive(transaction.id);
    onClose();
  }

  return (
    <>
      <View style={[styles.grabber, { backgroundColor: colors.surfaceBorder }]} />
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, typography.button, { color: colors.primary }]}>
            Transaction
          </Text>
          <Text style={[styles.title, typography.title, { color: colors.text }]}>Edit record</Text>
        </View>
        <MotionPressable
          onPress={onClose}
          accessibilityLabel="Close transaction editor"
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
            { label: "Expense", value: "expense" },
            { label: "Income", value: "income" },
          ]}
        />

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            Amount
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
              accessibilityLabel="Transaction amount"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            Category
          </Text>
          <View style={styles.categoryWrap}>
            {categoriesForType.map((category) => {
              const active = category.id === activeCategoryId;
              const categoryColor = category.color ?? colors.primary;
              return (
                <MotionPressable
                  key={category.id}
                  onPress={() => setCategoryId(category.id)}
                  accessibilityLabel={`${category.name} category`}
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
            Date
          </Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            maxLength={10}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            style={[
              styles.input,
              typography.body,
              {
                color: colors.text,
                borderColor: isIsoDate(date) ? colors.surfaceBorder : colors.negative,
                backgroundColor: colors.backgroundAlt,
              },
            ]}
            accessibilityLabel="Transaction date"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            Notes
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            maxLength={120}
            multiline
            placeholder="No note yet"
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
            accessibilityLabel="Transaction note"
          />
        </View>

        <View style={styles.actions}>
          <MotionPressable
            onPress={archive}
            accessibilityLabel="Archive transaction"
            style={[styles.secondaryAction, { borderColor: colors.negative }]}
          >
            <MaterialCommunityIcons name="archive-outline" size={18} color={colors.negative} />
            <Text
              style={[styles.secondaryActionText, typography.button, { color: colors.negative }]}
            >
              ARCHIVE
            </Text>
          </MotionPressable>
          <MotionPressable
            onPress={save}
            disabled={!canSave}
            accessibilityLabel="Save transaction"
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
              SAVE
            </Text>
          </MotionPressable>
        </View>
      </ScrollView>
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
    width: 38,
    height: 38,
    borderRadius: 19,
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
    minHeight: 42,
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
