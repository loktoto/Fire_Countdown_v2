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

import { MotionPressable } from "./MotionPressable";
import { sheetBackdropEnter, sheetBackdropExit, sheetEnter, sheetExit } from "../design/motion";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { Asset, AssetClass, UpdateMethod } from "../features/types";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useI18n } from "../i18n";

type AssetPatch = Partial<
  Pick<
    Asset,
    | "assetClass"
    | "currency"
    | "expectedAnnualReturn"
    | "googleFinanceSymbol"
    | "includeInFire"
    | "manualValue"
    | "name"
    | "notes"
    | "quantity"
    | "ticker"
    | "updateMethod"
  >
>;

const assetClassOptions: { label: string; value: AssetClass }[] = [
  { label: "Cash", value: "cash" },
  { label: "ETF", value: "etf" },
  { label: "Stock", value: "stock" },
  { label: "Crypto", value: "crypto" },
  { label: "Bond", value: "bond" },
  { label: "Real estate", value: "real_estate" },
  { label: "Pension", value: "pension" },
  { label: "Private investment", value: "private_investment" },
  { label: "Business", value: "business" },
  { label: "Custom", value: "custom" },
];

const updateMethodOptions: { label: string; value: UpdateMethod }[] = [
  { label: "Manual", value: "manual" },
  { label: "Auto quote", value: "google_sheet_quote" },
];
const baseCurrencyOptions = ["HKD", "USD", "TWD", "JPY", "EUR", "GBP", "CNY", "SGD"];

function normalizeNumberInput(raw: string, allowNegative = false) {
  const cleaned = raw.replace(",", ".").replace(allowNegative ? /[^\d.-]/g : /[^\d.]/g, "");
  const negative = allowNegative && cleaned.startsWith("-");
  const decimalParts = cleaned.replace(/-/g, "").split(".");
  const whole = decimalParts[0] ?? "";
  const decimals = decimalParts.slice(1).join("").slice(0, 4);
  const normalized = decimals.length > 0 ? `${whole}.${decimals}` : whole;
  return `${negative ? "-" : ""}${normalized}`.slice(0, 14);
}

