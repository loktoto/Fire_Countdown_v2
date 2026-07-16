import NetInfo from "@react-native-community/netinfo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { createElement, type ReactNode } from "react";

import { useFireStore } from "../../data/fireStore";
import { seedSnapshot } from "../../data/seed";
import { getPortfolioQuotes } from "../../features/quoteBridge/client";
import { useQuoteRefresh } from "../useQuoteRefresh";

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: { fetch: jest.fn() },
}));
jest.mock("../../data/fireStore", () => ({ useFireStore: jest.fn() }));
jest.mock("../../features/quoteBridge/client", () => ({ getPortfolioQuotes: jest.fn() }));

const useFireStoreMock = useFireStore as jest.Mock;
const getPortfolioQuotesMock = getPortfolioQuotes as jest.Mock;
const netInfoFetchMock = NetInfo.fetch as jest.Mock;

function testWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false },
    },
  });
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function mockStore(overrides = {}) {
  const saveQuotes = jest.fn();
  useFireStoreMock.mockReturnValue({
    snapshot: {
      ...seedSnapshot,
      quoteSettings: {
        ...seedSnapshot.quoteSettings,
        enabled: true,
        lastRefreshAt: null,
        ...overrides,
      },
    },
    saveQuotes,
  });
  return saveQuotes;
}

describe("useQuoteRefresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    netInfoFetchMock.mockResolvedValue({ isConnected: true });
  });

  it("refreshes stale live assets and persists successful quotes", async () => {
    const saveQuotes = mockStore();
    const quotes = [{ ...seedSnapshot.quoteCache[0]!, source: "FREE_MARKET" as const }];
    getPortfolioQuotesMock.mockResolvedValue(quotes);

    const { result, unmount } = await renderHook(() => useQuoteRefresh(), {
      wrapper: testWrapper(),
    });
    await act(() => {
      result.current.refreshIfDue();
    });
    await waitFor(() => expect(result.current.refreshQuotes.isSuccess).toBe(true));

    expect(getPortfolioQuotesMock).toHaveBeenCalledTimes(1);
    expect(getPortfolioQuotesMock).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "free_market" }),
      [expect.objectContaining({ id: "asset-voo" })],
      "HKD",
      seedSnapshot.quoteCache,
    );
    expect(saveQuotes.mock.calls[0]?.[0]).toEqual(quotes);
    await unmount();
  });

  it("does not refresh when disabled or still inside the cadence window", async () => {
    mockStore({ enabled: false });
    const disabled = await renderHook(() => useQuoteRefresh(), { wrapper: testWrapper() });
    disabled.result.current.refreshIfDue();
    await disabled.unmount();

    mockStore({ lastRefreshAt: new Date().toISOString() });
    const fresh = await renderHook(() => useQuoteRefresh(), { wrapper: testWrapper() });
    fresh.result.current.refreshIfDue();

    expect(getPortfolioQuotesMock).not.toHaveBeenCalled();
    await fresh.unmount();
  });

  it("reports offline refreshes without replacing cached quotes", async () => {
    const saveQuotes = mockStore();
    netInfoFetchMock.mockResolvedValue({ isConnected: false });
    const { result, unmount } = await renderHook(() => useQuoteRefresh(), {
      wrapper: testWrapper(),
    });
    let error: unknown;

    await act(async () => {
      try {
        await result.current.refreshQuotes.mutateAsync();
      } catch (caught) {
        error = caught;
      }
    });

    expect(error).toEqual(
      expect.objectContaining({
        message: "You’re offline. Saved prices are still available.",
      }),
    );
    expect(getPortfolioQuotesMock).not.toHaveBeenCalled();
    expect(saveQuotes).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.refreshQuotes.isError).toBe(true));
    await unmount();
  });
});
