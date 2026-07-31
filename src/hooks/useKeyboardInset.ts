import { Keyboard, Platform } from "react-native";
import { useEffect, useState } from "react";

/** Returns the live system IME inset reported by React Native's Keyboard API. */
export function useKeyboardInset(enabled = true) {
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const updateInset = (height: number) => {
      setKeyboardInset(Math.max(0, height));
    };
    const showEvent = Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      updateInset(Keyboard.metrics()?.height ?? event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => updateInset(0));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [enabled]);

  return enabled ? keyboardInset : 0;
}
