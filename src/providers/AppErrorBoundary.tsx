import {
  Component,
  Fragment,
  type ErrorInfo,
  type ReactNode,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  type ColorSchemeName,
} from "react-native";

import { tokens } from "../design/tokens";
import { systemLocale } from "./LoadingScreen";

type RecoveryCopy = {
  title: string;
  body: string;
  guidance: string;
  retry: string;
};

type BoundaryState = {
  hasError: boolean;
  retryKey: number;
};

type BoundaryStateProps = {
  children: ReactNode;
  colorScheme: ColorSchemeName;
  locale: string;
  onRetry?: () => void;
};

export type AppErrorBoundaryProps = {
  children: ReactNode;
  colorScheme?: ColorSchemeName;
  locale?: string;
  onRetry?: () => void;
};

function usesTraditionalChinese(locale: string) {
  const normalized = locale.trim().replaceAll("_", "-").toLowerCase();
  return (
    normalized.startsWith("zh-hant") ||
    normalized.startsWith("zh-hk") ||
    normalized.startsWith("zh-mo") ||
    normalized.startsWith("zh-tw")
  );
}

export function errorRecoveryPresentation(
  colorScheme: ColorSchemeName,
  locale: string,
) {
  const dark = colorScheme === "dark";
  const copy: RecoveryCopy = usesTraditionalChinese(locale)
    ? {
        title: "應用程式暫時無法顯示",
        body: "你的財務資料仍保存在這部裝置。請嘗試重新載入。",
        guidance:
          "如果問題持續，請重新開啟應用程式，然後到「設定」→「匯出資料」建立備份。此畫面不會顯示錯誤詳情。",
        retry: "重試",
      }
    : {
        title: "The app could not be displayed",
        body: "Your financial data remains on this device. Try loading the app again.",
        guidance:
          "If the problem continues, reopen the app and use Settings → Export Data to create a backup. Error details are not shown here.",
        retry: "Try again",
      };

  return {
    ...copy,
    backgroundColor: dark ? tokens.color.obsidian : tokens.color.offWhite,
    surfaceColor: dark ? tokens.color.obsidianSurface : tokens.color.offWhiteRaised,
    borderColor: dark ? tokens.color.darkBorder : tokens.color.lightBorder,
    titleColor: dark ? "#F5F8F6" : tokens.color.ink,
    bodyColor: dark ? "#C4CECB" : "#52635F",
    buttonColor: dark ? tokens.color.cyan : tokens.color.lightCyanFill,
    buttonTextColor: dark ? tokens.color.obsidian : "#FFFFFF",
  };
}

function ErrorRecoveryScreen({
  colorScheme,
  locale,
  onRetry,
}: {
  colorScheme: ColorSchemeName;
  locale: string;
  onRetry: () => void;
}) {
  const presentation = errorRecoveryPresentation(colorScheme, locale);

  return (
    <View
      testID="app-error-recovery"
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[styles.screen, { backgroundColor: presentation.backgroundColor }]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: presentation.surfaceColor,
            borderColor: presentation.borderColor,
          },
        ]}
      >
        <Text style={[styles.kicker, { color: presentation.buttonColor }]}>FIRE COUNTDOWN</Text>
        <Text style={[styles.title, { color: presentation.titleColor }]}>
          {presentation.title}
        </Text>
        <Text style={[styles.body, { color: presentation.bodyColor }]}>{presentation.body}</Text>
        <Text style={[styles.guidance, { color: presentation.bodyColor }]}>
          {presentation.guidance}
        </Text>
        <Pressable
          testID="app-error-retry"
          accessibilityRole="button"
          accessibilityLabel={presentation.retry}
          onPress={onRetry}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: presentation.buttonColor,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <Text style={[styles.buttonText, { color: presentation.buttonTextColor }]}>
            {presentation.retry}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

class AppErrorBoundaryState extends Component<BoundaryStateProps, BoundaryState> {
  state: BoundaryState = { hasError: false, retryKey: 0 };

  static getDerivedStateFromError(): Partial<BoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Intentionally local-only: do not log, transmit, or display potentially sensitive details.
  }

  private retry = () => {
    this.setState((state) => ({
      hasError: false,
      retryKey: state.retryKey + 1,
    }));
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorRecoveryScreen
          colorScheme={this.props.colorScheme}
          locale={this.props.locale}
          onRetry={this.retry}
        />
      );
    }

    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>;
  }
}

export function AppErrorBoundary({
  children,
  colorScheme,
  locale,
  onRetry,
}: AppErrorBoundaryProps) {
  const systemColorScheme = useColorScheme();

  return (
    <AppErrorBoundaryState
      colorScheme={colorScheme ?? systemColorScheme}
      locale={locale ?? systemLocale()}
      onRetry={onRetry}
    >
      {children}
    </AppErrorBoundaryState>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: 48,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderWidth: 1,
    borderRadius: tokens.radius.card,
    padding: tokens.spacing.xl,
    gap: tokens.spacing.md,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "700",
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
  },
  guidance: {
    fontSize: 14,
    lineHeight: 21,
  },
  button: {
    minHeight: 48,
    marginTop: tokens.spacing.sm,
    borderRadius: tokens.radius.utility,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: tokens.spacing.lg,
  },
  buttonText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
});
