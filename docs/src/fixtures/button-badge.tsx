import { Button } from "@/components/ui/button"
import { ButtonBadge, type ButtonBadgeDesign } from "@/components/ui/button-badge"
import { Icon } from "@/components/ui/icon"
import { bell } from "@/lib/fiori-icons"
import { defineFixtures } from "../fixture-types"

type Props = { design: ButtonBadgeDesign; text?: string; icon?: boolean; disabled?: boolean; rtl?: boolean; styled?: boolean }

export default defineFixtures<Props>({
  name: "button-badge",
  a11yDiffGroups: [
    {
      "cases": [
        "button-badge-customise",
        "button-badge-dot",
        "button-badge-inline",
        "button-badge-overlay",
        "button-badge-rtl"
      ],
      "diff": {
        "ignore": [
          "/ui5/ax/0/children/0/children/0",
          "/ui5/ax/0/children/0/children/1"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0"
        ],
        "reason": "UI5 Button and ButtonBadge shadow and slot hosts add unnamed generic nodes. The form-associated Button host repeats implicit validity. Compare the actual native button, its name, state, and every text descendant."
      }
    },
    {
      "cases": [
        "button-badge-disabled"
      ],
      "diff": {
        "ignore": [
          "/ui5/ax/0/children/0",
          "/ui5/ax/0/children/1"
        ],
        "ui5FormHosts": [],
        "reason": "UI5 Button and ButtonBadge shadow and slot hosts add unnamed generic nodes. The form-associated Button host repeats implicit validity. Compare the actual native button, its name, state, and every text descendant."
      }
    },
    {
      "cases": [
        "button-badge-empty",
        "button-badge-icon"
      ],
      "diff": {
        "ignore": [
          "/ui5/ax/0/children/0/children/0"
        ],
        "ui5FormHosts": [
          "/ui5/ax/0"
        ],
        "reason": "UI5 Button and ButtonBadge shadow and slot hosts add unnamed generic nodes. The form-associated Button host repeats implicit validity. Compare the actual native button, its name, state, and every text descendant."
      }
    }
  ],
  cases: [
    { id: "button-badge-inline", props: { design: "InlineText", text: "1" } },
    { id: "button-badge-overlay", props: { design: "OverlayText", text: "99+" } },
    { id: "button-badge-dot", props: { design: "AttentionDot", text: "8" } },
    { id: "button-badge-empty", props: { design: "OverlayText" } },
    { id: "button-badge-icon", props: { design: "OverlayText", text: "12", icon: true } },
    { id: "button-badge-disabled", props: { design: "InlineText", text: "6", disabled: true } },
    { id: "button-badge-rtl", props: { design: "OverlayText", text: "99+", rtl: true } },
    { id: "button-badge-customise", props: { design: "InlineText", text: "12", styled: true } },
  ],
  react: ({ design, text, icon, disabled, rtl, styled }) =>
    <Button disabled={disabled} dir={rtl ? "rtl" : undefined} size={icon ? "icon" : "default"} aria-label={icon ? "Notifications" : undefined}
      badge={<ButtonBadge {...(styled ? { role: "button", tabIndex: 7, "aria-label": "Caller name" } : {})} design={design} text={text} classNames={styled ? { root: "badge-root", tag: "badge-tag" } : undefined} />}
    >{icon ? <Icon icon={bell} /> : "Notifications"}</Button>,
})
