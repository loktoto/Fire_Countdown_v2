# Deprecated query-token client boundary

`deprecatedQueryClient.ts` preserves the existing free-market quote implementation and SecureStore credential helpers while the custom-bridge transport is migrated.

Do not import its `getQuotes`, `getPortfolioQuotes`, `upsertAsset`, or `archiveAsset` exports. Those legacy functions may place authentication data in query parameters. The supported public module is `client.ts`, which owns every custom-bridge network call and sends credentials only in authenticated HTTPS POST bodies.

This boundary is temporary. Remove the deprecated module after the free-market implementation and credential helpers are extracted into dedicated modules. No new production import may target `deprecatedQueryClient.ts` outside `client.ts`.
