import { useEffect, useMemo, useState } from "react";

import { useFireStore } from "../data/fireStore";
import {
  defaultScenario,
  deriveWhatIfLab,
  mainGoal,
  projectScenarioTiming,
  scenarioWhatIfInputs,
  whatIfTimingImpactDays,
  type WhatIfDriverKey,
  type WhatIfInputs,
} from "../engine/selectors";
import { todayIso } from "../utils/format";

export type WhatIfControlRange = {
  minimum: number;
  maximum: number;
  step: number;
};

type WhatIfLabState = {
  baselineKey: string;
  inputs: WhatIfInputs;
  projectionInputs: WhatIfInputs;
};

function sameInputs(left: WhatIfInputs, right: WhatIfInputs) {
  return (
    Math.abs(left.monthlySaving - right.monthlySaving) < 0.01 &&
    Math.abs(left.expectedReturn - right.expectedReturn) < 0.000001 &&
    Math.abs(left.targetMonthlySpending - right.targetMonthlySpending) < 0.01
  );
}

function moneyStep(value: number) {
  const magnitude = Math.abs(value);
  if (magnitude >= 100000) {
    return 5000;
  }
  if (magnitude >= 10000) {
    return 1000;
  }
  if (magnitude >= 1000) {
    return 500;
  }
  return 100;
}

function moneyRange(baseline: number, presetValues: number[]): WhatIfControlRange {
  const values = [baseline, ...presetValues].filter(Number.isFinite);
  const lowest = Math.max(0, Math.min(...values));
  const highest = Math.max(...values);
  const step = moneyStep(Math.max(Math.abs(lowest), Math.abs(highest), baseline));
  const padding = Math.max(Math.abs(baseline) * 0.5, step * 10);
  const minimum = Math.max(0, Math.floor((lowest - padding) / step) * step);
  const maximum = Math.max(minimum + step * 10, Math.ceil((highest + padding) / step) * step);

  return { minimum, maximum, step };
}

function returnRange(baseline: number, presetValues: number[]): WhatIfControlRange {
  const step = 0.005;
  const values = [baseline, ...presetValues].filter(Number.isFinite);
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const minimum = Math.max(-0.95, Math.min(0, Math.floor((lowest - 0.03) / step) * step));
  const maximum = Math.min(10, Math.max(0.12, Math.ceil((highest + 0.04) / step) * step));

  return { minimum, maximum, step };
}

function impactMagnitude(value: number) {
  return Number.isFinite(value) ? Math.abs(value) : Number.POSITIVE_INFINITY;
}

export function useWhatIfLabViewModel(baselineScenarioId?: string) {
  const { snapshot } = useFireStore();
  const today = todayIso();
  const currency = mainGoal(snapshot)?.baseCurrency ?? snapshot.currency;
  const scenarios = useMemo(
    () => snapshot.scenarios.filter((scenario) => !scenario.archivedAt),
    [snapshot.scenarios],
  );
  const baselineScenario =
    scenarios.find((scenario) => scenario.id === baselineScenarioId) ??
    defaultScenario(snapshot) ??
    scenarios[0];
  const baselineInputs = useMemo(
    () => scenarioWhatIfInputs(snapshot, baselineScenario),
    [baselineScenario, snapshot],
  );
  const baselineKey = `${baselineScenario?.id ?? "base"}|${baselineInputs.monthlySaving}|${baselineInputs.expectedReturn}|${baselineInputs.targetMonthlySpending}`;
  const [labState, setLabState] = useState<WhatIfLabState>(() => ({
    baselineKey,
    inputs: baselineInputs,
    projectionInputs: baselineInputs,
  }));
  const stateMatchesBaseline = labState.baselineKey === baselineKey;
  const inputs = stateMatchesBaseline ? labState.inputs : baselineInputs;
  const projectionInputs = stateMatchesBaseline ? labState.projectionInputs : baselineInputs;

  useEffect(() => {
    if (sameInputs(inputs, projectionInputs)) {
      return;
    }
    const timer = setTimeout(
      () =>
        setLabState((current) => ({
          baselineKey,
          inputs: current.baselineKey === baselineKey ? current.inputs : inputs,
          projectionInputs: current.baselineKey === baselineKey ? current.inputs : inputs,
        })),
      160,
    );
    return () => clearTimeout(timer);
  }, [baselineKey, inputs, projectionInputs]);

  const presetInputs = useMemo(
    () =>
      scenarios.map((scenario) => ({
        scenario,
        inputs: scenarioWhatIfInputs(snapshot, scenario),
      })),
    [scenarios, snapshot],
  );
  const controls = useMemo(
    () => ({
      monthlySaving: moneyRange(
        baselineInputs.monthlySaving,
        presetInputs.map((preset) => preset.inputs.monthlySaving),
      ),
      expectedReturn: returnRange(
        baselineInputs.expectedReturn,
        presetInputs.map((preset) => preset.inputs.expectedReturn),
      ),
      targetMonthlySpending: moneyRange(
        baselineInputs.targetMonthlySpending,
        presetInputs.map((preset) => preset.inputs.targetMonthlySpending),
      ),
    }),
    [baselineInputs, presetInputs],
  );
  const projection = useMemo(
    () => deriveWhatIfLab(snapshot, today, baselineScenario, projectionInputs),
    [baselineScenario, projectionInputs, snapshot, today],
  );
  const baselineTiming = useMemo(
    () => projectScenarioTiming(snapshot, today, baselineScenario),
    [baselineScenario, snapshot, today],
  );
  const scenarioPresets = useMemo(
    () =>
      presetInputs.map((preset) => {
        const timing = projectScenarioTiming(snapshot, today, preset.scenario);
        return {
          ...preset,
          timing,
          impactDays: whatIfTimingImpactDays(baselineTiming, timing),
        };
      }),
    [baselineTiming, presetInputs, snapshot, today],
  );
  const strongestDriver = useMemo(
    () =>
      [...projection.drivers]
        .filter((driver) => projection.inputs[driver.key] !== projection.baselineInputs[driver.key])
        .sort(
          (left, right) => impactMagnitude(right.impactDays) - impactMagnitude(left.impactDays),
        )[0] ?? null,
    [projection],
  );
  const activePresetId = sameInputs(inputs, baselineInputs) ? (baselineScenario?.id ?? null) : null;

  function updateInput(key: WhatIfDriverKey, value: number) {
    setLabState((current) => {
      const currentInputs = current.baselineKey === baselineKey ? current.inputs : baselineInputs;
      const currentProjectionInputs =
        current.baselineKey === baselineKey ? current.projectionInputs : baselineInputs;
      return {
        baselineKey,
        inputs: { ...currentInputs, [key]: value },
        projectionInputs: currentProjectionInputs,
      };
    });
  }

  function commitInput(key: WhatIfDriverKey, value: number) {
    const next = { ...inputs, [key]: value };
    setLabState({ baselineKey, inputs: next, projectionInputs: next });
  }

  function reset() {
    setLabState({ baselineKey, inputs: baselineInputs, projectionInputs: baselineInputs });
  }

  return {
    baselineScenario,
    currency,
    baselineInputs,
    inputs,
    controls,
    projection,
    scenarioPresets,
    strongestDriver,
    activePresetId,
    hasChanges: !sameInputs(inputs, baselineInputs),
    isCalculating: !sameInputs(inputs, projection.inputs),
    updateInput,
    commitInput,
    reset,
  };
}
