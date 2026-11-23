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
  const surfaces: Element[] = []
  const triggers = new Map<string, string>()
  function ancestors(node: Element): Element[] {
    const chain: Element[] = []
    for (let el: Element | null = node; el;) {
      chain.push(el)
      const root = el.getRootNode()
      el = el.assignedSlot ?? el.parentElement ?? (root instanceof ShadowRoot ? root.host : null)
    }
    return chain
  }
  for (const root of roots) {
    for (const el of root.querySelectorAll("*")) {
      if (el.shadowRoot) roots.push(el.shadowRoot)
      if (el.matches(popupSelector)) surfaces.push(el)
      const ids = el.getAttribute("aria-controls") ?? el.getAttribute("popovertarget")
      if (!ids) continue
      const owner = ancestors(el).find((parent) => parent.hasAttribute("data-fixture"))?.getAttribute("data-fixture")
      if (owner) for (const id of ids.trim().split(/\s+/)) triggers.set(id, owner)
    }
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
      if (ancestor.matches(":popover-open, :modal")) break
      const style = getComputedStyle(ancestor)
      const fixedBlock = style.transform !== "none" || style.perspective !== "none" || style.filter !== "none"
        || style.backdropFilter !== "none" || /layout|paint|strict|content/.test(style.contain)
        || /transform|perspective|filter/.test(style.willChange)
      if (positioned && (fixedBlock || (positioned === "absolute" && style.position !== "static"))) positioned = undefined
      if (index && !positioned && ancestor !== document.body && ancestor !== document.documentElement) {
        const clip = ancestor.getBoundingClientRect()
        if (style.overflowX !== "visible") { left = Math.max(left, clip.left); right = Math.min(right, clip.right) }
        if (style.overflowY !== "visible") { top = Math.max(top, clip.top); bottom = Math.min(bottom, clip.bottom) }
      }
      if (!positioned && (style.position === "fixed" || style.position === "absolute")) positioned = style.position
    }
    return { left, top, right, bottom }
  }

  const findings: PopupOverflow[] = []
  for (const el of surfaces) {
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue
    const rect = el.getBoundingClientRect()
    if (!(rect.width && rect.height)) continue
    const chain = ancestors(el)
    const painted = paintedBox(rect, chain)
    if (painted.right <= painted.left || painted.bottom <= painted.top) continue
    const caseId = ownerOf(chain)
    const cell = caseId ? cells.get(caseId) : undefined
    const surface = el.id || el.getAttribute("data-slot") || el.localName
    if (!cell) {
      findings.push({ caseId: caseId ?? "<unowned>", surface, pixels: -1 })
      continue
    }
    if (cell.getAttribute("data-fixture-popup-overflow")?.trim()) continue
    const bounds = viewport ? new DOMRect(0, 0, innerWidth, innerHeight) : cell.getBoundingClientRect()
    const pixels = Math.max(bounds.left - painted.left, bounds.top - painted.top, painted.right - bounds.right, painted.bottom - bounds.bottom)
    // Ignore subpixel rounding at fractional flex/transform coordinates.
    if (pixels > 0.5) findings.push({ caseId: caseId!, surface, pixels: Math.ceil(pixels) })
  }
  return findings
}

export async function assertPopupsInCells(page: Page, viewport = false) {
  const findings = await page.evaluate(popupOverflow, { viewport })
  const messages = findings.map(({ caseId, surface, pixels }) => pixels < 0
    ? `${caseId}: cannot identify fixture owner of popup ${surface}`
    : `${caseId}: popup paints outside its cell by ${pixels} px (${surface})`)
  expect.soft(messages, `${new URL(page.url()).pathname} popup containment\n${messages.join("\n")}`).toEqual([])
}
