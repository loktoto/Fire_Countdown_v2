/// <reference types="node" />

import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("Expo Web build contract", () => {
  const root = join(__dirname, "..", "..");
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
    dependencies: Record<string, string>;
    scripts: Record<string, string>;
  };
  const metroSource = readFileSync(join(root, "metro.config.js"), "utf8");

  it("installs the Expo-compatible React Native Web runtime", () => {
    expect(packageJson.dependencies["react-native-web"]).toBeDefined();
    expect(packageJson.scripts["validate:web"]).toContain("expo export --platform web");
  });

  it("configures SQLite WebAssembly and cross-origin isolation", () => {
    expect(metroSource).toContain('config.resolver.assetExts.push("wasm")');
    expect(metroSource).toContain('"Cross-Origin-Embedder-Policy", "credentialless"');
    expect(metroSource).toContain('"Cross-Origin-Opener-Policy", "same-origin"');
  });
});