export function AssetEditorSheet({
  visible,
  asset,
  isCreating = false,
  onClose,
  onSave,
  onArchive,
}: {
  visible: boolean;
  asset: Asset | null;
  isCreating?: boolean;
  onClose: () => void;
  onSave: (assetId: string, patch: AssetPatch) => void;
  onArchive?: (assetId: string) => void;
}) {
  const colors = useThemeColors();
  const reducedMotion = useReducedMotion();

  if (!visible || !asset) {
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
            { backgroundColor: colors.surfaceSolid, borderColor: colors.surfaceBorder },
          ]}
        >
          <AssetEditorContent
            key={asset.id}
            asset={asset}
            isCreating={isCreating}
            onClose={onClose}
            onSave={onSave}
            onArchive={onArchive}
          />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AssetEditorContent({
  asset,
  isCreating,
  onClose,
  onSave,
  onArchive,
}: {
  asset: Asset;
  isCreating: boolean;
  onClose: () => void;
  onSave: (assetId: string, patch: AssetPatch) => void;
  onArchive?: (assetId: string) => void;
}) {
  const colors = useThemeColors();
  const t = useI18n();
  const [name, setName] = useState(asset.name);
  const [assetClass, setAssetClass] = useState<AssetClass>(asset.assetClass);
  const [manualValue, setManualValue] = useState(String(asset.manualValue ?? 0));
  const [currency, setCurrency] = useState(asset.currency);
  const [expectedReturn, setExpectedReturn] = useState(
    (asset.expectedAnnualReturn * 100).toFixed(2).replace(/\.?0+$/, ""),
  );
  const [updateMethod, setUpdateMethod] = useState<UpdateMethod>(
    asset.updateMethod === "hybrid" ? "google_sheet_quote" : asset.updateMethod,
  );
  const [googleFinanceSymbol, setGoogleFinanceSymbol] = useState(asset.googleFinanceSymbol ?? "");
  const [ticker, setTicker] = useState(asset.ticker ?? "");
  const [quantity, setQuantity] = useState(asset.quantity == null ? "" : String(asset.quantity));
  const [includeInFire, setIncludeInFire] = useState(asset.includeInFire);
  const [notes, setNotes] = useState(asset.notes ?? "");
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const manualValueNumber = Number.parseFloat(manualValue);
  const expectedReturnNumber = Number.parseFloat(expectedReturn);
  const quantityNumber = quantity.trim().length > 0 ? Number.parseFloat(quantity) : null;
  const hasQuoteIdentity = googleFinanceSymbol.trim().length > 0 || ticker.trim().length > 0;
  const normalizedCurrency = currency.trim().toUpperCase().slice(0, 3);
  const canSave =
    name.trim().length > 0 &&
    Number.isFinite(manualValueNumber) &&
    manualValueNumber >= 0 &&
    Number.isFinite(expectedReturnNumber) &&
    expectedReturnNumber > -95 &&
    expectedReturnNumber <= 1000 &&
    /^[A-Z]{3}$/.test(normalizedCurrency) &&
    (updateMethod === "manual" ||
      (hasQuoteIdentity &&
        quantityNumber !== null &&
        Number.isFinite(quantityNumber) &&
        quantityNumber > 0));
  const currencyOptions =
    normalizedCurrency && !baseCurrencyOptions.includes(normalizedCurrency)
      ? [normalizedCurrency, ...baseCurrencyOptions]
      : baseCurrencyOptions;

  function save() {
    if (!canSave) {
      return;
    }

    const normalizedTicker = ticker.trim();
    const normalizedQuoteSymbol = googleFinanceSymbol.trim();
    const normalizedNotes = notes.trim();
    const quantityValue = quantityNumber;

    onSave(asset.id, {
      name: name.trim(),
      assetClass,
      manualValue: manualValueNumber,
      currency: normalizedCurrency,
      expectedAnnualReturn: expectedReturnNumber / 100,
      updateMethod,
      ticker: normalizedTicker.length > 0 ? normalizedTicker : null,
      googleFinanceSymbol: normalizedQuoteSymbol.length > 0 ? normalizedQuoteSymbol : null,
      quantity: quantityValue,
      includeInFire,
      notes: normalizedNotes.length > 0 ? normalizedNotes : null,
    });
    onClose();
  }

  return (
    <>
      <View style={[styles.grabber, { backgroundColor: colors.surfaceBorder }]} />
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.kicker, typography.button, { color: colors.primary }]}>
            {t.assets.asset}
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.title, typography.title, { color: colors.text }]}
          >
            {isCreating ? t.assets.addAsset : t.assets.editAsset}
          </Text>
        </View>
        <MotionPressable
          onPress={onClose}
          accessibilityLabel={t.assets.closeEditor}
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
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            {t.assets.name}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t.assets.assetName}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            style={[
              styles.input,
              typography.title,
              {
                color: colors.text,
                borderColor: canSave ? colors.surfaceBorder : colors.negative,
                backgroundColor: colors.backgroundAlt,
              },
            ]}
            accessibilityLabel={t.assets.assetName}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            {t.assets.assetClass}
          </Text>
          <View style={styles.chipWrap}>
            {assetClassOptions.map((option) => {
              const active = option.value === assetClass;
              const label =
                option.value === "real_estate"
                  ? t.assets.classOptions.realEstate
                  : option.value === "cash"
                    ? t.assets.classOptions.cash
                    : option.value === "etf"
                      ? t.assets.classOptions.etf
                      : option.value === "stock"
                        ? t.assets.classOptions.stock
                        : option.value === "crypto"
                          ? t.assets.classOptions.crypto
                          : option.value === "bond"
                            ? t.assets.classOptions.bond
                            : option.value === "pension"
                              ? t.assets.classOptions.pension
                              : option.value === "private_investment"
                                ? t.assets.classOptions.privateInvestment
                                : option.value === "business"
                                  ? t.assets.classOptions.business
                                  : t.assets.classOptions.custom;
              return (
                <MotionPressable
                  key={option.value}
                  onPress={() => setAssetClass(option.value)}
                  accessibilityLabel={`${t.assets.assetClass} ${label}`}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.choiceChip,
                    {
                      borderColor: active ? colors.primary : colors.surfaceBorder,
                      backgroundColor: active ? `${colors.primary}18` : colors.backgroundAlt,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      typography.button,
                      { color: active ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {label}
                  </Text>
                </MotionPressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            {t.assets.value}
          </Text>
          <TextInput
            value={manualValue}
            onChangeText={(value) => setManualValue(normalizeNumberInput(value))}
            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
            inputMode="decimal"
            selectTextOnFocus
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            style={[
              styles.input,
              typography.body,
              {
                color: colors.text,
                borderColor: colors.surfaceBorder,
                backgroundColor: colors.backgroundAlt,
              },
            ]}
            accessibilityLabel={t.assets.assetValue}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            {t.assets.currency}
          </Text>
          <View style={styles.chipWrap}>
            {currencyOptions.map((option) => {
              const active = option === normalizedCurrency;
              return (
                <MotionPressable
                  key={option}
                  onPress={() => setCurrency(option)}
                  accessibilityLabel={`${t.assets.assetCurrency} ${option}`}
                  accessibilityState={{ selected: active }}
                  haptic="selection"
                  style={[
                    styles.currencyChip,
                    {
                      borderColor: active ? colors.primary : colors.surfaceBorder,
                      backgroundColor: active ? `${colors.primary}18` : colors.backgroundAlt,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      typography.button,
                      { color: active ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {option}
                  </Text>
                </MotionPressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            {t.assets.expectedReturn}
          </Text>
          <TextInput
            value={expectedReturn}
            onChangeText={(value) => setExpectedReturn(normalizeNumberInput(value, true))}
            keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
            inputMode="decimal"
            selectTextOnFocus
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            style={[
              styles.input,
              typography.body,
              {
                color: colors.text,
                borderColor: colors.surfaceBorder,
                backgroundColor: colors.backgroundAlt,
              },
            ]}
            accessibilityLabel={t.assets.expectedAnnualReturnPercent}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            {t.assets.updateMethod}
          </Text>
          <View style={styles.chipWrap}>
            {updateMethodOptions.map((option) => {
              const active = option.value === updateMethod;
              const label =
                option.value === "manual"
                  ? t.assets.updateMethods.manual
                  : t.assets.updateMethods.quoteBackup;
              return (
                <MotionPressable
                  key={option.value}
                  onPress={() => setUpdateMethod(option.value)}
                  accessibilityLabel={`${t.assets.updateMethod} ${label}`}
                  accessibilityState={{ selected: active }}
                  style={[
                    styles.choiceChip,
                    {
                      borderColor: active ? colors.primary : colors.surfaceBorder,
                      backgroundColor: active ? `${colors.primary}18` : colors.backgroundAlt,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      typography.button,
                      { color: active ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {label}
                  </Text>
                </MotionPressable>
              );
            })}
          </View>
          <Text style={[styles.helperText, typography.body, { color: colors.textMuted }]}>
            {updateMethod === "manual"
              ? t.assets.updateMethodHelp.manual
              : t.assets.updateMethodHelp.autoQuote}
          </Text>
        </View>

        <View style={styles.splitFields}>
          <View style={styles.splitField}>
            <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
              {t.assets.ticker}
            </Text>
            <TextInput
              value={ticker}
              onChangeText={(value) => setTicker(value.toUpperCase())}
              autoCapitalize="characters"
              placeholder="VOO"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              style={[
                styles.input,
                typography.body,
                {
                  color: colors.text,
                  borderColor: colors.surfaceBorder,
                  backgroundColor: colors.backgroundAlt,
                },
              ]}
              accessibilityLabel={t.assets.assetTicker}
            />
          </View>
          <View style={styles.splitField}>
            <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
              {t.assets.quoteSymbol}
            </Text>
            <TextInput
              value={googleFinanceSymbol}
              onChangeText={setGoogleFinanceSymbol}
              autoCapitalize="characters"
              placeholder="NYSEARCA:VOO"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              style={[
                styles.input,
                typography.body,
                {
                  color: colors.text,
                  borderColor: colors.surfaceBorder,
                  backgroundColor: colors.backgroundAlt,
                },
              ]}
              accessibilityLabel={t.assets.googleFinanceSymbol}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            {t.assets.quantity}
          </Text>
          <TextInput
            value={quantity}
            onChangeText={(value) => setQuantity(normalizeNumberInput(value))}
            keyboardType={Platform.OS === "ios" ? "decimal-pad" : "numeric"}
            inputMode="decimal"
            placeholder="-"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            style={[
              styles.input,
              typography.body,
              {
                color: colors.text,
                borderColor: colors.surfaceBorder,
                backgroundColor: colors.backgroundAlt,
              },
            ]}
            accessibilityLabel={t.assets.assetQuantity}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            {t.common.notes}
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            maxLength={160}
            multiline
            placeholder={t.assets.noNotes}
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
            accessibilityLabel={t.assets.assetNotes}
          />
        </View>

        <MotionPressable
          onPress={() => setIncludeInFire((current) => !current)}
          accessibilityLabel={includeInFire ? t.assets.excludeFromFire : t.assets.includeInFire}
          accessibilityState={{ selected: includeInFire }}
          style={[
            styles.includeToggle,
            {
              borderColor: includeInFire ? colors.positive : colors.surfaceBorder,
              backgroundColor: includeInFire ? `${colors.positive}16` : colors.backgroundAlt,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={includeInFire ? "check-circle-outline" : "circle-outline"}
            size={20}
            color={includeInFire ? colors.positive : colors.textMuted}
          />
          <Text
            style={[
              styles.includeText,
              typography.button,
              { color: includeInFire ? colors.positive : colors.textMuted },
            ]}
          >
            {includeInFire ? t.assets.includedInFire : t.assets.excludedFromFire}
          </Text>
        </MotionPressable>

        <MotionPressable
          onPress={save}
          disabled={!canSave}
          accessibilityLabel={t.assets.saveAsset}
          accessibilityState={{ disabled: !canSave }}
          style={[
            styles.save,
            { backgroundColor: canSave ? colors.primary : colors.surfaceBorder },
          ]}
        >
          <Text
            style={[
              styles.saveText,
              typography.button,
              { color: canSave ? colors.onPrimary : colors.textMuted },
            ]}
          >
            {t.assets.saveAssetCta}
          </Text>
        </MotionPressable>

        {onArchive ? (
          <MotionPressable
            onPress={() => {
              if (!confirmingArchive) {
                setConfirmingArchive(true);
                return;
              }
              onArchive(asset.id);
              onClose();
            }}
            accessibilityLabel={
              confirmingArchive ? t.assets.confirmDeleteAsset : t.assets.deleteAsset
            }
            accessibilityHint={confirmingArchive ? t.common.tapAgainToConfirm : undefined}
            style={[
              styles.archive,
              {
                borderColor: colors.negative,
                backgroundColor: confirmingArchive ? `${colors.negative}24` : "transparent",
              },
            ]}
          >
            <Text style={[styles.archiveText, typography.button, { color: colors.negative }]}>
              {confirmingArchive ? t.assets.confirmDeleteAsset : t.assets.deleteAsset}
            </Text>
          </MotionPressable>
        ) : null}
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
    maxHeight: "90%",
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
    gap: tokens.spacing.md,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
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
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.spacing.sm,
  },
  choiceChip: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceText: {
    fontSize: 13,
  },
  currencyChip: {
    minWidth: 72,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
  },
  splitFields: {
    flexDirection: "row",
    gap: tokens.spacing.sm,
  },
  splitField: {
    flex: 1,
    minWidth: 0,
    gap: tokens.spacing.sm,
  },
  includeToggle: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.sm,
  },
  includeText: {
    fontSize: 13,
  },
  save: {
    minHeight: 54,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    fontSize: 14,
  },
  archive: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  archiveText: {
    fontSize: 14,
  },
});
