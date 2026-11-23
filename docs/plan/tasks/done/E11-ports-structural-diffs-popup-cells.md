# E11 — Free ports, recorded structural differences, popups kept in their cell

**Goal:** three tooling changes that remove recurring manual work from card sessions (`docs/plan/decisions.md`,
2026-11-23). No component, fixture or visual change.

## 1. Test scripts pick free ports

Today `PORT`, `SAPUI5_PORT` and `STORYBOOK_PORT` default to fixed numbers (`scripts/test-summary.mjs`,
`scripts/test-changed.mjs`, `scripts/test-milestone.mjs`, `scripts/integrate.mjs`), so parallel sessions on one
machine collide and a leftover server fails a whole run ("http://localhost:4311/index.html is already used").

- Add a small helper (e.g. `scripts/free-port.mjs`) that returns a free TCP port on 127.0.0.1, starting from a base and
  skipping busy ones. When a port variable is **unset**, the scripts above choose free ports and pass them to
  Playwright through the environment. An explicitly set variable is used as is; if it is busy, fail at once with the
  pid and command holding it (`lsof -nP -iTCP:<port> -sTCP:LISTEN`), before building or starting Playwright.
- Keep `playwright.config.ts` / `playwright.storybook.config.ts` reading the environment; keep `reuseExistingServer`
  semantics. Print the chosen ports once in the summary line.
- Unit test for the helper (busy port skipped; explicit busy port reported with its owner).

## 2. Record a new component's structural tree differences

AGENTS.md "New-component accessibility acceptance" lets a new-component card record purely structural differences
under its P card. Add the command and the guard:

- `node scripts/a11y-baseline.mjs --record <component> [--report <capture>]`: from a complete capture, add entries only
  for cases of `<component>` and only of kind `structure`, `missing-node` or `extra-node` whose node is an unnamed,
  state-free `generic` (no name, description, value or properties other than `focusable`). Refuse — and print each
  offending line — if any difference of that component is a `role`, `name`, `description`, `value`, `text` or `state:*`
  kind, or a missing/extra node that carries a name, role other than `generic`, or state.
- Guard: for each recorded case, the flattened sequence of semantic nodes (role, name, description, states, text; in
  document order, generics removed) must be identical on both sides. Refuse otherwise. This is what keeps "structural"
  honest.
- Owner of recorded entries is the component's P card (from `groups`); the ratchet then works as today (stale entries
  fail until the P card prunes them). Unit tests with a synthetic report: wrapper-only differences recorded; a name
  difference refused; a moved named node refused by the semantic-sequence guard.
- The same filter for the WCR and phone tree specs if they keep their own expectations (check
  `tests/a11y-tree-wcr.spec.ts`; if it has no baseline, add the same recorded-entry mechanism there, keyed like the main
  baseline).

## 3. A popup must not paint outside its fixture cell

H7's open Input popup broke nine unrelated cells only in the full grid. Add a check to the visual specs: after a
fixture reports ready, any element of that fixture (including portalled/top-layer content it owns, found through its
`data-fixture` / owning id) whose bounding box leaves the cell's box fails the case with a clear message
("<case>: popup paints outside its cell by N px"). Apply it to both sides (ours and the reference page). Cases that
legitimately overflow get an explicit per-case opt-out with a reason in the fixture.

## Files

`scripts/free-port.mjs` (new), `scripts/test-summary.mjs`, `scripts/test-changed.mjs`, `scripts/test-milestone.mjs`,
`scripts/integrate.mjs`, `scripts/a11y-baseline.mjs`, `tests/a11y-tree-baseline.ts`, the visual specs' shared helper,
their unit tests, `docs/plan/RUN.md` (drop the interim port table once 1 lands), `docs/plan/README.md`.
Shared-file card: full main + Storybook once at done.

## Budget

About 2 hours, 0 pushes, 2 hypotheses per failing check. If part 3 turns up existing overflowing cases on `main`,
list them in the return note with their owners instead of fixing them here.

## Acceptance

1. Two `pnpm test:summary tests/test-changed-scope.spec.ts` runs started at the same time without `PORT` both pass on
   different ports; with `PORT` set to a busy port the run fails in seconds naming the process.
2. `--record` unit tests pass; running it on clean `main` for any component adds nothing (no new-component diffs).
3. The overflow check passes on clean `main` (or lists pre-existing cases with owners), and fails on a deliberately
   unpinned popup in a scratch fixture (removed afterwards).
4. Full main + Storybook once: 0 failed, 0 flaky. Tick E11; `node scripts/plan-check.mjs` passes. Don't push.
