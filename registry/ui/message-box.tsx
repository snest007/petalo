// Portions derived from SAP's UI5 Web Components for React 2.28.2 (Apache-2.0).
// © SAP SE or an SAP affiliate company and UI5 contributors.
// Modified by petalo. SPDX-License-Identifier: Apache-2.0

"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Icon } from "@/components/ui/icon"
import { Text } from "@/components/ui/text"
import { sysHelp2 } from "@/lib/fiori-icons"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"
import { cn } from "@/lib/utils"

declare const process: { env: { NODE_ENV?: string } }

const messageBoxDefaults = {
  confirmation: "Confirmation", // WCR CONFIRMATION
  error: "Error", // WCR ERROR
  information: "Information", // WCR INFORMATION
  success: "Success", // WCR SUCCESS
  warning: "Warning", // WCR WARNING
  abort: "Abort", // WCR ABORT
  cancel: "Cancel", // WCR CANCEL
  close: "Close", // WCR CLOSE
  delete: "Delete", // WCR DELETE
  ignore: "Ignore", // WCR IGNORE
  no: "No", // WCR NO
  ok: "OK", // WCR OK
  retry: "Retry", // WCR RETRY
  yes: "Yes", // WCR YES
  header: "Header", // UI5 DIALOG_HEADER_ARIA_LABEL
  content: "Content", // UI5 DIALOG_CONTENT_ARIA_LABEL
  footer: "Footer", // UI5 DIALOG_FOOTER_ARIA_LABEL
  emphasized: "Default Action", // UI5 BUTTON_ARIA_TYPE_EMPHASIZED
}
const messageBoxTextKeys = {
  confirmation: "wcr:CONFIRMATION", error: "wcr:ERROR", information: "wcr:INFORMATION",
  success: "wcr:SUCCESS", warning: "wcr:WARNING", abort: "wcr:ABORT", cancel: "wcr:CANCEL",
  close: "wcr:CLOSE", delete: "wcr:DELETE", ignore: "wcr:IGNORE", no: "wcr:NO",
  ok: "wcr:OK", retry: "wcr:RETRY", yes: "wcr:YES", header: "DIALOG_HEADER_ARIA_LABEL",
  content: "DIALOG_CONTENT_ARIA_LABEL", footer: "DIALOG_FOOTER_ARIA_LABEL",
  emphasized: "BUTTON_ARIA_TYPE_EMPHASIZED",
} as const

type MessageBoxType = "Confirm" | "Error" | "Information" | "Success" | "Warning"
type MessageBoxAction = "OK" | "Cancel" | "Yes" | "No" | "Abort" | "Retry" | "Ignore" | "Close" | "Delete"
type MessageBoxTexts = typeof messageBoxDefaults
type MessageBoxSlot = "root" | "header" | "icon" | "title" | "body" | "text" | "footer" | "action"
const predefinedActions: readonly string[] = ["OK", "Cancel", "Yes", "No", "Abort", "Retry", "Ignore", "Close", "Delete"]
const variants = {
  Confirm: { state: "none", title: "confirmation", actions: ["OK", "Cancel"] },
  Error: { state: "negative", title: "error", actions: ["Close"] },
  Information: { state: "information", title: "information", actions: ["OK"] },
  Success: { state: "positive", title: "success", actions: ["OK"] },
  Warning: { state: "critical", title: "warning", actions: ["OK"] },
} as const

type MessageBoxProps = Pick<React.ComponentProps<"div">, "id" | "dir" | "className" | "style" | "aria-label" | "aria-description" | "aria-describedby"> & {
  ref?: React.Ref<HTMLDivElement>
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  type?: MessageBoxType
  titleText?: string
  children?: React.ReactNode
  icon?: React.ReactElement
  actions?: readonly (MessageBoxAction | (string & {}))[]
  emphasizedAction?: string
  /** An action label, or the ID of a focusable descendant. */
  initialFocus?: string
  /** Escape dismisses with undefined, as in WCR MessageBox. */
  onClose?: (action: string | undefined) => void
  texts?: Partial<MessageBoxTexts>
  /** Experimental styling of owned parts. */
  classNames?: Partial<Record<MessageBoxSlot, string>>
  /** Render in place for embedded previews. */
  portal?: boolean
}

