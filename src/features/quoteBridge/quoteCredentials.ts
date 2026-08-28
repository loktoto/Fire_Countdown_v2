import * as SecureStore from "expo-secure-store";

import type { QuoteProvider } from "../types";

// SecureStore keys cannot contain a colon on Android. Keep this stable so the
// credential can be saved and read consistently across Expo Go sessions.
const CUSTOM_BRIDGE_TOKEN_KEY = "fire-countdown-v2.quote-token";

async function saveSecureCredential(key: string, credential: string) {
  const normalized = credential.trim();
  if (!normalized) {
    throw new Error("API credential cannot be empty");
  }
  await SecureStore.setItemAsync(key, normalized);
}

export async function saveQuoteToken(token: string) {
  await saveSecureCredential(CUSTOM_BRIDGE_TOKEN_KEY, token);
}

export async function readQuoteToken() {
  return SecureStore.getItemAsync(CUSTOM_BRIDGE_TOKEN_KEY);
}

export async function clearQuoteToken() {
  await SecureStore.deleteItemAsync(CUSTOM_BRIDGE_TOKEN_KEY);
}

export async function saveQuoteCredential(provider: QuoteProvider, credential: string) {
  if (provider === "free_market") {
    throw new Error("Free quotes do not require an API credential");
  }
  return saveQuoteToken(credential);
}

export async function readQuoteCredential(provider: QuoteProvider) {
  return provider === "free_market" ? null : readQuoteToken();
}
