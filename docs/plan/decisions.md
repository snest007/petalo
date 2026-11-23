# Decisions

Owner decisions that change a rule or the way cards run. AGENTS.md holds the rule itself; this file holds why and
when. Newest first. One entry per decision; review findings for a single card don't belong here (they go in that
card's "Review findings" section).

## 2026-11-23 — New-component cards may record structural accessibility-tree differences

**Rule:** AGENTS.md rule 9 and Definition of done → "New-component accessibility acceptance".
**Why:** in wave H nearly every new-component card produced one or two follow-up cards (H1b, H2b, H2c, H7b, H9b, H9c),
and almost all of the remaining failures were the same kind: whether Chrome keeps or drops an unnamed layout wrapper
in the accessibility tree, or open-popup pixels on the shared reference page. Two fix attempts rarely settle these,
and they don't change what assistive technology announces. The build-out phase needs a card to end in one round.
**What still has to hold in the card:** behaviour, keyboard (LTR/RTL), axe, and every role, name, description, state,
text and relationship UI5 exposes. Only purely structural differences and open-popup pixel cells may be recorded, owned
by the component's P card, which removes them later (the baseline still only shrinks after that).
**Tooling:** E11 adds the command that records them and the check that both sides carry the same semantic content.

## 2026-11-23 — Ports are the scripts' job, not the prompt's

**Why:** parallel card sessions on one machine collided on fixed ports (a leftover server on 4311 cost a full run), and
the a11y baseline only matched on the port it was recorded with. The baseline fingerprint is now port-independent;
E11 makes the test scripts pick free ports themselves, so prompts and AGENTS.md don't carry a port table.

## 2026-11-23 — Review findings live in the card, not in the prompt

**Why:** findings pasted into prompts were lost when a session ended and made prompts long. The reviewer writes them
into the follow-up card's "Review findings" section on main; the card session merges main and reads them there. The
prompt to continue a card is one line (see RUN.md).

## 2026-11-23 — Parallel sessions with one reviewer (RUN.md, INTEGRATION.md rewritten)

**Why:** the owner runs one agent session per card plus one orchestrating/reviewing session (Claude or Codex,
interchangeably). The earlier "one session spawns sub-agents" orchestration was retired. RUN.md and INTEGRATION.md
describe the current flow and are agent-neutral.

## 2026-11-20 — Build out components first; CI is a reminder; tiered verification

See AGENTS.md "Verification budget" → "Current phase" and E8. New components (wave H) come before polish (P, X, S5).
Users run Windows and macOS. Push CI (Linux) is a second platform, not a gate. Cards run tier 1 while working and
tier 2 at done; full suites run at milestones.

## 2026-11-18 — Browsers stay out of the owner's way

Playwright and probes run headless; manual review uses a background browser; close everything you started.

## 2026-11-17 — Extensibility is a library contract

`docs/extension-contract.md` (X0). Parity and documentation cards don't owe T1; it arrives with each component's
X rollout card.
