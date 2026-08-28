# Quote bridge modules (deprecation resolved)

The former `deprecatedQueryClient.ts` boundary has been decomposed into
dedicated supported modules:

- `client.ts` — public entry: custom-bridge transport (HTTPS POST only),
  script URL validation, and re-exports.
- `freeMarketQuotes.ts` — free stock/ETF/crypto quotes and FX rates.
- `quoteCredentials.ts` — SecureStore credential helpers.
- `quoteSymbols.ts` — ticker/symbol normalization helpers.

No legacy query-token transport remains in the codebase. Do not place
credentials in query parameters; all authenticated calls use POST bodies.
