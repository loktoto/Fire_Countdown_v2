import type { QuoteStatus } from "./types";

export function isUsableQuoteStatus(status: QuoteStatus) {
  return status === "ok" || status === "delayed" || status === "stale" || status === "manual";
}
