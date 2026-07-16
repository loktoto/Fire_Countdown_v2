import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated from "react-native-reanimated";

import { CategoryGlyph } from "./CategoryGlyph";
import { MotionPressable } from "./MotionPressable";
import { sheetBackdropEnter, sheetBackdropExit, sheetEnter, sheetExit } from "../design/motion";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { Category, TransactionType } from "../features/types";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useI18n } from "../i18n";

const iconPresets = [
  { label: "Meal", value: "emoji:\\u{1F35C}" },
  { label: "Coffee", value: "emoji:\\u{2615}" },
  { label: "Groceries", value: "emoji:\\u{1F6D2}" },
  { label: "Restaurant", value: "emoji:\\u{1F37D}" },
  { label: "Drink", value: "emoji:\\u{1F964}" },
  { label: "Dessert", value: "emoji:\\u{1F370}" },
  { label: "Ride", value: "emoji:\\u{1F686}" },
  { label: "Taxi", value: "emoji:\\u{1F695}" },
  { label: "Flight", value: "emoji:\\u{2708}" },
  { label: "Fuel", value: "emoji:\\u{26FD}" },
  { label: "Home", value: "emoji:\\u{1F3E0}" },
  { label: "Rent", value: "emoji:\\u{1F3E2}" },
  { label: "Utilities", value: "emoji:\\u{1F4A1}" },
  { label: "Phone", value: "emoji:\\u{1F4F1}" },
  { label: "Internet", value: "emoji:\\u{1F4F6}" },
  { label: "Work", value: "emoji:\\u{1F4BC}" },
  { label: "Salary", value: "emoji:\\u{1F4B5}" },
  { label: "Bonus", value: "emoji:\\u{1F389}" },
  { label: "Growth", value: "emoji:\\u{1F4C8}" },
  { label: "Dividend", value: "emoji:\\u{1F4B8}" },
  { label: "Cash", value: "emoji:\\u{1F4B0}" },
  { label: "Bank", value: "emoji:\\u{1F3E6}" },
  { label: "Card", value: "emoji:\\u{1F4B3}" },
  { label: "Shopping", value: "emoji:\\u{1F6CD}" },
  { label: "Gift", value: "emoji:\\u{1F381}" },
  { label: "Health", value: "emoji:\\u{1F3E5}" },
  { label: "Fitness", value: "emoji:\\u{1F3CB}" },
  { label: "Medicine", value: "emoji:\\u{1F48A}" },
  { label: "Education", value: "emoji:\\u{1F393}" },
  { label: "Books", value: "emoji:\\u{1F4DA}" },
  { label: "Entertainment", value: "emoji:\\u{1F3AC}" },
  { label: "Music", value: "emoji:\\u{1F3B5}" },
  { label: "Game", value: "emoji:\\u{1F3AE}" },
  { label: "Travel", value: "emoji:\\u{1F9F3}" },
  { label: "Pet", value: "emoji:\\u{1F43E}" },
  { label: "Family", value: "emoji:\\u{1F46A}" },
  { label: "Beauty", value: "emoji:\\u{1F485}" },
  { label: "Clothing", value: "emoji:\\u{1F455}" },
  { label: "Repair", value: "emoji:\\u{1F527}" },
  { label: "Insurance", value: "emoji:\\u{1F6E1}" },
  { label: "Tax", value: "emoji:\\u{1F9FE}" },
  { label: "Other", value: "shape-plus-outline" },
];

const colorPresets = ["#5BD9D0", "#57D49B", "#FF6B88", "#F2C94C", "#8D7CF2", "#F28B55", "#6AA7E8"];
const defaultCategoryColor = colorPresets[0] ?? "#5BD9D0";

function defaultIcon(type: TransactionType) {
  return type === "income" ? "emoji:\\u{1F4C8}" : "emoji:\\u{1F35C}";
}

function decodeIcon(icon: string) {
  return icon.replace(/\\u\{([0-9A-Fa-f]+)\}/g, (_, hex: string) =>
    String.fromCodePoint(Number.parseInt(hex, 16)),
  );
}

