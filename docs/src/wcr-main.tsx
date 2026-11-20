// The WCR oracle imports only SAP code, neutral fixture inputs and WCR renderers.
import "@ui5/webcomponents-react/dist/Assets.js"
import "@ui5/webcomponents-react/styles.css"
import { boot } from "@ui5/webcomponents-base/dist/Boot.js"
import { setLanguage } from "@ui5/webcomponents-base/dist/config/Language.js"
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme.js"
import { renderFinished } from "@ui5/webcomponents-base/dist/Render.js"
import type UI5Element from "@ui5/webcomponents-base/dist/UI5Element.js"
import { I18nStore } from "@ui5/webcomponents-react-base"
import { ThemeProvider } from "@ui5/webcomponents-react/ThemeProvider"
import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"
import { readPageOptions, snapSlots, type FixtureSet } from "./fixture-types"

const opts = readPageOptions()
document.documentElement.dir = opts.dir
if (opts.locale) {
  document.documentElement.lang = opts.locale
  await setLanguage(opts.locale)
}
await setTheme(opts.theme)
await boot()
document.body.toggleAttribute("data-ui5-compact-size", opts.density === "compact")
document.body.style.cssText = "margin:0;padding:1rem;background:var(--sapBackgroundColor);color:var(--sapTextColor);font-family:var(--sapFontFamily)"

// ThemeProvider and useI18nBundle use this store. Wait for the requested
// bundle before mounting so a default-text render cannot race the capture.
const wcrBundle = "@ui5/webcomponents-react"
if (!I18nStore.getSnapshot()[wcrBundle]) {
  await new Promise<void>((resolve) => {
    const unsubscribe = I18nStore.subscribe(() => {
      if (!I18nStore.getSnapshot()[wcrBundle]) return
      unsubscribe()
      resolve()
    })
    I18nStore.loadBundle(wcrBundle)
  })
}

const modules = import.meta.glob<{ default: FixtureSet }>("./fixtures/*.wcr.tsx", { eager: true })
const sets = Object.values(modules).map((module) => module.default)
  .filter((set) => set.reference === "wcr")
  .sort((a, b) => a.name.localeCompare(b.name))
const fixtures = sets.flatMap((set) => set.cases
  .filter((c) => (!opts.only || c.id === opts.only) && !set.skipCompare?.includes(c.id))
  .map((c) => ({ ...c, render: set.react, tolerance: set.tolerance ?? 0.02 })))

Object.assign(window, { __fixtures: fixtures.map(({ id, tolerance, interact }) => ({ id, tolerance, interact })) })
const root = document.getElementById("root")!
const reactRoot = createRoot(root)
flushSync(() => reactRoot.render(
  <ThemeProvider staticCssInjected>
    <div dir="ltr" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "flex-start" }}>
      {fixtures.map(({ id, props, render }) => (
        <div key={id} data-fixture-slot="" style={{ display: "flex" }}>
          <div dir={opts.dir} data-fixture={id} style={{ display: "inline-flex", padding: "0.25rem", lineHeight: "normal" }}>
            {render(props)}
          </div>
        </div>
      ))}
    </div>
  </ThemeProvider>,
))

// UI5Element.define() registers the tag before its theme/i18n boot finishes.
const elements = [...root.querySelectorAll<UI5Element>("*")].filter((element) => element.localName.startsWith("ui5-"))
await Promise.all(elements.map(async (element) => {
  await customElements.whenDefined(element.localName)
  await element.definePromise
}))
await renderFinished()
await document.fonts.ready
await snapSlots()
document.documentElement.dataset.ready = "true"
