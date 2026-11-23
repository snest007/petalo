import { expect, type Page } from "@playwright/test"

export type PopupOverflow = { caseId: string; surface: string; pixels: number }

// Keep this callback self-contained for Playwright's browser context. Visit
// open shadow roots as UI5 renders its visible dialog inside the popup host.
export function popupOverflow({ viewport }: { viewport: boolean }): PopupOverflow[] {
  const cells = new Map([...document.querySelectorAll<HTMLElement>("[data-fixture]")].map((cell) => [cell.dataset.fixture!, cell]))
  if (!cells.size) return []
  const cellsByPrefix = [...cells.keys()].sort((a, b) => b.length - a.length)
  const popupSelector = [
    ":popover-open", ":modal", "dialog[open]", '[role="dialog"]', '[role="alertdialog"]', '[role="tooltip"]',
    "ui5-dialog", "ui5-popover", "ui5-toast", ".sapMPopup-CTX", "[data-radix-popper-content-wrapper]",
    '[data-slot="dialog-content"]', '[data-slot="popover-content"]', '[data-slot="menu-content"]',
    '[data-slot="menu-sub-content"]', '[data-slot="toast"]', "[data-fixture-owner]",
  ].join(",")
  const roots: ParentNode[] = [document]
  const elements: Element[] = []
  const surfaces = new Set<Element>()
  const triggers = new Map<string, string>()
  function composedParent(el: Element): Element | null {
    const root = el.getRootNode()
    return el.assignedSlot ?? el.parentElement ?? (root instanceof ShadowRoot ? root.host : null)
  }
  function ancestors(node: Element): Element[] {
    const chain: Element[] = []
    for (let el: Element | null = node; el; el = composedParent(el)) chain.push(el)
    return chain
  }
  for (const root of roots) {
    for (const el of root.querySelectorAll("*")) {
      elements.push(el)
      if (el.shadowRoot) roots.push(el.shadowRoot)
      if (el.matches(popupSelector)) surfaces.add(el)
      const ids = el.getAttribute("aria-controls") ?? el.getAttribute("popovertarget")
      if (!ids) continue
      const owner = ancestors(el).find((parent) => parent.hasAttribute("data-fixture"))?.getAttribute("data-fixture")
      if (owner) for (const id of ids.trim().split(/\s+/)) triggers.set(id, owner)
    }
  }

  for (const el of elements) {
    if (!triggers.has(el.id) || surfaces.has(el)) continue
    const { position } = getComputedStyle(el)
    // A control's in-flow panels also use aria-controls. Recognize portalled
    // popup targets by their popup role or by their out-of-flow positioning.
    if (el.matches('[role="menu"], [role="listbox"], [role="tree"], [role="grid"]')
      || position === "fixed" || position === "absolute") surfaces.add(el)
  }

  function ownerOf(chain: Element[]) {
    const marked = chain.find((el) => el.hasAttribute("data-fixture-owner"))?.getAttribute("data-fixture-owner")
    if (marked) return marked
    const contained = chain.find((el) => el.hasAttribute("data-fixture"))?.getAttribute("data-fixture")
    if (contained) return contained
    for (const el of chain) {
      const name = triggers.get(el.id)
      if (name) return name
      const opener = (el as HTMLElement & { opener?: string | HTMLElement }).opener
      const root = el.getRootNode() as Document | ShadowRoot
      const trigger = typeof opener === "string" ? root.getElementById?.(opener) ?? document.getElementById(opener) : opener
      if (trigger instanceof HTMLElement) {
        const owner = ancestors(trigger).find((parent) => parent.hasAttribute("data-fixture"))?.getAttribute("data-fixture")
        if (owner) return owner
      }
      const prefixed = el.id && cellsByPrefix.find((id) => el.id === id || el.id.startsWith(id + "-"))
      if (prefixed) return prefixed
    }
    return cells.size === 1 ? cells.keys().next().value : undefined
  }

  // A clipped descendant has a larger layout box than its painted area.
  // Fixed/top-layer surfaces can escape that clipping, so use the actual
  // containing block before intersecting a popup with its clipping ancestors.
  function paintedBox(rect: DOMRect, chain: Element[]) {
    let { left, top, right, bottom } = rect
    let positioned: string | undefined
    for (const [index, ancestor] of chain.entries()) {
      const topLayer = ancestor.matches(":popover-open, :modal")
      const style = getComputedStyle(ancestor)
      const clip = /^rect\(([-.\d]+)px,\s*([-.\d]+)px,\s*([-.\d]+)px,\s*([-.\d]+)px\)$/.exec(style.clip)
      const emptyClip = clip && (style.position === "absolute" || style.position === "fixed")
        && (Number(clip[3]) <= Number(clip[1]) || Number(clip[2]) <= Number(clip[4]))
      if (emptyClip || style.clipPath === "inset(50%)") {
        return { left: 0, top: 0, right: 0, bottom: 0 }
      }
      const fixedBlock = style.transform !== "none" || style.perspective !== "none" || style.filter !== "none"
        || style.backdropFilter !== "none" || /layout|paint|strict|content/.test(style.contain)
        || /transform|perspective|filter/.test(style.willChange)
      if (positioned && (fixedBlock || (positioned === "absolute" && style.position !== "static"))) positioned = undefined
      if (index && !positioned && ancestor !== document.body && ancestor !== document.documentElement) {
        const clip = ancestor.getBoundingClientRect()
        if (style.overflowX !== "visible") { left = Math.max(left, clip.left); right = Math.min(right, clip.right) }
        if (style.overflowY !== "visible") { top = Math.max(top, clip.top); bottom = Math.min(bottom, clip.bottom) }
      }
      if (topLayer) break
      if (!positioned && (style.position === "fixed" || style.position === "absolute")) positioned = style.position
    }
    return { left, top, right, bottom }
  }

  function isTransparentHitArea(el: Element) {
    const root = el.getRootNode()
    // UI5 PopupBlockLayerTemplate draws a pointer interceptor. OpenUI5
    // DialogRenderer adds an oversized resize hit target with a separate icon.
    // Check the icon and every other descendant independently.
    const blockLayer = el.matches("div.ui5-block-layer") && root instanceof ShadowRoot
      && root.host.localName.startsWith("ui5-")
    const resizeHandle = el.matches(".sapMDialog .sapMDialogResizeHandle")
    if ((!blockLayer && !resizeHandle) || [...el.childNodes].some(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
    )) return false
    const style = getComputedStyle(el)
    return style.backgroundColor === "rgba(0, 0, 0, 0)" && style.backgroundImage === "none"
      && style.borderImageSource === "none" && style.boxShadow === "none" && style.outlineStyle === "none"
      && [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth]
        .every((width) => width === "0px")
      && ["::before", "::after"].every((pseudo) => getComputedStyle(el, pseudo).content === "none")
  }

  const findings = new Map<Element, PopupOverflow>()
  const nearest = new Map<Element, Element | null>()
  function popupFor(el: Element): Element | null {
    if (surfaces.has(el)) return el
    if (nearest.has(el)) return nearest.get(el)!
    const parent = composedParent(el)
    const popup = parent ? popupFor(parent) : null
    nearest.set(el, popup)
    return popup
  }

  const owners = new Map<Element, { caseId: string; surface: string; bounds?: DOMRect } | null>()
  for (const el of elements) {
    const popup = popupFor(el)
    if (!popup) continue
    if (!owners.has(popup)) {
      const chain = ancestors(popup)
      const caseId = ownerOf(chain)
      const cell = caseId ? cells.get(caseId) : undefined
      const surface = popup.id || popup.getAttribute("data-slot") || popup.localName
      owners.set(popup, cell?.getAttribute("data-fixture-popup-overflow")?.trim() ? null : {
        caseId: caseId ?? "<unowned>", surface,
        bounds: cell && (viewport ? new DOMRect(0, 0, innerWidth, innerHeight) : cell.getBoundingClientRect()),
      })
    }
    const owner = owners.get(popup)
    if (!owner) continue
    const rect = el.getBoundingClientRect()
    if (!(rect.width && rect.height)) continue
    const { bounds, caseId, surface } = owner
    const excess = (box: Pick<DOMRect, "left" | "top" | "right" | "bottom">) => bounds
      ? Math.max(bounds.left - box.left, bounds.top - box.top, box.right - bounds.right, box.bottom - bounds.bottom)
      : -1
    // Boxes already inside the cell cannot paint outside it after clipping.
    if (bounds && excess(rect) <= 0.5) continue
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) || isTransparentHitArea(el)) continue
    const painted = paintedBox(rect, ancestors(el))
    if (painted.right <= painted.left || painted.bottom <= painted.top) continue
    const pixels = excess(painted)
    if ((!bounds || pixels > 0.5) && (!findings.has(popup) || pixels > findings.get(popup)!.pixels)) {
      findings.set(popup, { caseId, surface, pixels: Math.ceil(pixels) })
    }
  }
  return [...findings.values()]
}

export async function assertPopupsInCells(page: Page, viewport = false) {
  const findings = await page.evaluate(popupOverflow, { viewport })
  const messages = findings.map(({ caseId, surface, pixels }) => pixels < 0
    ? `${caseId}: cannot identify fixture owner of popup ${surface}`
    : `${caseId}: popup paints outside its cell by ${pixels} px (${surface})`)
  expect.soft(messages, `${new URL(page.url()).pathname} popup containment\n${messages.join("\n")}`).toEqual([])
}
