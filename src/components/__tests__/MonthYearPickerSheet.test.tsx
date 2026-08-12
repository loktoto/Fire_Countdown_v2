import { fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { MonthYearPickerSheet } from "../MonthYearPickerSheet";

jest.mock("../FormBottomSheet", () => {
  const { View } = jest.requireActual("react-native");
  return {
    FormBottomSheet: ({ children }: { children: ReactNode }) => <View>{children}</View>,
  };
});

jest.mock("../MotionPressable", () => {
  const { Pressable } = jest.requireActual("react-native");
  return {
    MotionPressable: ({
      children,
      onPress,
      onLongPress,
      accessibilityLabel,
      accessibilityState,
    }: {
      children: ReactNode;
      onPress?: () => void;
      onLongPress?: () => void;
      accessibilityLabel?: string;
      accessibilityState?: { selected?: boolean };
    }) => (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
      >
        {children}
      </Pressable>
    ),
  };
});

jest.mock("../../design/theme", () => ({
  typography: { body: {}, button: {}, title: {} },
  useThemeColors: () => ({
    backgroundAlt: "#111B23",
    primary: "#59D4CD",
    primaryBorder: "#2A6D68",
    primarySoft: "#153936",
    surfaceBorder: "#28363F",
    text: "#F4F7F6",
    textMuted: "#A8B3B0",
  }),
}));

jest.mock("../../i18n", () => ({
  useI18n: () => ({
    locale: "en-HK",
    calendar: {
      title: "Calendar",
      chooseMonth: "Choose month and year",
      chooseMonthHint: "Choose a year, then a month.",
      closeMonthPicker: "Close month picker",
      previousYear: "Previous year",
      nextYear: "Next year",
      selectMonth: (value: string) => `Go to ${value}`,
    },
  }),
}));

describe("MonthYearPickerSheet", () => {
  it("changes year and returns the selected month", async () => {
    const onSelect = jest.fn();
    const screen = await render(
      <MonthYearPickerSheet
        visible
        selectedYear={2026}
        selectedMonth={8}
        onSelect={onSelect}
        onClose={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByLabelText("Next year"));
    await fireEvent.press(screen.getByLabelText("Go to January 2027"));

    expect(onSelect).toHaveBeenCalledWith(2027, 1);
  });

  it("jumps ten years on a long press", async () => {
    const screen = await render(
      <MonthYearPickerSheet
        visible
        selectedYear={2026}
        selectedMonth={8}
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    await fireEvent(screen.getByLabelText("Next year"), "longPress");

    expect(screen.getByText("2036")).toBeTruthy();
  });
});
