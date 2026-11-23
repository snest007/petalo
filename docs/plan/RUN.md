# Run cards (orchestrator)

How the owner's cards get from "open" to "merged". Agent-neutral: any agent (Claude, Codex, …) can be the
orchestrator or a card session. Read `/AGENTS.md` first. Review and merge are in [INTEGRATION.md](INTEGRATION.md);
why things are this way is in [decisions.md](decisions.md).

## Roles

- **Card session** — one agent session per card, in its own worktree `.worktrees/<id>` on branch `codex/<id>`.
  Implements exactly one card, commits, never pushes or merges. Ends with the final message AGENTS.md asks for.
- **Orchestrator / reviewer** — one session in a separate checkout (a worktree on its own branch, never the main
  checkout's working tree). Picks the next cards, writes the one-line prompts, reviews returned branches
  ([INTEGRATION.md](INTEGRATION.md)), merges into local `main`, writes follow-up cards. Doesn't write component code.
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

Ports are chosen by the test scripts (E11); don't put port numbers in prompts. Until E11 is merged, give each parallel
session its own `PORT`/`STORYBOOK_PORT` pair (4310/4320, 4330/4340, 4350/4360, 4370/4380) in the prompt.

## Card session flow (summary of AGENTS.md)

1. Create the worktree from local `main`; `pnpm install --frozen-lockfile && pnpm generate`. Leave the main checkout alone.
2. Tier 1 while working (`pnpm test:changed`). New components register in the shared inventories before the final runs;
   E10's preflight reports a missing registration in seconds.
3. Before tier 2: merge local `main`, regenerate (`pnpm generate && pnpm registry:build`), never hand-merge generated files.
4. Tier 2 at done, installed-consumer check for new items, tick the card in `docs/plan/README.md`.
5. At a limit, commit the work in progress and write `docs/plan/returns/<ID>.md` with failing test names, what each
   round changed and why, remaining hypotheses and the next thing to try. Propose a small `<ID>b` scoped to the
   remaining items. Stop this run and leave the follow-up for a separate run.
6. Close every server and browser you started.

## After a card returns

The reviewer follows [INTEGRATION.md](INTEGRATION.md): verify the claims on the branch, then either merge, or write the
follow-up card with a "Review findings" section, commit it to local `main`, and hand the owner the one-line prompt.

## Milestones and pushing

At a milestone (end of a wave, about every 3–5 merged cards, or when the owner asks to publish), the reviewer runs
`pnpm test:milestone` once on macOS with fresh builds and both full suites. Run the stored-baseline
`tests/a11y-tree*.spec.ts` comparisons on macOS at milestones only. A release can use `--runs=2`. Target about
20 minutes locally and 12 minutes in CI. Follow the [milestone checklist](README.md#milestone-checklist-reviewer-at-the-end-of-a-wave-or-when-the-owner-asks-to-publish).

Push `main` only at a verified milestone with owner authorization. GitHub Pages then redeploys the registry and docs.
CI serves as a reminder and never gates a card. Linux push CI runs behaviour, live pixel comparisons and
Storybook. Its keyboard behaviour is closer to Windows. Fix failures only if they reproduce on macOS or in a behaviour test.
Document Linux-only failures in the milestone report without opening a card for them.
