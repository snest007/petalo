import { NavigationMenu, NavigationMenuItem } from "@/components/ui/navigation-menu"
import { Tag } from "@/components/ui/tag"
import { home } from "@/lib/fiori-icons"
import { FioriLocaleProvider } from "@/lib/fiori-locale"
import de from "../../../registry/i18n/de.json"
import zh from "../../../registry/i18n/zh-CN.json"
import ar from "../../../registry/i18n/ar.json"
import { defineFixtures, readPageOptions } from "../fixture-types"
import { inPlace } from "./popover"

type Props = { rtl?: boolean; interaction?: boolean; styled?: boolean; expanded?: boolean }
const locales = { "de-DE": de, "zh-CN": zh, "ar-EG": ar }
const openInPlace = `${inPlace} w-80 [&_[data-slot=navigation-menu]]:w-max
  [&_.fiori-navigation-menu-list]:relative [&_.fiori-navigation-menu-list]:overflow-visible
  [&_.fiori-popup__root]:overflow-visible
  [&_[data-radix-popper-content-wrapper]:has(>_[data-submenu])]:absolute!
  [&_[data-radix-popper-content-wrapper]:has(>_[data-submenu])]:start-[calc(100%-var(--fiori-side-navigation-popup-padding))]!
  [&_[data-radix-popper-content-wrapper]:has(>_[data-submenu])]:top-[calc(var(--fiori-side-navigation-popup-padding)+var(--fiori-side-navigation-item-height)+var(--fiori-side-navigation-item-bottom-margin))]!
  [&_[data-submenu]]:[margin-inline:var(--fiori-menu-submenu-margin-offset)]
  [&_.fiori-navigation-menu-item:focus-visible]:after:hidden`
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
    },
    {
      "cases": ["navigation-menu-expanded", "navigation-menu-expanded-rtl"],
      "diff": {
        "navigationMenu": true,
        "ignore": [],
        "reason": "Apply the verified NavigationMenuItemTemplate and Popup.js differences from the root case to the nested surface. UI5 composes its popup inside the owner host and omits aria-controls. The React positioner follows the owner. Verify expanded state, the named popup, its controlled menu, focusability and each nested row before reconciling topology."
      }
    }
  ],
  cases: [
    { id: "navigation-menu-default", props: {} },
    { id: "navigation-menu-rtl", props: { rtl: true } },
    { id: "navigation-menu-customise", props: { styled: true } },
    { id: "navigation-menu-opener", props: { interaction: true } },
    { id: "navigation-menu-expanded", props: { expanded: true } },
    { id: "navigation-menu-expanded-rtl", props: { expanded: true, rtl: true } },
  ],
  react: ({ rtl, interaction, styled, expanded }) => {
    const { locale, dir } = readPageOptions()
    const localized = interaction && locale && Object.hasOwn(locales, locale) ? locale as keyof typeof locales : undefined
    const menu = <div dir={rtl ? "rtl" : undefined} className={interaction ? "inline-flex" : expanded ? openInPlace : inPlace}>
      <NavigationMenu trigger="Navigate" defaultOpen={!interaction} portal={!!interaction}
        preventInitialFocus={!interaction}
        triggerProps={interaction ? undefined : { className: "hidden" }}
        classNames={styled ? { item: "navigation-menu-custom-item" } : undefined}>
        <NavigationMenuItem text="Home" icon={home} href="#navigation-menu-home" tag={<Tag>New</Tag>} />
        <NavigationMenuItem text="Workspace" defaultOpen={expanded}>
          <NavigationMenuItem text="Settings" href="#navigation-menu-settings" />
          <NavigationMenuItem text="More">
            <NavigationMenuItem text="Reporting" href="#navigation-menu-reporting" />
          </NavigationMenuItem>
        </NavigationMenuItem>
        <NavigationMenuItem text="Help" href="about:blank" target="_blank" design="action" />
        <NavigationMenuItem text="Archive" href="#navigation-menu-archive" disabled />
      </NavigationMenu>
    </div>
    return localized ? <FioriLocaleProvider locale={localized} dir={dir} texts={locales[localized]}>{menu}</FioriLocaleProvider> : menu
  },
})
