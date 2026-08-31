import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Share, StyleSheet, Text, View } from "react-native";

import { MotionPressable } from "../components/MotionPressable";
import { useFireStore } from "../data/fireStore";
import { tokens } from "../design/tokens";
import { typography, useThemeColors } from "../design/theme";
import { useI18n } from "../i18n";
import { shareExportWithFallback } from "../utils/shareExport";

export function SnapshotRecoveryNotice() {
  const colors = useThemeColors();
  const t = useI18n();
  const { markSnapshotRecoveryExported, resetSeed, snapshotRecovery } = useFireStore();
  const [exporting, setExporting] = useState(false);

  if (!snapshotRecovery) {
    return null;
  }

  async function exportOriginalPayload() {
    if (!snapshotRecovery?.rawPayload || exporting) {
      return;
    }

    setExporting(true);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const title = t.recovery.exportTitle;
    try {
      const sharingAvailable = await Sharing.isAvailableAsync();
      const fileUri = `${FileSystem.cacheDirectory ?? ""}fire-countdown-recovery-${timestamp}.json`;
      await shareExportWithFallback({
        cacheDirectory: FileSystem.cacheDirectory,
        fileUri,
        message: snapshotRecovery.rawPayload,
        sharingAvailable,
        writeFile: async (uri, contents) => {
          await FileSystem.writeAsStringAsync(uri, contents, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        },
        shareFile: (uri) =>
          Sharing.shareAsync(uri, {
            dialogTitle: title,
            mimeType: "application/json",
            UTI: "public.json",
          }),
        shareText: (contents) => Share.share({ title, message: contents }),
      });
      markSnapshotRecoveryExported();
    } catch {
      Alert.alert(t.recovery.exportFailedTitle, t.recovery.exportFailedMessage);
    } finally {
      setExporting(false);
    }
  }

  function confirmReset() {
    Alert.alert(t.recovery.resetTitle, t.recovery.resetMessage, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.recovery.resetAction,
        style: "destructive",
        onPress: () => {
          if (!resetSeed()) {
            Alert.alert(t.recovery.resetFailedTitle, t.recovery.resetFailedMessage);
          }
        },
      },
    ]);
  }

  const versionCopy =
    snapshotRecovery.storedVersion !== null
      ? t.recovery.version(snapshotRecovery.storedVersion)
      : null;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent>
      <View style={[styles.scrim, { backgroundColor: colors.scrim }]}>
        <View
          accessibilityRole="alert"
          accessibilityViewIsModal
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceSolid,
              borderColor: colors.negative,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <View style={[styles.icon, { backgroundColor: colors.negativeSoft }]}>
            <Text style={styles.iconText}>!</Text>
          </View>
          <Text style={[styles.title, typography.title, { color: colors.text }]}>
            {t.recovery.title}
          </Text>
          <Text style={[styles.message, typography.body, { color: colors.textMuted }]}>
            {t.recovery.message}
          </Text>
          {versionCopy ? (
            <Text style={[styles.detail, typography.body, { color: colors.textMuted }]}>
              {versionCopy}
            </Text>
          ) : null}
          <Text style={[styles.detail, typography.body, { color: colors.textMuted }]}>
            {snapshotRecovery.quarantinePersisted
              ? t.recovery.quarantined
              : snapshotRecovery.exportedAt
                ? t.recovery.exported
                : t.recovery.exportFirst}
          </Text>
          <View style={styles.actions}>
            <MotionPressable
              onPress={() => void exportOriginalPayload()}
              disabled={!snapshotRecovery.rawPayload || exporting}
              accessibilityLabel={t.recovery.exportAction}
              accessibilityState={{ disabled: !snapshotRecovery.rawPayload || exporting }}
              style={[
                styles.action,
                {
                  borderColor: colors.primaryBorder,
                  backgroundColor: colors.primarySoft,
                  opacity: !snapshotRecovery.rawPayload || exporting ? 0.55 : 1,
                },
              ]}
            >
              {exporting ? <ActivityIndicator color={colors.primary} /> : null}
              <Text style={[styles.actionText, typography.button, { color: colors.primary }]}>
                {t.recovery.exportAction}
              </Text>
            </MotionPressable>
            <MotionPressable
              onPress={confirmReset}
              accessibilityLabel={t.recovery.resetAction}
              style={[
                styles.action,
                { borderColor: colors.negative, backgroundColor: colors.negativeSoft },
              ]}
            >
              <Text style={[styles.actionText, typography.button, { color: colors.negative }]}>
                {t.recovery.resetAction}
              </Text>
            </MotionPressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: "center",
    padding: tokens.spacing.lg,
  },
  card: {
    alignItems: "center",
    borderRadius: tokens.radius.card,
    borderWidth: 1,
    gap: tokens.spacing.sm,
    padding: tokens.spacing.lg,
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: tokens.radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    color: "#B42318",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 28,
  },
  title: {
    textAlign: "center",
  },
  message: {
    textAlign: "center",
  },
  detail: {
    textAlign: "center",
  },
  actions: {
    alignSelf: "stretch",
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.sm,
  },
  action: {
    minHeight: 48,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacing.xs,
  },
  actionText: {
    textAlign: "center",
  },
});
