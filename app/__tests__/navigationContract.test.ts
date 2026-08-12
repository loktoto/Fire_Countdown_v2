/// <reference types="node" />

import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("locked navigation contract", () => {
  const tabsSource = readFileSync(join(__dirname, "..", "(tabs)", "_layout.tsx"), "utf8");
  const indexSource = readFileSync(join(__dirname, "..", "index.tsx"), "utf8");
  const rootSource = readFileSync(join(__dirname, "..", "_layout.tsx"), "utf8");
  const settingsSource = readFileSync(
    join(__dirname, "..", "..", "src", "screens", "SettingsScreen.tsx"),
    "utf8",
  );

  it("keeps Home, Calendar, +, Dashboard, and Portfolio in the locked order", () => {
    const routeNames = [...tabsSource.matchAll(/<Tabs\.Screen name="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(routeNames).toEqual(["home", "calendar", "log", "dashboard", "portfolio"]);
    expect(tabsSource).toContain('initialRouteName="log"');
    expect(tabsSource).toContain('<Tabs.Screen name="log" options={{ title: "+" }} />');
  });

  it("lands on Log and keeps Settings outside the bottom tabs", () => {
    expect(indexSource).toContain('<Redirect href="/(tabs)/log" />');
    expect(tabsSource).not.toContain('name="settings"');
    expect(rootSource).toMatch(/<Stack\.Screen\s+name="settings"/);
    expect(rootSource).toContain('presentation: "modal"');
  });

  it("keeps recurring cashflow in a shared modal outside the bottom tabs", () => {
    expect(tabsSource).not.toContain('name="recurring"');
    expect(rootSource).toMatch(/<Stack\.Screen\s+name="recurring"/);
    expect(settingsSource).toContain('router.push("/recurring")');
  });

  it("places the recovery boundary outside Providers and the routed stack", () => {
    expect(rootSource).toMatch(/<AppErrorBoundary>\s*<Providers>/);
  });
});
