# H11b — Preserve action ownership in AnalyticalCardHeader

Continue on `codex/H11` in `.worktrees/H11`. Merge local `main` first.
Budget follows AGENTS.md verification rules, with 0 pushes.

## Review findings

H11 requires interactive content to keep ownership of its actions. The reviewer production bundle at
`3d98b60` reproduced three unexpected header activations in headless Chromium.

| Embedded control | Action | Control result | Header result |
|---|---|---|---|
| Native `<details><summary>` | Click Breakdown | Disclosure opened | Navigation fired once |
| Native `<details><summary>` | Focus Breakdown and press Enter | Disclosure opened | Navigation fired once |
| Petalo `MenuContent` in its default portal | Click Export | Item selected once | Navigation fired once |

The expected header count was zero in all three cases. Enter on the focused header was checked as a
control and fired its callback exactly once. The menu item was outside the header in the DOM. See
`.worktrees/review-h2-h9/.integration/review-h11/interactive-ownership.json` and the adjacent probe and entry point.

The click handler at `registry/ui/analytical-card-header.tsx:140` recognizes a limited set of descendant
controls and misses `summary`. React also bubbles portal events through the component tree. The handler
currently lets those events activate the header because their target is outside the header DOM.

## Scope

Update `registry/ui/analytical-card-header.tsx` and add regression coverage in
`tests/analytical-card-header.spec.ts` or its owned test fixture. Keep the action boundary in the header
implementation so native controls and Petalo menu consumers can use their normal composition.

## Acceptance

- Clicking or pressing Enter on the disclosure toggles it independently. Selecting the default portaled menu
  item invokes its own action once. In each case the card header activation count stays at zero.
- Clicking the header surface and pressing Enter or Space on the focused header each invoke its action once.
  Existing nested button behavior, named-group semantics, label order and focus remain intact in LTR and RTL.
- Verify the existing H11 pixel, tree, axe and localization acceptance with the fix. Follow Tier 2 and tick H11
  and H11b after acceptance. Preserve the original return evidence for reviewer archive.
