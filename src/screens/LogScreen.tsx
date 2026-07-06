import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

import { CategoryEditorSheet } from "../components/CategoryEditorSheet";
import { CategoryGlyph } from "../components/CategoryGlyph";
import { FireImpactCard } from "../components/FireImpactCard";
import { GlassCard } from "../components/GlassCard";
import { LogDatePickerSheet } from "../components/LogDatePickerSheet";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenContainer } from "../components/ScreenContainer";
import { SegmentedControl } from "../components/SegmentedControl";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { Category } from "../features/types";
import { useLogViewModel } from "../hooks/useLogViewModel";

function formatDateInputLabel(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export function LogScreen() {
  const colors = useThemeColors();
  const vm = useLogViewModel();
  const amountRef = useRef<TextInput>(null);
  const [categorySheetVisible, setCategorySheetVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const selectedCategory =
    vm.categories.find((category) => category.id === vm.categoryId) ?? vm.categories[0] ?? null;

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => amountRef.current?.focus(), 260);
      return () => clearTimeout(timer);
    }, []),
  );

  function openNewCategory() {
    setEditingCategory(null);
    setCategorySheetVisible(true);
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category);
    setCategorySheetVisible(true);
  }

  function saveCategory(input: Pick<Category, "name" | "icon" | "color">, categoryId?: string) {
    if (categoryId) {
      vm.updateCategory(categoryId, input);
      return;
    }
    vm.createCategory(input);
  }

  function deleteCategory(categoryId: string) {
    vm.archiveCategory(categoryId);
    if (categoryId === vm.categoryId) {
      const nextCategory = vm.categories.find((category) => category.id !== categoryId);
      if (nextCategory) {
        vm.setCategoryId(nextCategory.id);
      }
    }
  }

  return (
    <ScreenContainer>
      <GlassCard compact style={styles.amountCard}>
        <Text style={[styles.amountLabel, typography.button, { color: colors.textMuted }]}>
          AMOUNT
        </Text>
        <View style={styles.amountInputRow}>
          <Text style={[styles.currency, typography.display, { color: colors.textMuted }]}>
            {vm.currency}
          </Text>
          <TextInput
            ref={amountRef}
            value={vm.amountText}
            onChangeText={vm.setAmountText}
            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
            inputMode="decimal"
            selectTextOnFocus
            maxLength={12}
            returnKeyType="done"
            selectionColor={colors.primary}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            style={[styles.amountInput, typography.display, { color: colors.text }]}
            accessibilityLabel="Transaction amount"
          />
        </View>
        <SegmentedControl
          value={vm.type}
          onChange={vm.setType}
          options={[
            { label: "Expense", value: "expense" },
            { label: "Income", value: "income" },
          ]}
        />
        <View style={styles.dateBlock}>
          <View
            style={[
              styles.dateStepper,
              { backgroundColor: colors.surfaceSolid, borderColor: colors.surfaceBorder },
            ]}
          >
            <MotionPressable
              onPress={() => vm.moveSelectedDate(-1)}
              accessibilityLabel="Previous day"
              style={styles.dateArrow}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="chevron-left" size={22} color={colors.primary} />
            </MotionPressable>
            <MotionPressable
              onPress={() => setDatePickerVisible(true)}
              accessibilityLabel="Pick transaction day"
              style={styles.dateCopy}
            >
              <View style={styles.dateValueRow}>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.dateValue, typography.title, { color: colors.text }]}
                >
                  {formatDateInputLabel(vm.selectedDate)}
                </Text>
                <MaterialCommunityIcons
                  name="calendar-search-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>
            </MotionPressable>
            <MotionPressable
              onPress={() => vm.moveSelectedDate(1)}
              accessibilityLabel="Next day"
              style={styles.dateArrow}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
            </MotionPressable>
          </View>
        </View>
        <View
          style={[
            styles.noteInline,
            { backgroundColor: colors.surfaceSolid, borderColor: colors.surfaceBorder },
          ]}
        >
          <MaterialCommunityIcons name="note-text-outline" size={18} color={colors.primary} />
          <TextInput
            value={vm.noteText}
            onChangeText={vm.setNoteText}
            maxLength={120}
            returnKeyType="done"
            selectionColor={colors.primary}
            placeholder="No note yet"
            placeholderTextColor={colors.textMuted}
            style={[styles.noteInput, typography.body, { color: colors.text }]}
            accessibilityLabel="Transaction note"
          />
        </View>
      </GlassCard>

      <FireImpactCard amount={vm.amount} impact={vm.impact} />

      <View style={styles.categoryHeader}>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          Category
        </Text>
        {selectedCategory ? (
          <MotionPressable
            onPress={() => openEditCategory(selectedCategory)}
            accessibilityLabel="Edit selected category"
            style={[styles.editButton, { borderColor: colors.surfaceBorder }]}
          >
            <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
            <Text style={[styles.editText, typography.button, { color: colors.primary }]}>
              Edit
            </Text>
          </MotionPressable>
        ) : null}
      </View>
      <View style={styles.categoryWrap}>
        {vm.categories.map((category) => {
          const active = category.id === vm.categoryId;
          const categoryColor = category.color ?? colors.primary;
          return (
            <MotionPressable
              key={category.id}
              onPress={() => vm.setCategoryId(category.id)}
              onLongPress={() => openEditCategory(category)}
              accessibilityLabel={`${category.name} category`}
              accessibilityState={{ selected: active }}
              style={[
                styles.category,
                {
                  borderColor: active ? categoryColor : colors.surfaceBorder,
                  backgroundColor: active ? `${categoryColor}22` : colors.surfaceSolid,
                },
              ]}
            >
              <CategoryGlyph icon={category.icon} color={categoryColor} size={32} />
              <Text
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
        <MotionPressable
          onPress={openNewCategory}
          accessibilityLabel="Add category"
          style={[
            styles.category,
            styles.addCategory,
            { borderColor: colors.primary, backgroundColor: `${colors.primary}14` },
          ]}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
          <Text style={[styles.categoryText, typography.button, { color: colors.primary }]}>
            Add
          </Text>
        </MotionPressable>
      </View>

      <MotionPressable
        onPress={vm.confirm}
        style={[styles.confirm, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        accessibilityLabel="Confirm transaction"
      >
        <Text style={[styles.confirmText, typography.button, { color: colors.onPrimary }]}>
          CONFIRM TRANSACTION
        </Text>
      </MotionPressable>

      <CategoryEditorSheet
        visible={categorySheetVisible}
        category={editingCategory}
        type={vm.type}
        onClose={() => setCategorySheetVisible(false)}
        onSave={saveCategory}
        onDelete={deleteCategory}
      />
      <LogDatePickerSheet
        visible={datePickerVisible}
        selectedDate={vm.selectedDate}
        onSelect={vm.setSelectedDate}
        onToday={vm.resetSelectedDate}
        onClose={() => setDatePickerVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  amountCard: {
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
  },
  amountLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  currency: {
    fontSize: 30,
    lineHeight: 36,
  },
  amountInput: {
    flex: 1,
    minHeight: 60,
    padding: 0,
    fontSize: 46,
    lineHeight: 54,
    fontVariant: ["tabular-nums"],
  },
  categoryHeader: {
    marginTop: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  editButton: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editText: {
    fontSize: 13,
  },
  categoryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 6,
    columnGap: 6,
  },
  category: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingLeft: 6,
    paddingRight: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    lineHeight: 16,
  },
  addCategory: {
    paddingLeft: 12,
  },
  dateBlock: {
    gap: tokens.spacing.sm,
  },
  dateStepper: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  dateArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dateCopy: {
    flex: 1,
    minWidth: 0,
  },
  dateValue: {
    flex: 1,
    minWidth: 0,
    textAlign: "center",
    fontSize: 18,
    lineHeight: 22,
  },
  dateValueRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  noteInline: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  noteInput: {
    flex: 1,
    minHeight: 38,
    paddingVertical: 0,
    fontSize: 15,
    lineHeight: 20,
  },
  confirm: {
    minHeight: 52,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  confirmText: {
    fontSize: 14,
  },
});
