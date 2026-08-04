from __future__ import annotations

import base64
import subprocess
from pathlib import Path

screen = Path("src/screens/PortfolioScreen.tsx")
text = screen.read_text(encoding="utf-8")


def replace_once(old: str, new: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected one match, found {count}: {old!r}")
    text = text.replace(old, new, 1)


replace_once('import { resolveAssetValue } from "../engine/fireEngine";\n', "")
replace_once(
    '''          {vm.assets.map((asset) => {
            const resolved = resolveAssetValue(asset, vm.quoteCache, goalCurrency);
            const latestQuote = vm.quoteCache
              .filter((quote) => quote.assetId === asset.id)
              .sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt))[0];
            const quoteChange = latestQuote?.changePercent;
''',
    '''          {vm.assetRows.map(({ asset, latestQuote, quoteChange, resolution: resolved }) => {
''',
)
replace_once("          {vm.assets.length === 0 ? (\n", "          {vm.assetRows.length === 0 ? (\n")
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

for path in paths:
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    print(f"BEGIN_BASE64:{path}")
    print(encoded)
    print(f"END_BASE64:{path}")

raise SystemExit(1)
