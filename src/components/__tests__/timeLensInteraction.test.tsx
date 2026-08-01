import { fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AccessibilityInfo } from "react-native";

import { TimeLensProvider, TimeLensValue } from "../TimeLens";
import { FireStoreProvider } from "../../data/fireStore";

jest.mock("react-native-reanimated", () => {
  const ReactNative = jest.requireActual<typeof import("react-native")>("react-native");
  const transition: { duration: jest.Mock; easing: jest.Mock } = {
    duration: jest.fn(),
    easing: jest.fn(),
  };
  transition.duration.mockImplementation(() => transition);
  transition.easing.mockImplementation(() => transition);
  return {
    __esModule: true,
    default: {
      Text: ReactNative.Text,
      View: ReactNative.View,
      createAnimatedComponent: (component: unknown) => component,
    },
    Easing: { out: (value: unknown) => value, cubic: "cubic" },
    FadeIn: transition,
    FadeOut: transition,
    useAnimatedStyle: (factory: () => unknown) => factory(),
    useSharedValue: (value: number) => ({ value }),
    withSpring: (value: number) => value,
    withTiming: (value: number) => value,
  };
});
jest.mock("react-native-gesture-handler", () => {
  const ReactNative = jest.requireActual<typeof import("react-native")>("react-native");
  const gesture: Record<string, jest.Mock> = {
    activateAfterLongPress: jest.fn(),
    onStart: jest.fn(),
    onUpdate: jest.fn(),
    onFinalize: jest.fn(),
    runOnJS: jest.fn(),
  };
  Object.values(gesture).forEach((method) => method.mockImplementation(() => gesture));
  return {
    Gesture: { Pan: () => gesture },
    GestureDetector: ({ children }: { children: ReactNode }) => children,
    GestureHandlerRootView: ReactNative.View,
  };
});
jest.mock("expo-blur", () => ({
  BlurView: jest.requireActual<typeof import("react-native")>("react-native").View,
}));
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
}));

describe("TimeLensValue", () => {
  it("exposes the time meaning as a screen-reader context action", async () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation();
    const { getByTestId } = await render(
      <FireStoreProvider>
        <TimeLensProvider>
          <TimeLensValue
            testID="asset-value"
            amount={267_910}
            moneyText="HKD 267,910"
            kind="asset"
          />
        </TimeLensProvider>
      </FireStoreProvider>,
    );

    const value = getByTestId("asset-value");
    expect(value.props.accessibilityActions).toContainEqual({
      name: "viewTimeMeaning",
      label: "View time meaning",
    });

    await fireEvent(value, "accessibilityAction", {
      nativeEvent: { actionName: "viewTimeMeaning" },
    });

    expect(announce).toHaveBeenCalledWith(expect.stringContaining("Last Workday"));
    announce.mockRestore();
  });
});
