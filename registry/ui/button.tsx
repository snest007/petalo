// Portions derived from SAP's open-source UI5 projects (UI5 Web Components 2.28 / OpenUI5),
// © SAP SE or an SAP affiliate company and UI5 contributors, licensed under Apache-2.0.
// Modified by petalo: ported to React. SPDX-License-Identifier: Apache-2.0

import * as React from "react"
import { useFioriTexts, useFioriLocale } from "@/lib/fiori-locale"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

// Mirrors ui5-button (Horizon). Variants are Fiori's own button designs, not shadcn's.
// Every value comes from --sapButton_* tokens or --fiori-button-* parameters (density aware).
const buttonVariants = cva(
  [
    "fiori-button relative inline-flex shrink-0 items-center justify-center whitespace-nowrap select-none align-middle",
    "h-(--fiori-button-base-height) min-w-(--fiori-button-base-min-width) px-(--fiori-button-base-padding)",
    "rounded-(--fiori-button-border-radius) border-(length:--sapButton_BorderWidth) border-solid",
    "font-(family-name:--fiori-button-fontfamily) text-(length:--sapFontSize) leading-[normal]",
    "cursor-pointer outline-none [-webkit-tap-highlight-color:transparent]",
    "gap-(--fiori-button-base-icon-margin) [&_svg]:shrink-0",
    // Keyboard focus: 2px inner ring inset by 1px (UI5 draws it with ::after).
    "focus-visible:after:pointer-events-none focus-visible:after:absolute focus-visible:after:inset-px focus-visible:after:box-border",
    "focus-visible:after:rounded-(--fiori-button-focused-border-radius) focus-visible:after:content-['']",
    "disabled:cursor-default disabled:opacity-(--sapContent_DisabledOpacity) disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-(--sapButton_Background) border-(--sapButton_BorderColor) text-(--sapButton_TextColor)",
          "hover:bg-(--sapButton_Hover_Background) hover:border-(--sapButton_Hover_BorderColor) hover:text-(--sapButton_Hover_TextColor)",
          "active:bg-(--sapButton_Active_Background) active:border-(--sapButton_Active_BorderColor) active:text-(--sapButton_Active_TextColor)",
          "aria-pressed:bg-(--sapButton_Selected_Background) aria-pressed:border-(--sapButton_Selected_BorderColor) aria-pressed:text-(--sapButton_Selected_TextColor)",
          "aria-pressed:hover:bg-(--sapButton_Selected_Hover_Background) aria-pressed:hover:border-(--sapButton_Selected_Hover_BorderColor)",
        ],
        emphasized: [
          "bg-(--sapButton_Emphasized_Background) border-(--sapButton_Emphasized_BorderColor) text-(--sapButton_Emphasized_TextColor)",
          "border-(length:--fiori-button-emphasized-border-width) font-(family-name:--sapButton_Emphasized_FontFamily)",
          "hover:bg-(--sapButton_Emphasized_Hover_Background) hover:border-(--sapButton_Emphasized_Hover_BorderColor) hover:text-(--sapButton_Emphasized_Hover_TextColor)",
          "active:bg-(--sapButton_Emphasized_Active_Background) active:border-(--sapButton_Emphasized_Active_BorderColor) active:text-(--sapButton_Emphasized_Active_TextColor)",
          // Emphasized focus: contrast ring (::after) over a focus-colored ring (::before).
          "focus-visible:before:pointer-events-none focus-visible:before:absolute focus-visible:before:inset-px focus-visible:before:box-border focus-visible:before:content-['']",
          "focus-visible:before:rounded-(--fiori-button-focused-border-radius) focus-visible:before:[border:var(--fiori-button-emphasized-focused-border-before)]",
        ],
        transparent: [
          "bg-(--sapButton_Lite_Background) border-(--sapButton_Lite_BorderColor) text-(--sapButton_Lite_TextColor)",
          "hover:bg-(--sapButton_Lite_Hover_Background) hover:border-(--sapButton_Lite_Hover_BorderColor) hover:text-(--sapButton_Lite_Hover_TextColor)",
          "active:bg-(--sapButton_Lite_Active_Background) active:border-(--sapButton_Lite_Active_BorderColor) active:text-(--sapButton_Active_TextColor)",
          "aria-pressed:bg-(--sapButton_Selected_Background) aria-pressed:border-(--sapButton_Selected_BorderColor) aria-pressed:text-(--sapButton_Selected_TextColor)",
        ],
        positive: [
          "bg-(--sapButton_Accept_Background) border-(--sapButton_Accept_BorderColor) text-(--sapButton_Accept_TextColor)",
          "hover:bg-(--sapButton_Accept_Hover_Background) hover:border-(--sapButton_Accept_Hover_BorderColor) hover:text-(--sapButton_Accept_Hover_TextColor)",
          "active:bg-(--sapButton_Accept_Active_Background) active:border-(--sapButton_Accept_Active_BorderColor) active:text-(--sapButton_Accept_Active_TextColor)",
        ],
        negative: [
          "bg-(--sapButton_Reject_Background) border-(--sapButton_Reject_BorderColor) text-(--sapButton_Reject_TextColor)",
          "hover:bg-(--sapButton_Reject_Hover_Background) hover:border-(--sapButton_Reject_Hover_BorderColor) hover:text-(--sapButton_Reject_Hover_TextColor)",
          "active:bg-(--sapButton_Reject_Active_Background) active:border-(--sapButton_Reject_Active_BorderColor) active:text-(--sapButton_Reject_Active_TextColor)",
        ],
        attention: [
          "bg-(--sapButton_Attention_Background) border-(--sapButton_Attention_BorderColor) text-(--sapButton_Attention_TextColor)",
          "hover:bg-(--sapButton_Attention_Hover_Background) hover:border-(--sapButton_Attention_Hover_BorderColor) hover:text-(--sapButton_Attention_Hover_TextColor)",
          "active:bg-(--sapButton_Attention_Active_Background) active:border-(--sapButton_Attention_Active_BorderColor) active:text-(--sapButton_Attention_Active_TextColor)",
        ],
      },
      size: {
        default: "",
        // Icon-only: square, no horizontal padding (ui5-button[icon-only]).
        icon: "px-0 w-(--fiori-button-base-min-width) min-w-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

/**
 * @accessibility Tab reaches the native button; Enter and Space activate it. The inner focus ring uses :focus-visible.
 * @accessibility Native aria-label, aria-labelledby and aria-describedby props land on the button (or the asChild host). Label icon-only actions with aria-label; keep the native button keyboard semantics when composing asChild.
 */
type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    texts?: Partial<ButtonTexts>
    /** Place a ButtonBadge in the button’s badge slot. Supported on native buttons. */
    badge?: React.ReactElement<ButtonBadgeSlotProps>
  }