/** @accessibility An owned alertdialog. Native naming and description props reach the alertdialog surface. */
function MessageBox({
  open, defaultOpen, onOpenChange, type = "Confirm", titleText, children, icon,
  actions, emphasizedAction = "OK", initialFocus, onClose, texts: textOverrides,
  className, classNames, portal = true, dir, ref, id: elementId, style,
  "aria-label": label, "aria-description": description, "aria-describedby": describedBy, ...extra
}: MessageBoxProps) {
  if (process.env.NODE_ENV !== "production") {
    for (const prop of ["role", "aria-modal", "aria-labelledby", "tabIndex"]) {
      if (Object.hasOwn(extra, prop)) console.warn(`MessageBox: ignored custom host ownership prop ${prop}`)
    }
  }
  const texts = useFioriTexts(messageBoxDefaults, messageBoxTextKeys, textOverrides)
  const { dir: localeDir, localized, hasProvider } = useFioriLocale()
  const { state, title, actions: defaultActions } = variants[type]
  const visibleActions = actions?.length ? actions : defaultActions
  const customHeader = !!icon || type === "Confirm"
  const id = React.useId()
  const opener = React.useRef<HTMLElement | null>(null)
  const content = React.useRef<HTMLDivElement>(null)
  const actionButtons = React.useRef<(HTMLButtonElement | null)[]>([])
  const [localOpen, setLocalOpen] = React.useState(defaultOpen ?? false)
  const visible = open ?? localOpen

  function close(action?: string) {
    if (open === undefined) setLocalOpen(false)
    onOpenChange?.(false)
    onClose?.(action)
  }

  return <Dialog open={visible} modal={portal} onOpenChange={(next) => { if (!next) close() }}>
    <DialogContent
      ref={(node) => {
        content.current = node
        if (typeof ref === "function") return ref(node)
        if (ref) ref.current = node
      }}
      id={elementId} style={style} aria-description={description} aria-describedby={describedBy}
      portal={portal}
      state={state}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={label ? undefined : customHeader ? `${id}-title ${id}-text` : `${id}-title`}
      aria-label={label}
      dir={dir ?? (localized || hasProvider ? localeDir : undefined)}
      data-type={type}
      data-slot="message-box"
      data-custom-header={customHeader || undefined}
      className={cn("fiori-message-box", classNames?.root, className)}
      onPointerDownOutside={(event) => event.preventDefault()}
      onInteractOutside={(event) => event.preventDefault()}
      onOpenAutoFocus={(event) => {
        if (!portal) { event.preventDefault(); return }
        const doc = content.current?.ownerDocument
        opener.current = doc?.activeElement instanceof HTMLElement ? doc.activeElement : null
        const index = visibleActions.findIndex((action) => action === initialFocus)
        const byId = initialFocus && doc?.getElementById(initialFocus)
        const target = index >= 0 ? actionButtons.current[index] : byId instanceof HTMLElement && content.current?.contains(byId) ? byId : null
        if (target) { event.preventDefault(); target.focus() }
      }}
      onCloseAutoFocus={(event) => {
        event.preventDefault()
        if (portal && opener.current?.isConnected) opener.current.focus()
      }}
    >
      <DialogHeader data-slot="message-box-header" className={classNames?.header} role="region" aria-label={texts.header}>
        {/* WCR MessageBox uses a custom header only for a supplied icon or Confirm's help icon. */}
        {customHeader && <span data-slot="message-box-icon" className={cn("fiori-message-box__icon", classNames?.icon)} aria-hidden="true" inert>
          {icon ?? <Icon icon={sysHelp2} />}
        </span>}
        <DialogTitle id={`${id}-title`} data-slot="message-box-title" className={classNames?.title}>{titleText || texts[title]}</DialogTitle>
      </DialogHeader>
      <DialogBody data-slot="message-box-body" className={classNames?.body} role="region" aria-label={texts.content}>
        <Text id={`${id}-text`} data-slot="message-box-text" className={classNames?.text}>{children}</Text>
      </DialogBody>
      <DialogFooter data-slot="message-box-footer" className={classNames?.footer} role="region" aria-label={texts.footer}>
        {visibleActions.map((action, index) => {
          const emphasized = action === emphasizedAction
          const lookup = action.toLowerCase() as Lowercase<MessageBoxAction>
          const actionLabel = predefinedActions.includes(action) ? texts[lookup] : undefined
          return <Button key={`${action}-${index}`} ref={(node) => { actionButtons.current[index] = node }}
            type="button" data-slot="message-box-action" data-action={action} data-emphasized={emphasized || undefined}
            variant={emphasized ? "emphasized" : "transparent"} texts={{ emphasized: texts.emphasized }}
            className={cn("min-w-(--message-box-action-min-width)", classNames?.action)} onClick={() => close(action)}>{actionLabel ?? action}</Button>
        })}
      </DialogFooter>
    </DialogContent>
  </Dialog>
}

type MessageBoxOptions = Omit<MessageBoxProps, "open" | "defaultOpen" | "onOpenChange" | "onClose" | "portal">
type Request = { options: MessageBoxOptions; resolve: (action: string | undefined) => void }

/** Render box in the calling tree so the box inherits the caller's providers. Requests are served in order. */
function useMessageBox() {
  const pending = React.useRef<Request[]>([])
  const mounted = React.useRef(true)
  const [current, setCurrent] = React.useState<Request>()
  const show = React.useCallback((options: MessageBoxOptions) => new Promise<string | undefined>((resolve) => {
    if (!mounted.current) { resolve(undefined); return }
    const request = { options, resolve }
    pending.current.push(request)
    if (pending.current.length === 1) setCurrent(request)
  }), [])
  React.useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      for (const request of pending.current.splice(0)) request.resolve(undefined)
    }
  }, [])
  const box = current && <MessageBox {...current.options} open onClose={(action) => {
    if (pending.current[0] !== current) return
    pending.current.shift()
    current.resolve(action)
    setCurrent(pending.current[0])
  }} />
  return { show, box }
}

export { MessageBox, useMessageBox, type MessageBoxProps, type MessageBoxOptions, type MessageBoxType,
  type MessageBoxAction, type MessageBoxSlot, type MessageBoxTexts }
