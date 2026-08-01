import { renderHook } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";

import { useFireStore } from "../../data/fireStore";
import { seedSnapshot } from "../../data/seed";
import { usePortfolioViewModel } from "../usePortfolioViewModel";

jest.mock("../../data/fireStore", () => ({ useFireStore: jest.fn() }));

const useFireStoreMock = useFireStore as jest.Mock;

describe("Portfolio workflow", () => {
  it("opens a draft asset without persisting a placeholder holding", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    const createAsset = jest.fn();
    const archiveAsset = jest.fn();
    useFireStoreMock.mockReturnValue({
      snapshot: seedSnapshot,
      updateAsset: jest.fn(),
      createAsset,
      archiveAsset,
      updateGoal: jest.fn(),
      updateMilestone: jest.fn(),
      createMilestone: jest.fn(),
      archiveMilestone: jest.fn(),
      updateScenario: jest.fn(),
      createScenario: jest.fn(),
      archiveScenario: jest.fn(),
    });

    const { result } = await renderHook(() => usePortfolioViewModel(), { wrapper });
    const draft = result.current.newAssetDraft();

    expect(draft).toMatchObject({
      id: "draft-asset",
      name: "",
      manualValue: 0,
      currency: "HKD",
      updateMethod: "manual",
    });
    expect(createAsset).not.toHaveBeenCalled();
    expect(result.current.archiveAsset).toBe(archiveAsset);
  });
});
