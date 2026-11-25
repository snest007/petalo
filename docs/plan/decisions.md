# Decisions

Owner decisions that change a rule or how cards run. [AGENTS.md](../../AGENTS.md) holds the core rules and this file
records their rationale and dates, newest first. Record findings for individual cards in their Review findings sections.

## 2026-11-23 — New-component cards may record structural accessibility-tree differences

See rule 9 and New-component accessibility acceptance in [AGENTS.md](../../AGENTS.md#definition-of-done-every-card).
**Why:** in wave H nearly every new-component card produced one or two follow-up cards (H1b, H2b, H2c, H7b, H9b, H9c),
and almost all of the remaining failures were the same kind: whether Chrome keeps or drops an unnamed layout wrapper
in the accessibility tree, or open-popup pixels on the shared reference page. Two fix attempts rarely settle these,
and they don't change what assistive technology announces. The build-out phase needs a card to end in one round.
**What still has to hold in the card:** behaviour, keyboard (LTR/RTL), axe, and every role, name, description, state,
text and relationship UI5 exposes. Only purely structural differences and open-popup pixel cells may be recorded, owned
by the component's P card, which removes them later (the baseline still only shrinks after that).
**Tooling:** E11 adds the command that records them and the check that both sides carry the same semantic content.

## 2026-11-23 — Register new components before acceptance

H8 needed a second card after inventory gaps surfaced late. Register new components in the same card before final
runs. E10 preflights the registrations before Playwright so an omission surfaces quickly.

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
describe the current flow and are agent-neutral. Keep the main checkout separate because an earlier card left an
uncommitted draft and stray branch there.

## 2026-11-20 — Build out components first; CI is a reminder; tiered verification

New components (wave H) come before polish (P, X, S5) while the library is young. Users run Windows and macOS,
and the owner and agents develop on macOS. Linux CI supplies a second platform with keyboard behaviour closer
to Windows. E8 set up tier 1 for the working loop, tier 2 for card acceptance and tier 3 for milestones.
[INTEGRATION.md](INTEGRATION.md#6-milestone-and-publishing) holds the CI and publishing rules.

## 2026-11-18 — Browsers stay out of the owner's way

The owner works on the same machine. Visible windows interrupt their work by appearing in front, taking focus
or staying open. Playwright and probes run headless, and manual reviews use a background browser.
Screenshots, traces and error contexts provide evidence without taking focus.

## 2026-11-17 — Extensibility is a library contract

The owner approved the [extension contract](../extension-contract.md) through X0. The same day, parity and
documentation cards (E4, E5, P1–P6 including P2a, and S story cards) received an exception from full T1 until
the X rollout after the owning P card.

## 2026-11-02 — Calendars stay Gregorian-only

Wave F recorded the Gregorian-only decision in the README and backlog when it added the OpenUI5 reference harness.
Calendar and date pickers still follow the rest of the localization rules.
