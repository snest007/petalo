import { Button } from "@/components/ui/button"
import { ButtonBadge } from "@/components/ui/button-badge"
import { defineDemo } from "./types"

export default defineDemo({
  category: "Actions", title: "ButtonBadge", order: 12,
  docs: [{
    name: "button-badge", description: "Attach an item count or attention dot to a Button.",
    props: [
      { name: "design", type: "InlineText | OverlayText | AttentionDot", description: "Select the placement and appearance.", defaultValue: "AttentionDot" },
      { name: "text", type: "string", description: "Numeric text or a capped count such as 99+." },
      { name: "texts", type: "Partial<ButtonBadgeTexts>", description: "Override the singular and plural count announcements." },
      { name: "classNames", type: "Partial<Record<ButtonBadgeSlot, string>>", description: "Experimental styling for root and tag." },
    ],
  }],
  Demo: () => <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-4">
      <Button badge={<ButtonBadge design="InlineText" text="1" />}>Inbox</Button>
      <Button badge={<ButtonBadge design="OverlayText" text="99+" />}>Notifications</Button>
      <Button badge={<ButtonBadge />}>Approvals</Button>
    </div>
    <section>
      <h3>Customise</h3>
      <p>Pass a ButtonBadge to the Button’s <code>badge</code> slot. The Button includes the localized count in its accessible name. Style <code>root</code> and <code>tag</code> with the experimental <code>classNames</code> map.</p>
      <Button badge={<ButtonBadge design="InlineText" text="4" classNames={{ tag: "tabular-nums" }} />}>Open tasks</Button>
    </section>
  </div>,
})
