// Portions derived from SAP UI5 Web Components 2.28 (ButtonBadge), © SAP SE or an
// SAP affiliate company and UI5 contributors. SPDX-License-Identifier: Apache-2.0

import { type ButtonBadgeTexts } from "@/components/ui/button"
import { Tag, type TagProps } from "@/components/ui/tag"
import { cn } from "@/lib/utils"

// Bundlers inline NODE_ENV; installed browser projects do not require Node types.
declare const process: { env: { NODE_ENV?: string } }

type ButtonBadgeDesign = "InlineText" | "OverlayText" | "AttentionDot"
type ButtonBadgeSlot = "root" | "tag"

/** @accessibility Use in Button.badge. Button appends the localized item count to its accessible name. */
type ButtonBadgeProps = {
  design?: ButtonBadgeDesign
  /** A numeric count or capped display such as "99+". The attention dot has no text. */
  text?: string
  texts?: Partial<ButtonBadgeTexts>
  tagTexts?: TagProps["texts"]
  className?: string
  /** Experimental slot styling API. */
  classNames?: Partial<Record<ButtonBadgeSlot, string>>
  id?: string
  dir?: "ltr" | "rtl" | "auto"
}

function ButtonBadge({
  design = "AttentionDot", text = "", texts: _texts, tagTexts, className, classNames, id, dir, ...extra
}: ButtonBadgeProps) {
  if (process.env.NODE_ENV !== "production" && Object.keys(extra).some((key) =>
    key === "role" || key === "tabIndex" || key.startsWith("aria-"))) {
    console.warn("ButtonBadge owns its tag semantics and does not accept ARIA or tab stop overrides.")
  }

  // ButtonBadgeTemplate.js renders the Critical tag with its state icon hidden.
  return (
    <span id={id} dir={dir} data-slot="button-badge" data-design={design} className={cn("fiori-button-badge", className, classNames?.root)}>
      <Tag design="critical" hideStateIcon texts={tagTexts} data-slot="button-badge-tag" className={classNames?.tag}>
        {design === "AttentionDot" ? "" : text}
      </Tag>
    </span>
  )
}

export { ButtonBadge, type ButtonBadgeProps, type ButtonBadgeDesign, type ButtonBadgeSlot, type ButtonBadgeTexts }
