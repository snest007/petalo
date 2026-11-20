# H8b — Finish H8 parity and audit registration

Continue from the three H8 component commits and the evidence in [the H8 return](../returns/H8.md). H8 remains open until this follow-up passes.

- Fix the four high-contrast `split-button-menu-open` pixel comparisons. Preserve the real Menu composition and keep the popup in its cell. Verify all H8 states again, including the affected disabled and decimal cases.
- Add the paired NumericInput focused value-state popup fixture. Use the UI5 input’s actual validation popover and keep it in place. The existing behavior test covers the visible status and the textbox’s description.
- Register H8’s fixtures in the E4 owner and RTL inventories. Review the native form-associated hosts that Chromium exposes as generic nodes with implicit `invalid=false`, the composed Menu tree, and the NumericInput custom message. Compare the full semantics. Use an exact allowance only for a demonstrated native or inert-wrapper difference under rule 9.
- Register the actual H8 customization proofs and accessible-member mappings with the E4 audit. Include Button’s inherited `badge` slot on ToggleButton and ToolbarButton where relevant.
- Review E5’s native-key reachability for the new controls. Distinguish rendered text from private or unavailable nested features. Coordinate the newly implemented badge text keys with the affected P owners so they can update their inventories under the ratchet rules.
- Refresh the generated usage references and standalone locale packs from the accepted source.

Files include the H8-owned files, the E4 and E5 owner, audit and customization inventories, and the tracked generated usage and localization outputs. Existing baseline changes belong to the owning P cards.

Acceptance is one full main suite and one full Storybook suite with zero failures and flakes under the shared-file budget. Verify pixel, tree and axe parity for the H8 fixtures, then tick H8 and H8b and run `node scripts/plan-check.mjs`.
