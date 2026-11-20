import { SplitButton, type SplitButtonDesign } from "@/components/ui/split-button"
import { MenuContent, MenuItem } from "@/components/ui/menu"
import { download } from "@/lib/fiori-icons"
import { defineFixtures } from "../fixture-types"
import { inPlace } from "./popover"

const designs = ["default", "emphasized", "transparent", "positive", "negative", "attention"] as const
type Props = { design?: SplitButtonDesign; disabled?: boolean; active?: boolean; icon?: boolean; rtl?: boolean; open?: boolean; styled?: boolean }

export default defineFixtures<Props>({
  name: "split-button",
  a11yDiffGroups: [
    {
      "cases": [
        "split-button-active-attention",
        "split-button-active-default",
        "split-button-active-emphasized",
        "split-button-active-negative",
        "split-button-active-positive",
        "split-button-active-transparent",
        "split-button-attention",
        "split-button-customise",
        "split-button-default",
        "split-button-emphasized",
        "split-button-icon",
        "split-button-negative",
        "split-button-positive",
        "split-button-rtl",
        "split-button-transparent"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0/children/2",
          "/ours/ax/0/children/3",
          "/ui5/ax/0/children/0/children/0/children/0"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/0",
          "/ui5/ax/0/children/1"
        ],
        "reason": "SplitButtonTemplate and ButtonTemplate add unnamed shadow and text wrappers. The form-associated Button hosts repeat the inner controls’ default validity and disabled state. Retain the group, both buttons, valid label references and hint text."
      }
    },
    {
      "cases": [
        "split-button-disabled"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0/children/2",
          "/ours/ax/0/children/3",
          "/ui5/ax/0/children/0/children/0"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/1"
        ],
        "reason": "SplitButtonTemplate and ButtonTemplate add unnamed shadow and text wrappers. The form-associated Button hosts repeat the inner controls’ default validity and disabled state. Retain the group, both buttons, valid label references and hint text."
      }
    },
    {
      "cases": [
        "split-button-menu-open"
      ],
      "diff": {
        "ignore": [
          "/ours/ax/0/children/2",
          "/ours/ax/0/children/3",
          "/ui5/ax/0",
          "/ui5/ax/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/0/children/0/children/0"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0/children/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/0/children/1"
        ],
        "reason": "SplitButtonTemplate and ButtonTemplate add unnamed shadow and text wrappers. The form-associated Button hosts repeat the inner controls’ default validity and disabled state. Retain the group, both buttons, valid label references and hint text. MenuTemplate’s in-place ResponsivePopover reports a modal dialog and sentinel focus stops around a modeless menu. Its List-based item appends the redundant active-action hint. Compare both popup structures exactly; Radix also retains a working opener-to-menu controls relation.",
        "splitButtonMenu": {
          "item": "Export as spreadsheet",
          "opener": "Open Menu",
          "dialog": "Select an option from the menu",
          "activeHint": "Is Active"
        }
      }
    }
  ],
  cases: [
    ...designs.map(design => ({ id: `split-button-${design}`, props: { design } })),
    ...designs.map(design => ({ id: `split-button-active-${design}`, props: { design, active: true } })),
    { id: "split-button-disabled", props: { disabled: true } },
    { id: "split-button-icon", props: { icon: true } },
    { id: "split-button-rtl", props: { rtl: true, icon: true } },
    { id: "split-button-menu-open", props: { open: true } },
    { id: "split-button-customise", props: { styled: true } },
  ],
  react: ({ open, rtl, icon, active, styled, design, disabled }) => {
    // placeInPlace makes UI5's popover relative so its high-contrast shadow
    // paints over the opener, even though the fixture keeps the popup in flow.
    const split = <SplitButton
      {...(styled ? { role: "link", tabIndex: 7, "aria-labelledby": "caller-label" } : {})}
      design={design}
      disabled={disabled}
      dir={rtl ? "rtl" : undefined}
      icon={icon ? download : undefined}
      activeArrowButton={open || active}
      classNames={styled ? { primary: "export-primary", arrow: "export-arrow" } : undefined}
      menu={open ? <MenuContent aria-label="Export formats" portal={false} preventInitialFocus className="relative w-40">
        <MenuItem>Export as spreadsheet</MenuItem>
      </MenuContent> : undefined}
    >Export PDF</SplitButton>
    return open ? <div className={inPlace}>{split}</div> : split
  },
})
