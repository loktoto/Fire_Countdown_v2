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

import { MotionPressable } from "./MotionPressable";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import type { Asset, AssetClass, UpdateMethod } from "../features/types";

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
  { label: "Custom", value: "custom" },
];

const updateMethodOptions: { label: string; value: UpdateMethod }[] = [
  { label: "Manual", value: "manual" },
  { label: "Quote + backup", value: "google_sheet_quote" },
];

function normalizeNumberInput(raw: string, allowNegative = false) {
  const cleaned = raw.replace(",", ".").replace(allowNegative ? /[^\d.-]/g : /[^\d.]/g, "");
  const negative = allowNegative && cleaned.startsWith("-");
  const decimalParts = cleaned.replace(/-/g, "").split(".");
  const whole = decimalParts[0] ?? "";
  const decimals = decimalParts.slice(1).join("").slice(0, 4);
  const normalized = decimals.length > 0 ? `${whole}.${decimals}` : whole;
  return `${negative ? "-" : ""}${normalized}`.slice(0, 14);
}

function numberFromText(value: string, fallback = 0) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
}

export function AssetEditorSheet({
  visible,
  asset,
  onClose,
  onSave,
}: {
  visible: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSave: (assetId: string, patch: AssetPatch) => void;
}) {
  const colors = useThemeColors();

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
            { backgroundColor: colors.surfaceSolid, borderColor: colors.surfaceBorder },
          ]}
        >
          <AssetEditorContent key={asset.id} asset={asset} onClose={onClose} onSave={onSave} />
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AssetEditorContent({
  asset,
  onClose,
  onSave,
}: {
  asset: Asset;
  onClose: () => void;
  onSave: (assetId: string, patch: AssetPatch) => void;
}) {
  const colors = useThemeColors();
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
  const canSave = name.trim().length > 0 && numberFromText(manualValue) >= 0;

  function save() {
    if (!canSave) {
      return;
    }

    const normalizedTicker = ticker.trim();
    const normalizedQuoteSymbol = googleFinanceSymbol.trim();
    const normalizedNotes = notes.trim();
    const quantityValue = quantity.trim().length > 0 ? numberFromText(quantity) : null;

    onSave(asset.id, {
      name: name.trim(),
      assetClass,
      manualValue: numberFromText(manualValue),
      currency: currency.trim().length > 0 ? currency.trim().toUpperCase() : asset.currency,
      expectedAnnualReturn: numberFromText(expectedReturn) / 100,
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
          <Text style={[styles.kicker, typography.button, { color: colors.primary }]}>Asset</Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.title, typography.title, { color: colors.text }]}
          >
            Edit asset
          </Text>
        </View>
        <MotionPressable
          onPress={onClose}
          accessibilityLabel="Close asset editor"
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
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Asset name"
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
            accessibilityLabel="Asset name"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            Asset class
          </Text>
          <View style={styles.chipWrap}>
            {assetClassOptions.map((option) => {
              const active = option.value === assetClass;
              return (
                <MotionPressable
                  key={option.value}
                  onPress={() => setAssetClass(option.value)}
                  accessibilityLabel={`Asset class ${option.label}`}
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
                    {option.label}
                  </Text>
                </MotionPressable>
              );
            })}
          </View>
        </View>

        <View style={styles.splitFields}>
          <View style={styles.splitField}>
            <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
              Value
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
              accessibilityLabel="Asset value"
            />
          </View>
          <View style={styles.currencyField}>
            <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
              Currency
            </Text>
            <TextInput
              value={currency}
              onChangeText={(value) => setCurrency(value.toUpperCase().slice(0, 3))}
              maxLength={3}
              placeholder="HKD"
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
              accessibilityLabel="Asset currency"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            Expected return %
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
            accessibilityLabel="Expected annual return percent"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            Update method
          </Text>
          <View style={styles.chipWrap}>
            {updateMethodOptions.map((option) => {
              const active = option.value === updateMethod;
              return (
                <MotionPressable
                  key={option.value}
                  onPress={() => setUpdateMethod(option.value)}
                  accessibilityLabel={`Update method ${option.label}`}
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
                    {option.label}
                  </Text>
                </MotionPressable>
              );
            })}
          </View>
        </View>

        <View style={styles.splitFields}>
          <View style={styles.splitField}>
            <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
              Ticker
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
              accessibilityLabel="Asset ticker"
            />
          </View>
          <View style={styles.splitField}>
            <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
              Quote symbol
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
              accessibilityLabel="Google Finance symbol"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            Quantity
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
            accessibilityLabel="Asset quantity"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, typography.button, { color: colors.textMuted }]}>
            Notes
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            maxLength={160}
            multiline
            placeholder="No notes"
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
            accessibilityLabel="Asset notes"
          />
        </View>

        <MotionPressable
          onPress={() => setIncludeInFire((current) => !current)}
          accessibilityLabel={includeInFire ? "Exclude from FIRE" : "Include in FIRE"}
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
            {includeInFire ? "Included in FIRE" : "Excluded from FIRE"}
          </Text>
        </MotionPressable>

        <MotionPressable
          onPress={save}
          disabled={!canSave}
          accessibilityLabel="Save asset"
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
            SAVE ASSET
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
    minHeight: 40,
    borderWidth: 1,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: tokens.spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  choiceText: {
    fontSize: 13,
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
  currencyField: {
    width: 98,
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
});
