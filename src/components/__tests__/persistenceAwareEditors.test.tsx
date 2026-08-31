import { fireEvent, render } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { FireStoreProvider } from "../../data/fireStore";
import { seedSnapshot } from "../../data/seed";
import { AssetEditorSheet } from "../AssetEditorSheet";

jest.mock("../FormBottomSheet", () => {
  const { View } = jest.requireActual("react-native");
  return {
    FormBottomSheet: ({ children, footer }: { children: ReactNode; footer?: ReactNode }) => (
      <View>
        {children}
        {footer}
      </View>
    ),
  };
});

jest.mock("../MotionPressable", () => {
  const { Pressable } = jest.requireActual("react-native");
  return {
    MotionPressable: ({ children, ...props }: { children: ReactNode }) => (
      <Pressable {...props}>{children}</Pressable>
    ),
  };
});

jest.mock("../../i18n", () => ({
  useI18n: () => jest.requireActual("../../i18n/en").en,
}));

function wrapper({ children }: { children: ReactNode }) {
  return <FireStoreProvider>{children}</FireStoreProvider>;
}

describe("persistence-aware financial editors", () => {
  it("keeps an asset draft open when persistence fails", async () => {
    const onClose = jest.fn();
    const onSave = jest.fn(() => false);
    const screen = await render(
      <AssetEditorSheet
        visible
        asset={seedSnapshot.assets[0]!}
        onClose={onClose}
        onSave={onSave}
      />,
      { wrapper },
    );

    await fireEvent.press(screen.getByLabelText("Save asset"));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes an asset draft after the write succeeds", async () => {
    const onClose = jest.fn();
    const onSave = jest.fn(() => true);
    const screen = await render(
      <AssetEditorSheet
        visible
        asset={seedSnapshot.assets[0]!}
        onClose={onClose}
        onSave={onSave}
      />,
      { wrapper },
    );

    await fireEvent.press(screen.getByLabelText("Save asset"));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
