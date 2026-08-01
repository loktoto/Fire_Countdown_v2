import { act, renderHook } from "@testing-library/react-native";
import { Keyboard, Platform } from "react-native";

import { useKeyboardInset } from "../useKeyboardInset";

const showEvent = Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow";
const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

describe("useKeyboardInset", () => {
  afterEach(() => jest.restoreAllMocks());

  it("uses the live Keyboard metrics when the IME opens", async () => {
    const remove = jest.fn();
    const addListener = jest
      .spyOn(Keyboard, "addListener")
      .mockImplementation(() => ({ remove }) as never);
    jest.spyOn(Keyboard, "metrics").mockReturnValue({ height: 312 } as never);

    const { result } = await renderHook(() => useKeyboardInset());
    const onShow = addListener.mock.calls.find(([event]) => event === showEvent)?.[1];

    expect(onShow).toBeDefined();
    await act(async () => onShow?.({ endCoordinates: { height: 180 } } as never));

    expect(result.current).toBe(312);
  });

  it("falls back to the event height and clears the inset when the IME closes", async () => {
    const addListener = jest
      .spyOn(Keyboard, "addListener")
      .mockImplementation(() => ({ remove: jest.fn() }) as never);
    jest.spyOn(Keyboard, "metrics").mockReturnValue(undefined);

    const { result } = await renderHook(() => useKeyboardInset());
    const onShow = addListener.mock.calls.find(([event]) => event === showEvent)?.[1];
    const onHide = addListener.mock.calls.find(([event]) => event === hideEvent)?.[1];

    await act(async () => onShow?.({ endCoordinates: { height: 180 } } as never));
    expect(result.current).toBe(180);

    await act(async () => onHide?.({} as never));
    expect(result.current).toBe(0);
  });

  it("does not subscribe when keyboard awareness is disabled", async () => {
    const addListener = jest.spyOn(Keyboard, "addListener");

    const { result } = await renderHook(() => useKeyboardInset(false));

    expect(result.current).toBe(0);
    expect(addListener).not.toHaveBeenCalled();
  });

  it("removes both listeners on unmount", async () => {
    const showRemove = jest.fn();
    const hideRemove = jest.fn();
    const addListener = jest
      .spyOn(Keyboard, "addListener")
      .mockReturnValueOnce({ remove: showRemove } as never)
      .mockReturnValueOnce({ remove: hideRemove } as never);

    const { unmount } = await renderHook(() => useKeyboardInset());
    await act(async () => unmount());

    expect(addListener).toHaveBeenCalledTimes(2);
    expect(showRemove).toHaveBeenCalledTimes(1);
    expect(hideRemove).toHaveBeenCalledTimes(1);
  });
});
