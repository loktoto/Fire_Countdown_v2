import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Alert,
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
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryEditorSheet } from "../components/CategoryEditorSheet";
import { CategoryGlyph } from "../components/CategoryGlyph";
import { FireImpactCard } from "../components/FireImpactCard";
import { LogDatePickerSheet } from "../components/LogDatePickerSheet";
import { MotionPressable } from "../components/MotionPressable";
import { ScreenScaffold } from "../components/ScreenScaffold";
import { SegmentedControl } from "../components/SegmentedControl";
import { TimeLensValue } from "../components/TimeLens";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import {
  useLogEntryFlow,
  type LogEntrySaveResult,
} from "../features/logEntryFlow/LogEntryFlowContext";
import type { Category, RecurrenceFrequency } from "../features/types";
import { useLogViewModel } from "../hooks/useLogViewModel";
import { useI18n } from "../i18n";
import { formatCompactDateInputLabel, formatDateInputLabel, money } from "../utils/format";

export function LogScreen() {
  const colors = useThemeColors();
  const t = useI18n();
  const vm = useLogViewModel();
  const entryFlow = useLogEntryFlow();
  const { registerController, requestExit, updateStatus } = entryFlow;
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const amountRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const inputOffsets = useRef({ amountCard: 0, noteWithinCard: 0 });
  const entryActionsRef = useRef<{
    save: () => LogEntrySaveResult;
    showValidation: () => void;
    reset: () => void;
  }>({
    save: () => ({ saved: false }),
    showValidation: () => undefined,
    reset: () => undefined,
  });
  const [categorySheetVisible, setCategorySheetVisible] = useState(false);
  const [categoryPageIndex, setCategoryPageIndex] = useState(0);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [validationError, setValidationError] = useState<"amount" | "category" | null>(null);
  const [noteFocused, setNoteFocused] = useState(false);
  const stackAmount = width < 350 || fontScale > 1.35;
  const stackCategoryHeader = width < 340 || fontScale > 1.25;
  const amountAccessoryId = "log-amount-keyboard-actions";
  const shakeX = useSharedValue(0);
  const amountShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  const formattedDate = formatCompactDateInputLabel(vm.selectedDate, t.locale);
  const selectedDateLabel = vm.isTodaySelected
    ? `${t.common.today} · ${formattedDate}`
    : formattedDate;
  const typeAccent = vm.type === "expense" ? colors.negative : colors.positive;
  const typeAccentSoft = vm.type === "expense" ? colors.negativeSoft : colors.positiveSoft;
  const selectedCategory = vm.categories.find((category) => category.id === vm.categoryId) ?? null;
  const recurrenceOptions: { label: string; value: RecurrenceFrequency }[] = [
    { label: t.recurring.weekly, value: "weekly" },
    { label: t.recurring.biweekly, value: "biweekly" },
    { label: t.recurring.monthly, value: "monthly" },
    { label: t.recurring.yearly, value: "yearly" },
  ];

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => amountRef.current?.focus(), 260);
      return () => clearTimeout(timer);
    }, []),
  );

  useEffect(() => {
    registerController({
      save: () => entryActionsRef.current.save(),
      showValidation: () => entryActionsRef.current.showValidation(),
      reset: () => entryActionsRef.current.reset(),
    });
    return () => registerController(null);
  }, [registerController]);

  useEffect(() => {
    updateStatus({ canSave: vm.canConfirm, hasDraft: vm.hasDraft });
  }, [updateStatus, vm.canConfirm, vm.hasDraft]);

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
      return vm.updateCategory(categoryId, input);
    }
    return vm.createCategory(input);
  }

  function deleteCategory(categoryId: string) {
    const persisted = vm.archiveCategory(categoryId);
    if (persisted === false) {
      return false;
    }
    if (categoryId === vm.categoryId) {
      const nextCategory = vm.categories.find((category) => category.id !== categoryId);
      if (nextCategory) {
        vm.setCategoryId(nextCategory.id);
      }
    }
    return true;
  }

  function runNotificationHaptic(type: Haptics.NotificationFeedbackType) {
    if (!vm.hapticsEnabled) {
      return;
    }
    void Haptics.notificationAsync(type).catch(() => undefined);
  }

  function showValidation() {
    runNotificationHaptic(Haptics.NotificationFeedbackType.Error);
    if (vm.amount <= 0) {
      setValidationError("amount");
      // Reanimated shared values are intentionally mutable.
      shakeX.value = withSequence(
        withTiming(-7, { duration: 55, easing: Easing.out(Easing.quad) }),
        withTiming(7, { duration: 70 }),
        withTiming(-4, { duration: 60 }),
        withTiming(0, { duration: 65 }),
      );
      revealFocusedInput("amount");
      amountRef.current?.focus();
      return;
    }
    setValidationError("category");
  }

  function confirmTransaction(): LogEntrySaveResult {
    const wasRecurring = vm.recurringEnabled;
    const message = t.log.entryAdded(
      vm.type === "income" ? t.common.income : t.common.expense,
      money(vm.amount, vm.currency),
    );
    if (vm.confirm()) {
      AccessibilityInfo.announceForAccessibility(
        wasRecurring ? t.log.recurringTransactionSaved : message,
      );
      runNotificationHaptic(Haptics.NotificationFeedbackType.Success);
      setValidationError(null);
      Keyboard.dismiss();
      return { saved: true, message };
    }
    return { saved: false };
  }

  function resetEntry() {
    vm.resetDraft();
    setValidationError(null);
    Keyboard.dismiss();
  }

  function cancelEntry() {
    const discard = () => {
      resetEntry();
      requestExit();
    };
    if (!vm.hasDraft) {
      discard();
      return;
    }
    Alert.alert(t.log.discardEntryTitle, t.log.discardEntryBody, [
      { text: t.log.keepEditing, style: "cancel" },
      { text: t.log.discardEntry, style: "destructive", onPress: discard },
    ]);
  }

  entryActionsRef.current = {
    save: confirmTransaction,
    showValidation,
    reset: resetEntry,
  };

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

  function renderCategoryPicker() {
    const categoryEntries = [
      ...vm.categories.map((category) => ({ kind: "category" as const, category })),
      { kind: "add" as const },
    ];
    const categoryPageWidth = Math.max(280, width - 40);
    const categoryTileWidth = (categoryPageWidth - 24) / 4;
    const categoryPages = Array.from(
      { length: Math.ceil(categoryEntries.length / 8) },
      (_, pageIndex) => categoryEntries.slice(pageIndex * 8, pageIndex * 8 + 8),
    );
    const visibleCategoryPage = Math.min(categoryPageIndex, categoryPages.length - 1);
    const categoryRailHeight = (categoryPages[visibleCategoryPage]?.length ?? 0) > 4 ? 164 : 78;

    function renderCategoryEntry(entry: (typeof categoryEntries)[number]) {
      if (entry.kind === "add") {
        return (
          <MotionPressable
            key="add-category"
            onPress={openNewCategory}
            accessibilityLabel={t.log.addCategory}
            haptic="selection"
            style={[
              styles.category,
              styles.addCategory,
              { width: categoryTileWidth },
              { borderColor: colors.primary, backgroundColor: `${colors.primary}0D` },
            ]}
          >
            <MaterialCommunityIcons name="plus" size={23} color={colors.primary} />
            <Text
              numberOfLines={1}
              style={[styles.categoryText, typography.button, { color: colors.primary }]}
            >
              {t.log.addCategory}
            </Text>
          </MotionPressable>
        );
      }

      const { category } = entry;
      const active = category.id === vm.categoryId;
      const categoryColor = category.color ?? colors.primary;
      return (
        <MotionPressable
          key={category.id}
          onPress={() => {
            setValidationError(null);
            vm.setCategoryId(category.id);
          }}
          onLongPress={() => openEditCategory(category)}
          holdLabel={t.log.manageSelectedCategory}
          accessibilityLabel={t.log.categoryA11y(category.name)}
          accessibilityState={{ selected: active }}
          haptic="selection"
          style={[
            styles.category,
            { width: categoryTileWidth },
            {
              borderWidth: active ? 2 : 1,
              borderColor: active ? colors.primary : colors.surfaceBorder,
              backgroundColor: active ? colors.primarySoft : colors.surfaceSolid,
            },
          ]}
        >
          <CategoryGlyph icon={category.icon} color={categoryColor} size={26} />
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.categoryText, typography.button, { color: colors.text }]}
          >
            {category.name}
          </Text>
        </MotionPressable>
      );
    }

    return (
      <View style={styles.categorySection}>
        <View style={[styles.categoryHeader, stackCategoryHeader && styles.categoryHeaderStack]}>
          <Text style={[styles.sectionEyebrow, typography.button, { color: colors.textMuted }]}>
            {t.common.category}
          </Text>
          {selectedCategory ? (
            <MotionPressable
              onPress={() => openEditCategory(selectedCategory)}
              accessibilityLabel={t.log.manageSelectedCategory}
              style={styles.editButton}
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
              <Text style={[styles.editText, typography.button, { color: colors.primary }]}>
                {t.log.manageCategoryCta}
              </Text>
            </MotionPressable>
          ) : null}
        </View>
        <View style={{ height: categoryRailHeight, overflow: "hidden" }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={categoryPageWidth + 8}
            scrollEventThrottle={16}
            onScroll={({ nativeEvent }) => {
              const nextPage = Math.round(
                nativeEvent.contentOffset.x / Math.max(1, categoryPageWidth + 8),
              );
              const clampedPage = Math.max(0, Math.min(nextPage, categoryPages.length - 1));
              setCategoryPageIndex((currentPage) =>
                currentPage === clampedPage ? currentPage : clampedPage,
              );
            }}
            contentContainerStyle={styles.categoryWrap}
          >
            {categoryPages.map((page, pageIndex) => (
              <View
                key={`category-page-${pageIndex}`}
                style={[styles.categoryPage, { width: categoryPageWidth }]}
              >
                <View style={styles.categoryRow}>{page.slice(0, 4).map(renderCategoryEntry)}</View>
                {page.length > 4 ? (
                  <View style={styles.categoryRow}>
                    {page.slice(4, 8).map(renderCategoryEntry)}
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>
        {validationError === "category" ? (
          <Text
            accessibilityLiveRegion="assertive"
            style={[styles.fieldError, typography.bodyMedium, { color: colors.negative }]}
          >
            {t.log.selectCategoryError}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.screenRoot}>
      <ScreenScaffold keyboardAware scrollRef={scrollRef}>
        <Animated.View
          style={amountShakeStyle}
          onLayout={({ nativeEvent }) => {
            inputOffsets.current.amountCard = nativeEvent.layout.y;
          }}
        >
          <View style={styles.entryFields}>
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
                    setValidationError(null);
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
            {validationError === "amount" ? (
              <Text
                accessibilityLiveRegion="assertive"
                style={[styles.fieldError, typography.bodyMedium, { color: colors.negative }]}
              >
                {t.log.enterAmountError}
              </Text>
            ) : null}
            <SegmentedControl
              value={vm.type}
              onChange={(type) => {
                setValidationError(null);
                vm.setType(type);
              }}
              activeColor={typeAccent}
              activeSoftColor={typeAccentSoft}
              options={[
                {
                  label: t.common.expense,
                  value: "expense",
                  color: colors.negative,
                  icon: "arrow-down",
                  softColor: colors.negativeSoft,
                },
                {
                  label: t.common.income,
                  value: "income",
                  color: colors.positive,
                  icon: "arrow-up",
                  softColor: colors.positiveSoft,
                },
              ]}
            />
            {renderCategoryPicker()}
            <View style={styles.scheduleSection}>
              <Text style={[styles.sectionEyebrow, typography.button, { color: colors.textMuted }]}>
                {t.log.schedule}
              </Text>
              <View
                style={[
                  styles.scheduleCard,
                  { backgroundColor: colors.surfaceSolid, borderColor: colors.surfaceBorder },
                ]}
              >
                <View style={styles.scheduleRow}>
                  <MotionPressable
                    onPress={() => setDatePickerVisible(true)}
                    accessibilityLabel={t.log.pickTransactionDay}
                    haptic="selection"
                    style={styles.scheduleDateAction}
                  >
                    <View style={[styles.scheduleIcon, { backgroundColor: colors.primarySoft }]}>
                      <MaterialCommunityIcons
                        name="calendar-month-outline"
                        size={21}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[styles.scheduleDate, typography.button, { color: colors.text }]}
                    >
                      {selectedDateLabel}
                    </Text>
                  </MotionPressable>
                  <MotionPressable
                    onPress={() => vm.setRecurringEnabled(!vm.recurringEnabled)}
                    accessibilityLabel={t.log.repeatEntry}
                    accessibilityState={{ expanded: vm.recurringEnabled }}
                    haptic="selection"
                    style={styles.scheduleRepeatAction}
                  >
                    <Text
                      numberOfLines={1}
                      style={[styles.scheduleMeta, typography.body, { color: colors.textMuted }]}
                    >
                      {vm.recurringEnabled
                        ? (recurrenceOptions.find(
                            (option) => option.value === vm.recurringFrequency,
                          )?.label ?? t.recurring.monthly)
                        : t.log.oneTimeEntry}
                    </Text>
                    <MaterialCommunityIcons
                      name={vm.recurringEnabled ? "chevron-down" : "chevron-right"}
                      size={23}
                      color={colors.primary}
                    />
                  </MotionPressable>
                </View>
                {vm.recurringEnabled ? (
                  <View style={styles.recurringControls}>
                    <SegmentedControl
                      value={vm.recurringFrequency}
                      onChange={vm.setRecurringFrequency}
                      options={recurrenceOptions}
                    />
                    <Text
                      style={[styles.recurringHint, typography.body, { color: colors.textMuted }]}
                    >
                      {t.log.repeatHint(formatDateInputLabel(vm.selectedDate, t.locale))}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={styles.noteSection}>
              <Text style={[styles.sectionEyebrow, typography.button, { color: colors.textMuted }]}>
                {t.log.transactionNote}
              </Text>
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
                <View style={[styles.noteIcon, { backgroundColor: colors.primarySoft }]}>
                  <MaterialCommunityIcons
                    name="note-text-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
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
            </View>
          </View>
        </Animated.View>

        <FireImpactCard amount={vm.amount} impact={vm.impact} />

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
                <Text
                  style={[styles.keyboardDoneText, typography.button, { color: colors.primary }]}
                >
                  {t.common.done}
                </Text>
              </MotionPressable>
            </View>
          </InputAccessoryView>
        ) : null}
      </ScreenScaffold>
      <MotionPressable
        onPress={cancelEntry}
        accessibilityLabel={t.log.cancelEntry}
        haptic="selection"
        style={[
          styles.cancelButton,
          {
            top: Math.max(insets.top + 12, tokens.spacing.lg),
            backgroundColor: colors.backgroundAlt,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        <MaterialCommunityIcons name="close" size={22} color={colors.textMuted} />
      </MotionPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1 },
  cancelButton: {
    position: "absolute",
    right: 84,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  entryFields: { gap: 16 },
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
  fieldError: { marginTop: -8, fontSize: 13, lineHeight: 18 },
  categorySection: { gap: 10, paddingTop: 2 },
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
  editButton: {
    minHeight: 40,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editText: {
    fontSize: 13,
  },
  categoryWrap: {
    flexDirection: "row",
    gap: 8,
    paddingRight: tokens.spacing.md,
  },
  categoryPage: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
  },
  category: {
    height: 78,
    borderWidth: 1,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: 7,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  categoryText: {
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    textTransform: "capitalize",
  },
  addCategory: {},
  scheduleSection: { gap: 8 },
  sectionEyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.35,
    textTransform: "uppercase",
  },
  scheduleCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    overflow: "hidden",
  },
  scheduleRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scheduleDateAction: {
    flex: 1,
    minWidth: 0,
    minHeight: 68,
    paddingLeft: tokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  scheduleRepeatAction: {
    minHeight: 68,
    maxWidth: "42%",
    paddingLeft: tokens.spacing.sm,
    paddingRight: tokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  scheduleIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleDate: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 19 },
  scheduleMeta: { fontSize: 13, lineHeight: 18 },
  noteSection: { gap: 8 },
  noteInline: {
    minHeight: 64,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: tokens.radius.utility,
    paddingHorizontal: tokens.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 11,
  },
  noteIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  noteInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 96,
    paddingVertical: 11,
    fontSize: 14,
    lineHeight: 19,
    textAlignVertical: "top",
  },
  clearNote: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  recurringControls: {
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingBottom: tokens.spacing.sm,
  },
  recurringHint: { fontSize: 13, lineHeight: 18 },
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