export function CategoryEditorSheet({
  visible,
  category,
  type,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  category: Category | null;
  type: TransactionType;
  onClose: () => void;
  onSave: (input: Pick<Category, "name" | "icon" | "color">, categoryId?: string) => void;
  onDelete?: (categoryId: string) => void;
}) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();
  const draftKey = `${category?.id ?? "new"}-${type}`;

  if (!visible) {
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
          <CategoryEditorContent
            key={draftKey}
            category={category}
            type={type}
            onClose={onClose}
            onSave={onSave}
            onDelete={onDelete}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CategoryEditorContent({
  category,
  type,
  onClose,
  onSave,
  onDelete,
}: {
  category: Category | null;
  type: TransactionType;
  onClose: () => void;
  onSave: (input: Pick<Category, "name" | "icon" | "color">, categoryId?: string) => void;
  onDelete?: (categoryId: string) => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const { width } = useWindowDimensions();
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? defaultIcon(type));
  const [color, setColor] = useState<string>(category?.color ?? defaultCategoryColor);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const title = category ? t.categories.editCategory : t.categories.newCategory;
  const canSave = name.trim().length > 0;
  const decodedIcon = useMemo(() => decodeIcon(icon), [icon]);
  const optionGap = 6;
  const contentWidth = Math.max(280, width - tokens.spacing.lg * 2);
  const iconColumns = contentWidth >= 330 ? 6 : 5;
  const iconOptionSize = Math.floor((contentWidth - optionGap * (iconColumns - 1)) / iconColumns);
  const iconGlyphSize = Math.max(32, Math.min(40, iconOptionSize - 12));

  function save() {
    if (!canSave) {
      return;
    }
    onSave(
      {
        name: name.trim(),
        icon: decodedIcon,
        color,
      },
      category?.id,
    );
    onClose();
  }

  function deleteCategory() {
    if (!category || !onDelete) {
      return;
    }

    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    onDelete(category.id);
    onClose();
  }

  return (
    <>
      <View style={[styles.grabber, { backgroundColor: colors.surfaceBorder }]} />
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, typography.button, { color: colors.primary }]}>
            {type === "income" ? t.common.income : t.common.expense}
          </Text>
          <Text style={[styles.title, typography.title, { color: colors.text }]}>{title}</Text>
        </View>
        <CategoryGlyph icon={decodedIcon} color={color} size={44} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t.categories.categoryName}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          style={[
            styles.input,
            typography.title,
            {
              color: colors.text,
              borderColor: colors.surfaceBorder,
              backgroundColor: colors.backgroundAlt,
            },
          ]}
          returnKeyType="done"
          onSubmitEditing={save}
          accessibilityLabel={t.categories.categoryName}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, typography.button, { color: colors.textMuted }]}>
            {t.common.symbol}
          </Text>
          <View style={[styles.options, { columnGap: optionGap, rowGap: optionGap }]}>
            {iconPresets.map((item) => {
              const itemIcon = decodeIcon(item.value);
              const active = decodeIcon(item.value) === decodeIcon(icon);
              return (
                <MotionPressable
                  key={item.label}
                  onPress={() => setIcon(item.value)}
                  accessibilityLabel={t.categories.symbolA11y(item.label)}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.iconOption,
                    {
                      width: iconOptionSize,
                      height: iconOptionSize,
                    },
                    {
                      borderColor: active ? color : colors.surfaceBorder,
                      backgroundColor: active ? `${color}22` : colors.backgroundAlt,
                    },
                  ]}
                >
                  <CategoryGlyph
                    icon={itemIcon}
                    color={active ? color : colors.textMuted}
                    size={iconGlyphSize}
                  />
                </MotionPressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, typography.button, { color: colors.textMuted }]}>
            {t.common.color}
          </Text>
          <View style={[styles.options, { columnGap: 10, rowGap: 10 }]}>
            {colorPresets.map((item) => {
              const active = item === color;
              return (
                <MotionPressable
                  key={item}
                  onPress={() => setColor(item)}
                  accessibilityLabel={t.categories.colorA11y(item)}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: item,
                      borderColor: active ? colors.text : "transparent",
                    },
                  ]}
                >
                  {active ? (
                    <MaterialCommunityIcons name="check" size={18} color={tokens.color.obsidian} />
                  ) : null}
                </MotionPressable>
              );
            })}
          </View>
        </View>

        {category && onDelete ? (
          <View style={styles.deleteSection}>
            {deleteConfirm ? (
              <Text style={[styles.deleteHint, typography.body, { color: colors.textMuted }]}>
                {t.categories.deleteHint}
              </Text>
            ) : null}
            <MotionPressable
              onPress={deleteCategory}
              accessibilityLabel={
                deleteConfirm ? t.categories.confirmDeleteCategory : t.categories.deleteCategory
              }
              style={[
                styles.deleteButton,
                {
                  borderColor: colors.negative,
                  backgroundColor: deleteConfirm ? `${colors.negative}18` : "transparent",
                },
              ]}
            >
              <MaterialCommunityIcons
                name={deleteConfirm ? "trash-can-outline" : "delete-outline"}
                size={18}
                color={colors.negative}
              />
              <Text style={[styles.deleteText, typography.button, { color: colors.negative }]}>
                {deleteConfirm ? t.categories.confirmDeleteCta : t.categories.deleteCategoryCta}
              </Text>
            </MotionPressable>
          </View>
        ) : null}

        <MotionPressable
          onPress={save}
          disabled={!canSave}
          accessibilityLabel={t.categories.saveCategory}
          accessibilityState={{ disabled: !canSave }}
          style={[
            styles.save,
            {
              backgroundColor: canSave ? colors.primary : colors.surfaceBorder,
            },
          ]}
        >
          <Text
            style={[
              styles.saveText,
              typography.button,
              { color: canSave ? colors.onPrimary : colors.textMuted },
            ]}
          >
            {t.categories.saveCategoryCta}
          </Text>
        </MotionPressable>
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
    maxHeight: "94%",
    borderTopLeftRadius: tokens.radius.card,
    borderTopRightRadius: tokens.radius.card,
    borderWidth: 1,
    padding: 18,
    gap: 14,
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
    gap: tokens.spacing.md,
  },
  kicker: {
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  content: {
    gap: 12,
    paddingBottom: tokens.spacing.sm,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.md,
    fontSize: 18,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  iconOption: {
    borderRadius: tokens.radius.utility,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  save: {
    minHeight: 50,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    fontSize: 14,
  },
  deleteSection: {
    gap: tokens.spacing.sm,
  },
  deleteHint: {
    fontSize: 13,
    lineHeight: 18,
  },
  deleteButton: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  deleteText: {
    fontSize: 13,
  },
});
