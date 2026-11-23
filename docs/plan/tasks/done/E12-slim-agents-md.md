# E12 — Slim AGENTS.md without losing a rule

**Goal:** AGENTS.md is read by every session and has grown to 271 lines, with rules, process, history and gotchas
mixed together. Bring it to about 170–180 lines with **every constraint preserved**. Text-only card: no code, no tests
beyond plan-check.

## Layering (see `docs/plan/decisions.md`)

- **AGENTS.md**: hard rules (what makes work wrong), the card-session process, Definition of done, commands, gotchas
  that no script checks yet. Rules state the conclusion, not the history.
- **`docs/plan/decisions.md`**: why and when (dates, "owner's decision …"). Move any history still in AGENTS.md here
  if it isn't there already.
- **`docs/plan/RUN.md` / `INTEGRATION.md`**: orchestration, review, merge, milestones. AGENTS.md links to them instead of
  repeating them.
- **Scripts**: what a script already enforces doesn't need a paragraph (keep a one-line pointer if a session must know
  the command).

## Do

1. Remove dates and "owner's decision (…)" parentheticals from AGENTS.md; make sure each is in decisions.md.
2. **Verification budget** (57 lines): keep the limits (2 CI pushes, 2 hypotheses per failing check, ~2 h, compact
   output, background long runs, headless browsers) and the tier definitions in short form; move milestone/push/CI
   detail to RUN.md / INTEGRATION.md where it isn't already there.
3. **Hard rules**: keep all eleven rules and every sub-bullet's constraint. Move tool usage details (e.g.
   `a11y-baseline.mjs --write/--list/--prune` mechanics) into a short "Commands" line or the script's header comment.
4. **Definition of done**: turn "New components" and "New-component accessibility acceptance" into a compact checklist.
5. **Gotchas**: keep only those no script checks; leave a gotcha in place if unsure.
6. Fix links to and from AGENTS.md (`grep -rn "AGENTS.md" docs scripts README.md CONTRIBUTING.md`).

## Acceptance

1. Write `docs/plan/returns/E12-rule-map.md` (keep it; it is the evidence): one line per constraint in the **old**
   AGENTS.md (`git show <main before E12>:AGENTS.md`) → where it lives now (AGENTS.md section, decisions.md,
   RUN.md, INTEGRATION.md, or a script with file:line). No constraint may map to "dropped". A pure duplicate maps to
   the place that kept it.
2. `wc -l AGENTS.md` ≤ 185. `node scripts/plan-check.mjs` passes (0 errors).
3. No change to code, tests, fixtures or registry. Bookkeeping plus AGENTS.md/RUN.md/INTEGRATION.md/decisions.md only.
4. Tick E12. Don't push. Budget: about 1 hour.
