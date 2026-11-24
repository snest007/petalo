import { NavigationMenu, NavigationMenuItem } from "@/components/ui/navigation-menu"
import { Tag } from "@/components/ui/tag"
import { home } from "@/lib/fiori-icons"
import { defineFixtures } from "../fixture-types"
import { inPlace } from "./popover"

type Props = { rtl?: boolean; interaction?: boolean; styled?: boolean }
export default defineFixtures<Props>({
  name: "navigation-menu",
  a11yDiffGroups: [
    {
      "cases": ["navigation-menu-default", "navigation-menu-rtl", "navigation-menu-customise"],
      "diff": {
        "navigationMenu": true,
        "ignore": [],
        "reason": "Popup.js sets aria-modal on nonmodal desktop popovers and resolves its name reference to a string. NavigationMenuItem.js forces role=none on focusable LI rows, yielding invalid listitems in a menu, duplicated under native anchors. Compare the owned menuitem and verify the native description and label targets, visible text, consumed tag, wrapper and focus scaffolding before correcting those exact topology differences."
      }
    },
    {
      "cases": ["navigation-menu-opener"],
      "diff": {
        "ui5FormHosts": ["/ui5/ax/0"],
        "ignore": ["/ours/ax/0", "/ui5/ax/0/children/0/children/0"],
        "reason": "The form-associated UI5 Button host adds a default validity channel around the native button, and ButtonTemplate wraps the same visible text in a generic span."
      }
    }
  ],
  cases: [
    { id: "navigation-menu-default", props: {} },
    { id: "navigation-menu-rtl", props: { rtl: true } },
    { id: "navigation-menu-customise", props: { styled: true } },
    { id: "navigation-menu-opener", props: { interaction: true } },
  ],
  react: ({ rtl, interaction, styled }) => (
    <div dir={rtl ? "rtl" : undefined} className={interaction ? "inline-flex" : inPlace}>
      <NavigationMenu trigger="Navigate" defaultOpen={!interaction} portal={!!interaction}
        preventInitialFocus={!interaction}
        triggerProps={interaction ? undefined : { className: "hidden" }}
        classNames={styled ? { item: "navigation-menu-custom-item" } : undefined}>
        <NavigationMenuItem text="Home" icon={home} href="#navigation-menu-home" tag={<Tag>New</Tag>} />
        <NavigationMenuItem text="Workspace">
          <NavigationMenuItem text="Settings" href="#navigation-menu-settings" />
          <NavigationMenuItem text="More">
            <NavigationMenuItem text="Reporting" href="#navigation-menu-reporting" />
          </NavigationMenuItem>
        </NavigationMenuItem>
        <NavigationMenuItem text="Help" href="about:blank" target="_blank" design="action" />
        <NavigationMenuItem text="Archive" href="#navigation-menu-archive" disabled />
      </NavigationMenu>
    </div>
  ),
})
