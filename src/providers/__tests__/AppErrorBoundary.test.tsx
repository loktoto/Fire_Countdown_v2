import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

import { AppErrorBoundary, errorRecoveryPresentation } from "../AppErrorBoundary";

describe("AppErrorBoundary", () => {
  it("shows a private localized recovery surface and retries the routed experience", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const onRetry = jest.fn();
    let shouldThrow = true;

    function RoutedExperience() {
      if (shouldThrow) {
        throw new Error("sensitive-account-value");
      }
      return <Text>Recovered route</Text>;
    }

    try {
      const { getByRole, getByTestId, getByText, queryByText } = await render(
        <AppErrorBoundary colorScheme="light" locale="en-HK" onRetry={onRetry}>
          <RoutedExperience />
        </AppErrorBoundary>,
      );

      expect(getByTestId("app-error-recovery")).toBeTruthy();
      expect(getByText("The app could not be displayed")).toBeTruthy();
      expect(getByText(/Settings → Export Data/)).toBeTruthy();
      expect(queryByText(/sensitive-account-value/)).toBeNull();

      shouldThrow = false;
      fireEvent.press(getByRole("button", { name: "Try again" }));

      await waitFor(() => {
        expect(getByText("Recovered route")).toBeTruthy();
      });
      expect(onRetry).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  it("provides Traditional Chinese recovery copy", () => {
    const presentation = errorRecoveryPresentation("dark", "zh-Hant-HK");

    expect(presentation.title).toBe("應用程式暫時無法顯示");
    expect(presentation.retry).toBe("重試");
    expect(presentation.guidance).toContain("匯出資料");
  });
});
