import * as React from "react"
import { NavigationMenu, NavigationMenuItem } from "@/components/ui/navigation-menu"
import { Tag } from "@/components/ui/tag"
import { home } from "@/lib/fiori-icons"
import { defineDemo } from "./types"

function NavigationMenuDemo() {
  const [open, setOpen] = React.useState(false)
  const [cancel, setCancel] = React.useState(false)
  const [events, setEvents] = React.useState("")
  return <div id="navigation-menu-demo" className="grid gap-3">
    <label><input type="checkbox" checked={cancel} onChange={(event) => setCancel(event.target.checked)} /> Cancel link navigation</label>
    <NavigationMenu trigger="Navigate" open={open} onOpenChange={setOpen} portal={false}
      classNames={{ item: "navigation-menu-demo-item" }}
      onItemClick={({ text }) => setEvents((previous) => `${previous} root:${text}`)}>
      <NavigationMenuItem text="Home" href="#navigation-menu-home" icon={home} tag={<Tag>New</Tag>}
        onActivate={(event) => {
          setEvents("item:Home")
          if (cancel) event.preventDefault()
        }} />
      <NavigationMenuItem text="Workspace" onActivate={(event) => {
        setEvents("item:Workspace")
        if (cancel) event.preventDefault()
      }}>
        <NavigationMenuItem text="Settings" href="#navigation-menu-settings" />
        <NavigationMenuItem text="More">
          <NavigationMenuItem text="Reporting" href="#navigation-menu-reporting" />
        </NavigationMenuItem>
      </NavigationMenuItem>
      <NavigationMenuItem text="Help" href="about:blank" target="_blank" design="action" />
      <NavigationMenuItem text="Archive" href="#navigation-menu-archive" disabled />
    </NavigationMenu>
    <output>{events}</output>
    <section>
      <h3>Customise</h3>
      <p>Use the experimental <code>classNames</code> map for the opener, popup, menu and item parts. Control <code>open</code> on the root or a parent item. Supply the visible <code>text</code>, an optional noninteractive <code>tag</code>, and native link attributes on each row. The component owns its menu roles, focus order and popup relationships.</p>
    </section>
  </div>
}

export default defineDemo({
  title: "NavigationMenu", category: "Navigation", order: 35,
  docs: [{ name: "navigation-menu", description: "Open a hierarchy of destinations, including native links.",
    props: [
      { name: "trigger / triggerProps", type: "ReactNode / ButtonProps", description: "Set the opener caption and native button properties." },
      { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open: boolean) => void", description: "Control the root menu or an item's submenu." },
      { name: "href / target / tag", type: "string / string / ReactNode", description: "Use native link attributes and optional noninteractive tag content." },
      { name: "onActivate / onItemClick", type: "function", description: "Item activation runs before the menu callback. Either can cancel link navigation." },
    ] }],
  Demo: NavigationMenuDemo,
})
