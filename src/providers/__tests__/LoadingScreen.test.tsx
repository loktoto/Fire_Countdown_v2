import { render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { tokens } from "../../design/tokens";
import { LoadingScreen } from "../LoadingScreen";

describe("LoadingScreen", () => {
  it("renders an English light-mode loading surface", () => {
    const { getByTestId, getByText } = render(
      <LoadingScreen colorScheme="light" locale="en-US" />,
    );

    expect(getByText("Loading…")).toBeTruthy();
    expect(StyleSheet.flatten(getByTestId("loading-screen").props.style).backgroundColor).toBe(
      tokens.color.offWhite,
    );
    expect(getByTestId("loading-indicator").props.color).toBe(tokens.color.lightCyan);
    expect(StyleSheet.flatten(getByTestId("loading-title").props.style).color).toBe(
      tokens.color.ink,
    );
  });

  it("renders a Traditional Chinese dark-mode loading surface", () => {
    const { getByTestId, getByText } = render(
      <LoadingScreen colorScheme="dark" locale="zh-Hant-HK" />,
    );

    expect(getByText("載入中…")).toBeTruthy();
    expect(StyleSheet.flatten(getByTestId("loading-screen").props.style).backgroundColor).toBe(
      tokens.color.obsidian,
    );
    expect(getByTestId("loading-indicator").props.color).toBe(tokens.color.cyan);
    expect(StyleSheet.flatten(getByTestId("loading-title").props.style).color).toBe("#F5F8F6");
  });
});
