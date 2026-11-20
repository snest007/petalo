import { SplitButton, type SplitButtonDesign } from "@/components/ui/split-button"
import { MenuContent, MenuItem } from "@/components/ui/menu"
import { download } from "@/lib/fiori-icons"
import { defineFixtures } from "../fixture-types"
import { inPlace } from "./popover"

const designs = ["default", "emphasized", "transparent", "positive", "negative", "attention"] as const
type Props = { design?: SplitButtonDesign; disabled?: boolean; active?: boolean; icon?: boolean; rtl?: boolean; open?: boolean; styled?: boolean }

export default defineFixtures<Props>({
  name: "split-button",
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
    const split = <SplitButton
      {...(styled ? { role: "link", tabIndex: 7, "aria-labelledby": "caller-label" } : {})}
      design={design}
      disabled={disabled}
      dir={rtl ? "rtl" : undefined}
      icon={icon ? download : undefined}
      activeArrowButton={open || active}
      classNames={styled ? { primary: "export-primary", arrow: "export-arrow" } : undefined}
      menu={open ? <MenuContent aria-label="Export formats" portal={false} preventInitialFocus className="w-40">
        <MenuItem>Export as spreadsheet</MenuItem>
      </MenuContent> : undefined}
    >Export PDF</SplitButton>
    return open ? <div className={inPlace}>{split}</div> : split
  },
})
