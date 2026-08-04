from __future__ import annotations

import argparse
import base64
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument("--emit", action="store_true")
args = parser.parse_args()

screen = Path("src/screens/PortfolioScreen.tsx")
text = screen.read_text(encoding="utf-8")
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

if old_import in text:
    if text.count(old_import) != 1 or text.count(old_rows) != 1 or text.count(old_empty) != 1:
        raise SystemExit("Portfolio screen does not match the expected pre-refactor shape")
    text = text.replace(old_import, "", 1)
    text = text.replace(old_rows, new_rows, 1)
    text = text.replace(old_empty, new_empty, 1)
elif (
    'from "../engine/fireEngine"' in text
    or text.count(new_rows) != 1
    or text.count(new_empty) != 1
):
    raise SystemExit("Portfolio screen does not match the expected post-refactor shape")

screen.write_text(text, encoding="utf-8")

paths = [
    Path("src/hooks/usePortfolioViewModel.ts"),
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
