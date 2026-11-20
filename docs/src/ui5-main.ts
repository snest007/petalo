// UI5 Web Components reference page: the official SAP implementation, used as the visual oracle.
// Renders every case from docs/src/fixtures/*.tsx with its sibling *.ui5.ts renderer.
// Registers themes (and i18n/CLDR) so setTheme can load sap_horizon_dark etc.
import "@ui5/webcomponents/dist/Assets.js"
import "@ui5/webcomponents-localization/dist/Assets.js"
import { setLanguage } from "@ui5/webcomponents-base/dist/config/Language.js"
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import type UI5Element from "@ui5/webcomponents-base/dist/UI5Element.js"

import { readPageOptions, snapSlots, type Ui5Renderer } from "./fixture-types"
import { internals } from "@ui5/webcomponents-base/dist/Device.js"
import { phoneFixtureSets } from "./fixtures-phone"
import { fixtureSets } from "./fixtures"

const phoneRenderers = import.meta.glob<{ default: Ui5Renderer }>("./fixtures-phone/*.ui5.ts", { eager: true })
const phoneMode = new URLSearchParams(location.search).has("fixtures-phone")
// Override only this isolated oracle page, before constructing any phone fixture.
if (phoneMode && new URLSearchParams(location.search).get("device") !== "desktop") internals._isPhone = () => true
const renderers = import.meta.glob<{ default: Ui5Renderer }>("./fixtures/*.ui5.ts", { eager: true })
const rendererFor = (name: string) => phoneMode ? phoneRenderers[`./fixtures-phone/${name}.ui5.ts`]?.default : renderers[`./fixtures/${name}.ui5.ts`]?.default

const opts = readPageOptions()
// UI5 locale/getEffectiveDir.js reads :dir(rtl) before its first render.
document.documentElement.dir = opts.dir
if (opts.locale) await setLanguage(opts.locale)
await setTheme(opts.theme)
if (opts.density === "compact") document.body.setAttribute("data-ui5-compact-size", "")
document.body.style.cssText = `margin:0;padding:${phoneMode ? "0" : "1rem"};background:var(--sapBackgroundColor);font-family:var(--sapFontFamily)`

const root = document.getElementById("root")!
// Match the React grid: direction belongs to each fixture, not grid positioning.
root.dir = "ltr"
root.style.cssText = "display:flex;flex-wrap:wrap;gap:1rem;align-items:flex-start"
const fixtureReadiness: Promise<void>[] = []
const activeSets = phoneMode ? phoneFixtureSets : fixtureSets.filter((set) => set.reference !== "wcr")
;(window as any).__fixtures = activeSets.flatMap((set) => set.cases.map((c) => ({ id: c.id, tolerance: set.tolerance ?? 0.02 })))
for (const set of activeSets) {
  const render = rendererFor(set.name)
  if (!render) continue
  for (const c of set.cases) {
    if (opts.only ? c.id !== opts.only : phoneMode && c.id !== "responsive-popover-phone") continue
    if (set.skipCompare?.includes(c.id)) continue
    const cell = document.createElement("div")
    cell.dir = opts.dir
    cell.dataset.fixture = c.id
    cell.style.cssText = `display:inline-flex;padding:${phoneMode ? "0" : "0.25rem"};line-height:normal`
    const fixture = render(c.props)
    cell.append(fixture)
    if (fixture.fixtureReady) fixtureReadiness.push(fixture.fixtureReady)
    const slot = document.createElement("div")
    slot.dataset.fixtureSlot = ""
    slot.style.display = "flex"
    slot.append(cell)
    root.append(slot)
  }
}

// INTEGRATION cause 4: fixture preparation can await work outside UI5's render queue.
// Finish mounted fixtures before measuring stability, so snapSlots cannot freeze an intermediate box.
await Promise.all(fixtureReadiness)

// Wait for every custom element to be defined and rendered, fonts loaded, and icons drawn
// (ui5-icon fills its <path> asynchronously).
const mountedCustomElements = [...root.querySelectorAll("*")].filter((e) => e.localName.includes("-"))
const tags = new Set(mountedCustomElements.map((e) => e.localName))
await Promise.all([...tags].map((t) => customElements.whenDefined(t)))
// INTEGRATION cause 4: UI5Element.js define() registers the tag before its definePromise
// finishes Boot.js boot() (including applyTheme), i18n/CLDR and onDefine(). Its
// connectedCallback() waits that promise before the first render; Render.js renderFinished()
// only drains registered tags/render queues. Finish initialization before fonts/slot measurement.
await Promise.all(mountedCustomElements.map((e) => (e as UI5Element).definePromise))
await renderFinished()
await document.fonts.ready
const shadowIcons = (node: ParentNode): Element[] =>
  [...node.querySelectorAll("*")].flatMap((e) => [
    ...(e.localName === "ui5-icon" || e.hasAttribute("ui5-icon") ? [e] : []),
    ...(e.shadowRoot ? shadowIcons(e.shadowRoot) : []),
  ])
const iconsDrawn = () => shadowIcons(root).every((i) => !i.getAttribute("name") || i.shadowRoot?.querySelector("path"))
for (let i = 0; i < 300 && !iconsDrawn(); i++) await new Promise((r) => requestAnimationFrame(r))
await renderFinished()
// ui5-illustrated-message (also inside other shadow roots) picks its media from a ResizeObserver and
// loads its SVG asynchronously, so it settles after renderFinished. With design="Auto" it can pass through
// "base" while its parent is still being laid out, so "base" only counts once the width really calls for it.
const deepAll = (node: ParentNode): Element[] => [...node.querySelectorAll("*")].flatMap((e) => [e, ...(e.shadowRoot ? deepAll(e.shadowRoot) : [])])
const illustrationSettled = (m: HTMLElement) => {
  const media = m.getAttribute("media")
  if (media === "base") return m.getAttribute("design") === "Base" || m.offsetWidth <= 160
  return !!media && !!m.shadowRoot?.querySelector(".ui5-illustrated-message-illustration svg")
}
const illustrationsDrawn = () =>
  deepAll(root)
    .filter((e): e is HTMLElement => e.localName === "ui5-illustrated-message")
    .every(illustrationSettled)
// A nested illustrated message may not exist yet on a sparse page (an empty list passes the check above),
// and slots get pinned to their measured size below. So also require the cells' sizes to hold still.
const cellSizes = () => [...root.querySelectorAll<HTMLElement>("[data-fixture]")].map((c) => `${c.offsetWidth}x${c.offsetHeight}`).join()
let lastSizes = ""
for (let i = 0, stable = 0; i < 600 && stable < 10; i++) {
  await new Promise((r) => requestAnimationFrame(r))
  const sizes = cellSizes()
  stable = sizes === lastSizes && illustrationsDrawn() ? stable + 1 : 0
  lastSizes = sizes
}
await renderFinished()
// setTheme resolves before the theme's CSS variables are applied; wait until the background is the theme's.
const EXPECTED_BG: Record<string, string> = { sap_horizon: "#f5f6f7", sap_horizon_dark: "#12171c", sap_horizon_hcb: "#000", sap_horizon_hcw: "#fff" }
const bg = () => getComputedStyle(document.documentElement).getPropertyValue("--sapBackgroundColor").trim().toLowerCase()
for (let i = 0; i < 300 && EXPECTED_BG[opts.theme] && bg() !== EXPECTED_BG[opts.theme]; i++)
  await new Promise((r) => requestAnimationFrame(r))
await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
await snapSlots()
document.documentElement.dataset.ready = "true"
