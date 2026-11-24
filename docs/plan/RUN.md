# Run cards (orchestrator)

How to select, dispatch and hand off a card. Any agent can take either session role. Read
[AGENTS.md](../../AGENTS.md) first. See [INTEGRATION.md](INTEGRATION.md) for review and merge and
[decisions.md](decisions.md) for the rationale.

## Roles

- **Card session** — implements one card and hands back a committed branch from its own worktree.
- **Orchestrator / reviewer** — picks cards, writes prompts and follow-up cards, reviews isolated merge candidates
  and advances local `main`. Component implementation belongs to the card session.
- **Owner** — starts sessions, pastes prompts and final messages between them, decides anything marked
  "owner's decision", authorizes pushes.

## Picking cards

1. Take unchecked cards from `docs/plan/README.md` whose dependencies are merged (the Status table names the next ones).
2. Run cards in parallel only if they don't edit the same existing component file (each card says which ones it
   edits). Shared inventories (`tests/a11y-tree-baseline.ts`, audit generators, `docs/src/fixtures/index.ts`, README)
   are fine in parallel: each card adds its own lines and regenerates; the merge keeps both sides.
3. One new component per card. A card that would add several components is split before it starts (wave H showed
   that one stuck component holds the others back). Staged cards for one component (H1→H5) run in order.
4. A tooling card that makes later cards faster or fail sooner goes first (E10 before new components).

## Prompts

The card file carries the scope and any review findings, so prompts stay short.

**New card**
```text
Read AGENTS.md, then do card <ID> (docs/plan/tasks/<file>.md). Worktree .worktrees/<ID>, branch codex/<ID> from local main.
```

**Follow-up card** (same branch, after the reviewer committed the card with its "Review findings" to main)
```text
Read AGENTS.md, then continue on codex/<ID> in .worktrees/<ID> with card <IDb> (merge local main first; the card's Review findings section says where to start).
```

Test scripts choose free ports. Prompts need the card path and branch.

## Card session flow (summary of AGENTS.md)

1. Open the new worktree from local `main` or reuse the worktree named by the follow-up card. Set it up using
   [Environment](../../AGENTS.md#environment).
2. Run [Tier 1](../../AGENTS.md#verification-budget) while working. Register new components before final verification
   so the preflight can catch missing inventory entries.
3. Before Tier 2, merge local `main` into the card branch, resolve conflicts in source, and rebuild generated files
   with `pnpm generate && pnpm registry:build`.
4. Follow the card's acceptance and the [definition of done](../../AGENTS.md#definition-of-done-every-card),
   including the installed-consumer check for new items. Tick the card in the completion commit and hand back
   the branch and verification summary.
5. At a limit, commit the work in progress and write `docs/plan/returns/<ID>.md` with failing test names, what each
   round changed and why, remaining hypotheses and the next thing to try. Propose a small `<ID>b` scoped to the
   remaining items. Stop this run and leave the follow-up for a separate run.
6. Close every server and browser you started.

## After a card returns

The reviewer follows [INTEGRATION.md](INTEGRATION.md) to verify the branch. If a follow-up is needed, hand the owner
its one-line prompt once the card and its findings are on local `main`.

## Milestones and pushing

Follow the reviewer's [milestone and publishing checklist](INTEGRATION.md#6-milestone-and-publishing).
