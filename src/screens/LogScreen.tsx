import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  InputAccessoryView,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { AppHeader } from "../components/AppHeader";
import { CategoryEditorSheet } from "../components/CategoryEditorSheet";
import { CategoryGlyph } from "../components/CategoryGlyph";
import { FireImpactCard } from "../components/FireImpactCard";
import { GlassCard } from "../components/GlassCard";
import { LogDatePickerSheet } from "../components/LogDatePickerSheet";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SegmentedControl } from "../components/SegmentedControl";
import { TimeLensValue } from "../components/TimeLens";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { Category } from "../features/types";
import { useLogViewModel } from "../hooks/useLogViewModel";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useI18n } from "../i18n";
import { formatDateInputLabel } from "../utils/format";

export function LogScreen() {
  const colors = useThemeColors();
  const t = useI18n();
  const vm = useLogViewModel();
  const reducedMotion = useReducedMotion();
  const { width, fontScale } = useWindowDimensions();
  const amountRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const inputOffsets = useRef({ amountCard: 0, noteWithinCard: 0 });
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [categorySheetVisible, setCategorySheetVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);
  const stackAmount = width < 350 || fontScale > 1.35;
  const stackCategoryHeader = width < 340 || fontScale > 1.25;
  const amountAccessoryId = "log-amount-keyboard-actions";
  const formattedDate = formatDateInputLabel(vm.selectedDate, t.locale);
  const selectedDateLabel = vm.isTodaySelected
    ? `${t.common.today} · ${formattedDate}`
    : formattedDate;
  const typeAccent = vm.type === "expense" ? colors.negative : colors.positive;
  const typeAccentSoft = vm.type === "expense" ? colors.negativeSoft : colors.positiveSoft;
  const selectedCategory =
    vm.categories.find((category) => category.id === vm.categoryId) ?? vm.categories[0] ?? null;

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => amountRef.current?.focus(), 260);
      return () => clearTimeout(timer);
    }, []),
  );

  useEffect(() => () => {
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }
  });

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

  function confirmTransaction() {
    if (vm.confirm()) {
      AccessibilityInfo.announceForAccessibility(t.log.transactionSaved);
      setSavedFeedback(true);
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
      savedTimerRef.current = setTimeout(() => setSavedFeedback(false), 1200);
    }
  }

  function revealFocusedInput(input: "amount" | "note") {
    const inputOffset =
      input === "amount"
        ? inputOffsets.current.amountCard
        : inputOffsets.current.amountCard + inputOffsets.current.noteWithinCard;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, inputOffset - tokens.spacing.lg),
        animated: true,
      });
    });
  }

  return (
    <ScreenScaffold keyboardAware scrollRef={scrollRef}>
      <AppHeader
        eyebrow={t.log.kicker}
        title={t.log.title}
        subtitle={t.log.subtitle}
        accentColor={colors.primary}
      />

      <View
        onLayout={({ nativeEvent }) => {
          inputOffsets.current.amountCard = nativeEvent.layout.y;
        }}
      >
        <GlassCard compact style={styles.amountCard}>
          <Text style={[styles.amountLabel, typography.button, { color: colors.textMuted }]}>
            {t.log.amount}
          </Text>
          <TimeLensValue
            amount={vm.amount}
            moneyText={`${vm.currency} ${vm.amountText}`}
            kind={vm.type}
            disabled={vm.amount <= 0}
            onPress={() => amountRef.current?.focus()}
            accessibilityLabel={t.log.transactionAmount}
            style={styles.amountPressable}
            textStyle={[styles.amountTimeMeaning, typography.display, { color: typeAccent }]}
            numberOfLines={2}
          >
            <View style={[styles.amountInputRow, stackAmount && styles.amountInputStack]}>
              <Text style={[styles.currency, typography.display, { color: colors.textMuted }]}>
                {vm.currency}
              </Text>
              <TextInput
                ref={amountRef}
                value={vm.amountText}
                onChangeText={(value) => {
                  setSavedFeedback(false);
                  vm.setAmountText(value);
                }}
                keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
                inputMode="decimal"
                inputAccessoryViewID={Platform.OS === "ios" ? amountAccessoryId : undefined}
                selectTextOnFocus
                maxLength={12}
                returnKeyType="done"
                selectionColor={colors.primary}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.amountInput,
                  stackAmount && styles.amountInputStacked,
                  typography.display,
                  { color: colors.text },
                ]}
                accessibilityLabel={t.log.transactionAmount}
                onFocus={() => revealFocusedInput("amount")}
              />
            </View>
          </TimeLensValue>
          <SegmentedControl
            value={vm.type}
            onChange={vm.setType}
            activeColor={typeAccent}
            activeSoftColor={typeAccentSoft}
            options={[
              { label: t.common.expense, value: "expense" },
              { label: t.common.income, value: "income" },
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
                accessibilityLabel={t.log.previousDay}
                style={styles.dateArrow}
                hitSlop={8}
                haptic="selection"
              >
                <MaterialCommunityIcons name="chevron-left" size={22} color={colors.primary} />
              </MotionPressable>
              <MotionPressable
                onPress={() => setDatePickerVisible(true)}
                accessibilityLabel={t.log.pickTransactionDay}
                style={styles.dateCopy}
                haptic="selection"
              >
                <View style={styles.dateValueRow}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[styles.dateValue, typography.title, { color: colors.text }]}
                  >
                    {selectedDateLabel}
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
                accessibilityLabel={t.log.nextDay}
                style={styles.dateArrow}
                hitSlop={8}
                haptic="selection"
              >
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
              </MotionPressable>
            </View>
          </View>
          <View
            onLayout={({ nativeEvent }) => {
              inputOffsets.current.noteWithinCard = nativeEvent.layout.y;
            }}
            style={[
              styles.noteInline,
              {
                backgroundColor: colors.surfaceSolid,
                borderColor: noteFocused ? colors.primary : colors.surfaceBorder,
              },
            ]}
          >
            <MaterialCommunityIcons name="note-text-outline" size={18} color={colors.primary} />
            <TextInput
              value={vm.noteText}
              onChangeText={vm.setNoteText}
              maxLength={120}
              multiline
              blurOnSubmit={false}
              returnKeyType="default"
              selectionColor={colors.primary}
              placeholder={t.log.addNoteOptional}
              placeholderTextColor={colors.textMuted}
              style={[styles.noteInput, typography.body, { color: colors.text }]}
              accessibilityLabel={t.log.transactionNote}
              onFocus={() => {
                setNoteFocused(true);
                revealFocusedInput("note");
              }}
              onBlur={() => setNoteFocused(false)}
            />
            {vm.noteText.length > 0 ? (
              <MotionPressable
                onPress={() => vm.setNoteText("")}
                accessibilityLabel={t.log.clearNote}
                hitSlop={6}
                style={[styles.clearNote, { backgroundColor: colors.backgroundAlt }]}
              >
                <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
              </MotionPressable>
            ) : null}
          </View>
        </GlassCard>
      </View>

      <FireImpactCard amount={vm.amount} impact={vm.impact} />

      <View style={[styles.categoryHeader, stackCategoryHeader && styles.categoryHeaderStack]}>
        <Text style={[styles.sectionTitle, typography.title, { color: colors.text }]}>
          {t.common.category}
        </Text>
        {selectedCategory ? (
          <MotionPressable
            onPress={() => openEditCategory(selectedCategory)}
            accessibilityLabel={t.log.manageSelectedCategory}
            style={[styles.editButton, { borderColor: colors.surfaceBorder }]}
          >
            <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
            <Text style={[styles.editText, typography.button, { color: colors.primary }]}>
              {t.log.manageCategoryCta}
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
              holdLabel={t.log.manageSelectedCategory}
              accessibilityLabel={t.log.categoryA11y(category.name)}
              accessibilityState={{ selected: active }}
              haptic="selection"
              style={[
                styles.category,
                {
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? colors.primary : colors.surfaceBorder,
                  backgroundColor: active ? colors.primarySoft : colors.surfaceSolid,
                },
              ]}
            >
              <CategoryGlyph icon={category.icon} color={categoryColor} size={32} />
              <Text
                numberOfLines={2}
                style={[
                  styles.categoryText,
                  typography.button,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {category.name}
              </Text>
              {active ? (
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color={colors.primary}
                  accessible={false}
                />
              ) : null}
            </MotionPressable>
          );
        })}
        <MotionPressable
          onPress={openNewCategory}
          accessibilityLabel={t.log.addCategory}
          haptic="selection"
          style={[
            styles.category,
            styles.addCategory,
            { borderColor: colors.primary, backgroundColor: `${colors.primary}14` },
          ]}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
          <Text style={[styles.categoryText, typography.button, { color: colors.primary }]}>
            {t.log.addCategory}
          </Text>
        </MotionPressable>
      </View>

      <MotionPressable
        onPress={confirmTransaction}
        disabled={!vm.canConfirm}
        style={[
          styles.confirm,
          {
            backgroundColor: savedFeedback
              ? colors.positiveSoft
              : vm.canConfirm
                ? colors.primaryFill
                : colors.surfaceElevated,
            borderColor: savedFeedback
              ? colors.positive
              : vm.canConfirm
                ? colors.primary
                : colors.surfaceBorder,
            boxShadow: vm.canConfirm && !savedFeedback ? `0 8px 18px ${colors.shadow}` : "none",
          },
        ]}
        accessibilityLabel={t.log.confirmTransaction}
        accessibilityState={{ disabled: !vm.canConfirm }}
        haptic="medium"
      >
        <View accessible accessibilityLiveRegion="polite" style={styles.confirmContent}>
          <Animated.View
            key={savedFeedback ? "saved" : "confirm"}
            entering={reducedMotion ? undefined : FadeIn.duration(180)}
            exiting={reducedMotion ? undefined : FadeOut.duration(100)}
            style={styles.confirmContent}
          >
            {savedFeedback ? (
              <MaterialCommunityIcons name="check" size={19} color={colors.positive} />
            ) : null}
            <Text
              style={[
                styles.confirmText,
                typography.button,
                {
                  color: savedFeedback
                    ? colors.positive
                    : vm.canConfirm
                      ? colors.onPrimary
                      : colors.textMuted,
                },
              ]}
            >
              {savedFeedback ? t.log.transactionSaved : t.log.confirmTransactionCta}
            </Text>
          </Animated.View>
        </View>
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
      {Platform.OS === "ios" ? (
        <InputAccessoryView nativeID={amountAccessoryId}>
          <View
            style={[
              styles.keyboardAccessory,
              {
                backgroundColor: colors.surfaceSolid,
                borderTopColor: colors.surfaceBorder,
              },
            ]}
          >
            <MotionPressable
              onPress={Keyboard.dismiss}
              accessibilityLabel={t.common.done}
              style={[styles.keyboardDone, { backgroundColor: colors.primarySoft }]}
            >
              <Text style={[styles.keyboardDoneText, typography.button, { color: colors.primary }]}>
                {t.common.done}
              </Text>
            </MotionPressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  amountCard: {
    padding: tokens.spacing.lg,
    gap: tokens.spacing.md,
  },
  amountLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  amountInputRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  amountInputStack: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: 0,
  },
  amountPressable: {
    minHeight: 60,
  },
  currency: {
    fontSize: 26,
    lineHeight: 32,
  },
  amountInput: {
    flex: 1,
    minHeight: 56,
    padding: 0,
    fontSize: 44,
    lineHeight: 52,
    fontVariant: ["tabular-nums"],
  },
  amountInputStacked: {
    alignSelf: "stretch",
    width: "100%",
  },
  amountTimeMeaning: {
    flex: 1,
    fontSize: 31,
    lineHeight: 37,
  },
  categoryHeader: {
    marginTop: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.spacing.md,
  },
  categoryHeaderStack: {
    alignItems: "flex-start",
    flexDirection: "column",
    gap: tokens.spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  editButton: {
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
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
    maxWidth: "100%",
    minHeight: 48,
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
    flexShrink: 1,
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing.sm,
  },
  dateArrow: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: tokens.spacing.xs,
    gap: tokens.spacing.sm,
  },
  noteInput: {
    flex: 1,
    minHeight: 44,
    paddingVertical: tokens.spacing.sm,
    fontSize: 15,
    lineHeight: 20,
    textAlignVertical: "top",
  },
  clearNote: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  confirm: {
    minHeight: 52,
    borderRadius: tokens.radius.utility,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontSize: 14,
  },
  confirmContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  keyboardAccessory: {
    minHeight: 52,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  keyboardDone: {
    minWidth: 72,
    minHeight: 44,
    borderRadius: tokens.radius.utility,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.spacing.md,
  },
  keyboardDoneText: {
    fontSize: 14,
  },
});