// Structural slot props keep installing Button independent of the optional ButtonBadge item.
type ButtonBadgeSlotProps = {
  design?: "InlineText" | "OverlayText" | "AttentionDot"
  text?: string
  texts?: Partial<ButtonBadgeTexts>
}

type ButtonBadgeTexts = {
  oneItem: (count: string) => string
  manyItems: (count: string) => string
}

const defaultBadgeTexts: ButtonBadgeTexts = {
  oneItem: count => `${count} item`, // UI5 BUTTON_BADGE_ONE_ITEM
  manyItems: count => `${count} items`, // UI5 BUTTON_BADGE_MANY_ITEMS
}
const badgeTextKeys = { oneItem: "BUTTON_BADGE_ONE_ITEM", manyItems: "BUTTON_BADGE_MANY_ITEMS" } as const

function Button({
  className, variant, size, asChild = false, type, texts, badge, children,
  "aria-description": description, "aria-label": label, "aria-labelledby": labelledBy, ...props
}: ButtonProps) {
  const resolved = useFioriTexts(defaultButtonTexts, defaultButtonTextsKeys, texts)
  const { hasProvider } = useFioriLocale()
  // UI5 Button.js/ariaDescriptionText appends the semantic design to the explicit description.
  const semantic = (hasProvider || texts) && variant && variant in resolved ? resolved[variant as keyof ButtonTexts] : undefined
  const ariaDescription = [description, semantic].filter(Boolean).join(" ") || undefined
  const Comp = asChild ? Slot.Root : "button"
  const badgeId = React.useId()
  const badgeTexts = useFioriTexts(defaultBadgeTexts, badgeTextKeys, badge?.props.texts)
  const badgeDesign = badge?.props.design ?? "AttentionDot"
  const badgeText = badge?.props.text
  const showBadge = !asChild && !!badge && (badgeDesign === "AttentionDot" || !!badgeText)
  // Button.js/effectiveBadgeDescriptionText and ariaLabelText append the localized
  // numeric count to the action name. The attention dot contributes no label text.
  const count = showBadge && badgeDesign !== "AttentionDot" && badgeText
    ? badgeTexts[badgeText === "1" ? "oneItem" : "manyItems"](badgeText)
    : undefined
  const simpleText = typeof children === "string" || typeof children === "number" ? children : undefined
  const directName = showBadge && !labelledBy && (label || simpleText !== undefined || children == null)
  const referenceContent = showBadge && !labelledBy && !directName
  const actionId = `${badgeId}-action`
  const actionName = directName ? [label ?? simpleText, count].filter(Boolean).join(" ") || undefined : label
  const actionLabelledBy = directName ? undefined
    : [labelledBy || (referenceContent ? actionId : undefined), count ? badgeId : undefined].filter(Boolean).join(" ") || undefined
  const content = showBadge ? <>
    {referenceContent ? <span id={actionId} className="contents">{children}</span> : children}
    {/* Keep the label and count separated for both visual-label matching and the AX name. */}
    {count ? " " : null}
    {badge}
    {count && !directName && <span id={badgeId} hidden>{count}</span>}
  </> : children
  return (
    <Comp
      data-slot="button"
      aria-description={ariaDescription}
      data-variant={variant ?? "default"}
      type={asChild ? type : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), showBadge && badgeDesign === "InlineText" && "gap-0", className)}
      {...props}
      aria-label={actionName}
      aria-labelledby={actionLabelledBy}
      data-badge-design={badge && !asChild ? badgeDesign : undefined}
    >
      {content}
    </Comp>
  )
}

export { Button, buttonVariants, type ButtonProps, type ButtonTexts, type ButtonBadgeTexts }

type ButtonTexts = { positive: string; negative: string; emphasized: string; attention: string }
const defaultButtonTexts: ButtonTexts = { positive: "Accept", negative: "Reject", emphasized: "Emphasized", attention: "Attention" }
const defaultButtonTextsKeys = { positive: "BUTTON_ARIA_TYPE_ACCEPT", negative: "BUTTON_ARIA_TYPE_REJECT", emphasized: "BUTTON_ARIA_TYPE_EMPHASIZED", attention: "BUTTON_ARIA_TYPE_ATTENTION" } as const
