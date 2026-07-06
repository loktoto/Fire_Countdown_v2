# Fire Countdown v2 Agent Rules

## Source Of Truth

- v5 development docs define product behavior, IA, data rules, and acceptance criteria.
- Stitch files define visual direction only. Do not copy old Stitch navigation labels or flows.
- Locked bottom tabs: `Home | Calendar | + | Dashboard | Portfolio`.
- The center `+` is the Log route and the default landing screen.
- Settings is not a bottom tab; it opens from a gear/menu or Portfolio settings entry.

## Product Rules

- Every user-owned financial input that affects FIRE must be editable after creation.
- FIRE outputs must be deterministic TypeScript calculations, never AI-generated numbers.
- Preserve existing flows: Log, edit history in Calendar, manage assets/goals in Portfolio, explain projection in Dashboard, show countdown in Home.
- Quote bridge failure must never blank Portfolio; use cached quote or manual fallback.
- Light mode should use subtle off-white surfaces, not plain white.

## Implementation Rules

- Make a backup before broad edits.
- Keep screens out of direct storage and direct FIRE math; use view models and engine selectors.
- Keep app local-first. Do not commit secrets or hardcode quote API tokens.
- Use Expo Go-compatible dependencies first; do not run native/EAS builds unless explicitly requested.
