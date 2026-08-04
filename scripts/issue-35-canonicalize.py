from __future__ import annotations

import argparse
import base64
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("--emit", action="store_true")
args = parser.parse_args()

screen = Path("src/screens/PortfolioScreen.tsx")
screen_text = screen.read_text(encoding="utf-8")
old_import = 'import { resolveAssetValue } from "../engine/fireEngine";\n'
old_rows = '''          {vm.assets.map((asset) => {
            const resolved = resolveAssetValue(asset, vm.quoteCache, goalCurrency);
            const latestQuote = vm.quoteCache
              .filter((quote) => quote.assetId === asset.id)
              .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))[0];
            const quoteChange = latestQuote?.changePercent;
'''
new_rows = '''          {vm.assetRows.map(({ asset, latestQuote, quoteChange, resolution: resolved }) => {
'''
old_empty = "          {vm.assets.length === 0 ? (\n"
new_empty = "          {vm.assetRows.length === 0 ? (\n"

if old_import in screen_text:
    if (
        screen_text.count(old_import) != 1
        or screen_text.count(old_rows) != 1
        or screen_text.count(old_empty) != 1
    ):
        raise SystemExit("Portfolio screen does not match the expected pre-refactor shape")
    screen_text = screen_text.replace(old_import, "", 1)
    screen_text = screen_text.replace(old_rows, new_rows, 1)
    screen_text = screen_text.replace(old_empty, new_empty, 1)
elif (
    'from "../engine/fireEngine"' in screen_text
    or screen_text.count(new_rows) != 1
    or screen_text.count(new_empty) != 1
):
    raise SystemExit("Portfolio screen does not match the expected post-refactor shape")

screen.write_text(screen_text, encoding="utf-8")

view_model = Path("src/hooks/usePortfolioViewModel.ts")
view_model_text = view_model.read_text(encoding="utf-8")
old_latest = '''function latestQuoteForAsset(assetId: string, quotes: AssetQuoteCache[]) {
  let latest: AssetQuoteCache | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;

  quotes.forEach((quote) => {
    if (quote.assetId !== assetId) {
      return;
    }

    const receivedAt = Date.parse(quote.receivedAt);
    if (Number.isFinite(receivedAt) && receivedAt > latestTime) {
      latest = quote;
      latestTime = receivedAt;
    }
  });

  return latest;
}
'''
new_latest = '''function latestQuoteForAsset(
  assetId: string,
  quotes: AssetQuoteCache[],
): AssetQuoteCache | null {
  let latest: AssetQuoteCache | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;

  for (const quote of quotes) {
    if (quote.assetId !== assetId) {
      continue;
    }

    const receivedAt = Date.parse(quote.receivedAt);
    if (Number.isFinite(receivedAt) && receivedAt > latestTime) {
      latest = quote;
      latestTime = receivedAt;
    }
  }

  return latest;
}
'''

if old_latest in view_model_text:
    if view_model_text.count(old_latest) != 1:
        raise SystemExit("Expected one pre-refactor latest quote selector")
    view_model_text = view_model_text.replace(old_latest, new_latest, 1)
elif not (
    "function latestQuoteForAsset(" in view_model_text
    and "): AssetQuoteCache | null {" in view_model_text
    and "for (const quote of quotes)" in view_model_text
    and "continue;" in view_model_text
):
    raise SystemExit("Portfolio view model does not match the expected latest quote selector")

view_model.write_text(view_model_text, encoding="utf-8")

paths = [
    view_model,
    Path("src/hooks/__tests__/usePortfolioViewModel.test.ts"),
    screen,
]
subprocess.run(
    ["npx", "prettier", "--write", *(str(path) for path in paths)],
    check=True,
)

if args.emit:
    for path in paths:
        encoded = base64.b64encode(path.read_bytes()).decode("ascii")
        print(f"BEGIN_BASE64:{path}")
        print(encoded)
        print(f"END_BASE64:{path}")
    raise SystemExit(1)
