import { en } from "../en";
import { zhHant } from "../zhHant";

function shapePaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return [`${prefix}[]`];
  }
  if (typeof value !== "object" || value === null) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    shapePaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("locales", () => {
  it("keeps English and Traditional Chinese translation shapes in parity", () => {
    expect(shapePaths(zhHant).sort()).toEqual(shapePaths(en).sort());
  });

  it("preserves valid Traditional Chinese UTF-8 content", () => {
    expect(zhHant.tabs.home).toBe("\u9996\u9801");
    expect(JSON.stringify(zhHant)).not.toContain("\uFFFD");
  });
});
