import * as React from "react"
import { createRoot } from "react-dom/client"

import * as icons from "@/lib/fiori-icons"
import type { FioriIconData } from "@/lib/fiori-icons"
import { Button } from "@/components/ui/button"
import { FioriLocaleProvider, type FioriTexts } from "@/lib/fiori-locale"
import { StepInput } from "@/components/ui/step-input"
import { Calendar } from "@/components/ui/calendar"
import { DatePicker } from "@/components/ui/date-picker"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { TimePicker } from "@/components/ui/time-picker"
import { ComboBox, ComboBoxItem, ComboBoxItemGroup } from "@/components/ui/combobox"
import { ValueHelpDialog, type ValueHelpTexts } from "@/components/ui/value-help-dialog"
import { Slider, RangeSlider } from "@/components/ui/slider"
import { ProgressIndicator } from "@/components/ui/progress-indicator"
import { ObjectNumber } from "@/components/ui/object-number"
import { Table } from "@/components/ui/table"
import { DataTable, createDataTableColumnHelper } from "@/components/ui/data-table"
import { MessageStrip } from "@/components/ui/message-strip"
import { Token } from "@/components/ui/token"
import { Tokenizer } from "@/components/ui/tokenizer"
import { Wizard, WizardStep } from "@/components/ui/wizard"
import { TextArea } from "@/components/ui/textarea"
import { Breadcrumbs, BreadcrumbsItem } from "@/components/ui/breadcrumbs"
import { List, ListItemGroup, ListItemStandard } from "@/components/ui/list"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { FileUploader } from "@/components/ui/file-uploader"
import { ViewSettingsDialog } from "@/components/ui/view-settings-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog"
import { Icon } from "@/components/ui/icon"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tag } from "@/components/ui/tag"
import { SegmentedButton, SegmentedButtonItem } from "@/components/ui/segmented-button"
import { NavigationLayout, type NavigationLayoutMode } from "@/components/ui/navigation-layout"
import { ShellBar, ShellBarBranding, ShellBarSpacer } from "@/components/ui/shell-bar"
import { SideNavigation, SideNavigationGroup, SideNavigationItem } from "@/components/ui/side-navigation"

import type { ComponentDocs, Demo, DemoCategory } from "./demos/types"
import { FIELD_WIDTH, readPageOptions, snapSlots } from "./fixture-types"
import { fixtureSets } from "./fixtures"
import { phoneFixtureSets } from "./fixtures-phone"
import { sapui5FixtureSets } from "./fixtures-sapui5"
import iconNames from "./icon-names.json"
import "./index.css"

const iconByName = new Map<string, FioriIconData>(
  (iconNames as [string, string][]).map(([name, id]) => [name, (icons as Record<string, FioriIconData>)[id]])
)

const demos = Object.values(import.meta.glob<{ default: Demo }>("./demos/*.tsx", { eager: true }))
  .map((m) => m.default)
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.title.localeCompare(b.title))

const opts = readPageOptions()
document.documentElement.dir = opts.dir
document.documentElement.dataset.theme = opts.theme
document.documentElement.dataset.density = opts.density

const query = new URLSearchParams(location.search)
const phoneMode = query.has("fixtures-phone")
// The paired interactive fixtures also exercise the same controls on desktop;
// keep the default phone matrix and ordinary desktop fixture routes unchanged.
if (phoneMode) document.documentElement.dataset.fioriDevice = query.get("device") === "desktop" ? "desktop" : "phone"
const webFixtureSets = fixtureSets.filter((set) => (set.reference ?? "ui5") === (query.get("ref") === "wcr" ? "wcr" : "ui5"))
const activeFixtureSets = phoneMode ? phoneFixtureSets : query.has("fixtures-sapui5") ? sapui5FixtureSets : webFixtureSets

// E5: packs use original SAP keys; applications own document direction independently.
const languagePacks = import.meta.glob<FioriTexts>("../../registry/i18n/*.json", { eager: true, import: "default" })
function packFor(locale: string): FioriTexts {
  const tag = locale === "zh-CN" || locale === "zh-TW" ? locale : new Intl.Locale(locale).language
  return languagePacks[`../../registry/i18n/${tag}.json`] ?? {}
}

function FixtureGrid() {
  React.useEffect(() => {
    document.fonts.ready.then(snapSlots).then(() => (document.documentElement.dataset.ready = "true"))
  }, [])
  return (
    // The grid remains left-to-right so overwide fixture rows stay inside full-page screenshots.
    // Each cell inherits the requested direction independently of harness positioning.
    <div dir="ltr" className="flex flex-wrap items-start gap-4" style={{ "--w": FIELD_WIDTH } as React.CSSProperties}>
      {activeFixtureSets.flatMap((set) =>
        set.cases
          .filter((c) => opts.only ? c.id === opts.only : !phoneMode || c.id === "responsive-popover-phone")
          .map((c) => (
            // Each cell sits in a slot rounded up to whole pixels so one fractional-width cell can't shift
            // every following cell onto sub-pixel positions (which changes anti-aliasing).
            <div key={c.id} data-fixture-slot="" className="flex">
              <div dir={opts.dir} data-fixture={c.id} data-fixture-popup-overflow={c.popupOverflowReason} className={phoneMode ? "inline-flex leading-[normal]" : "inline-flex p-1 leading-[normal]"}>
                {set.react(c.props)}
              </div>
            </div>
          ))
      )}
    </div>
  )
}

const THEMES = [
  ["sap_horizon", "Morning Horizon"],
  ["sap_horizon_dark", "Evening Horizon"],
  ["sap_horizon_hcb", "High Contrast Black"],
  ["sap_horizon_hcw", "High Contrast White"],
] as const

type Usage = {
  summary: string
  useWhen: string[]
  avoidWhen: { when: string; use?: string[] }[]
  source: "sap-fiori-guidelines" | "ui5-apidoc"
  layout?: string[]
  variations?: string[]
}
type RegistryItem = { title: string; description?: string; usage?: Usage }
const itemName = (path: string) => path.split("/").pop()!.replace(/\.json$/, "")
const registryItems = Object.fromEntries(
  Object.entries(import.meta.glob<RegistryItem>("../../registry/items/*.json", { eager: true, import: "default" }))
    .map(([path, item]) => [itemName(path), item])
)
const blocks = Object.entries(import.meta.glob<RegistryItem>("../../registry/block-items/*.json", { eager: true, import: "default" }))
  .map(([path, item]) => ({ name: itemName(path), ...item }))
  .sort((a, b) => a.title.localeCompare(b.title))
const categories: DemoCategory[] = ["Actions", "Forms", "Dates", "Data", "Overlays", "Display", "Navigation", "Layout"]
type ComponentPage = { name: string; title: string; category: DemoCategory; examples: { demo: Demo; docs: ComponentDocs }[] }
const pageByName = new Map<string, ComponentPage>()
for (const demo of demos) {
  for (const docs of demo.docs) {
    const item = registryItems[docs.name]
    if (!item) throw new Error(`Unknown docs Registry item: ${docs.name}`)
    const page = pageByName.get(docs.name) ?? { name: docs.name, title: item.title, category: demo.category, examples: [] }
    if (page.category !== demo.category) throw new Error(`Inconsistent docs category: ${docs.name}`)
    page.examples.push({ demo, docs })
    pageByName.set(docs.name, page)
  }
}
for (const name of Object.keys(registryItems)) {
  if (name === "locale") continue
  if (!pageByName.has(name)) throw new Error(`Missing component docs: ${name}`)
}
const pages = [...pageByName.values()].sort((a, b) => a.title.localeCompare(b.title))
const publicRoutes = [...pages.map(({ name, title }) => ({ name, title })), ...blocks.map(({ name, title }) => ({ name, title })), { name: "icons", title: "SAP Horizon icons" }, { name: "floorplans", title: "Floorplans" }, { name: "i18n", title: "Localization" }, { name: "locale", title: "Fiori locale" }]
const validRoutes = new Set([...publicRoutes.map(({ name }) => name), "all"])

function routeFromHash(fallback = "button") {
  // Demo links such as #subtle and #breadcrumbs-home remain native anchors. Keep the owning
  // component in history state so Back also restores that page after following one of those links.
  if (!location.hash.startsWith("#/")) return history.state?.docsRoute ?? fallback
  try {
    const route = decodeURIComponent(location.hash.slice(2))
    return validRoutes.has(route) ? route : "button"
  } catch {
    return "button"
  }
}

function useDocsRoute() {
  const [route, setRoute] = React.useState(() => routeFromHash())
  const current = React.useRef(route)
  React.useEffect(() => {
    const update = () => {
      const next = routeFromHash(current.current)
      current.current = next
      history.replaceState({ ...history.state, docsRoute: next }, "", location.hash ? undefined : "#/button")
      setRoute(next)
    }
    update()
    window.addEventListener("hashchange", update)
    return () => window.removeEventListener("hashchange", update)
  }, [])
  return route
}

const wideScreen = () => window.matchMedia("(min-width: 600px)")
const subscribeWidth = (update: () => void) => {
  const media = wideScreen()
  media.addEventListener("change", update)
  return () => media.removeEventListener("change", update)
}

function DocsShell({ mode, onModeChange }: { mode: NavigationLayoutMode; onModeChange: (mode: NavigationLayoutMode) => void }) {
  // NavigationLayout.js calcSideCollapsed / _handleItemClick (UI5 2.28) use the 600px screen
  // boundary; the existing layout handles closing the navigation after a phone item is selected.
  const wide = React.useSyncExternalStore(subscribeWidth, () => wideScreen().matches, () => true)
  const expanded = mode === "expanded" || (mode === "auto" && wide)
  const set = (k: string, v: string) => {
    const q = new URLSearchParams(location.search)
    q.set(k, v)
    location.search = q.toString()
  }
  return (
    // NavigationLayout supplies the banner. A section scopes ShellBar's own header so the
    // composed shell exposes a single banner landmark, including on the all-demos route.
    <section>
      <ShellBar
        texts={{ label: "Component library header", additionalInfo: "Display settings" }}
        startButton={<Button id="docs-menu" variant="transparent" size="icon" aria-label="Toggle component navigation" aria-controls="docs-navigation" aria-expanded={expanded} onClick={() => onModeChange(expanded ? "collapsed" : "expanded")}><Icon icon={icons.menu2} /></Button>}
        branding={<ShellBarBranding href="#/button">petalo</ShellBarBranding>}
        content={<>
          <ShellBarSpacer />
          <Button key="storybook" asChild><a href={import.meta.env.PROD ? "./storybook/" : "http://localhost:6006/"}>Storybook</a></Button>
          <div key="theme" className="flex items-center gap-2">
            <Label htmlFor="docs-theme" className="sr-only lg:not-sr-only">Theme</Label>
            <Select value={opts.theme} onValueChange={(v) => set("theme", v)}>
              <SelectTrigger id="docs-theme" wrapperClassName="w-36 sm:w-52"><SelectValue /></SelectTrigger>
              <SelectContent>{THEMES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button key="density" id="docs-density" aria-pressed={opts.density === "compact"} onClick={() => set("density", opts.density === "compact" ? "cozy" : "compact")}>Compact</Button>
        </>}
      />
    </section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-(--sapGroup_BorderCornerRadius) bg-(--sapGroup_ContentBackground) p-6 shadow-(--sapContent_Shadow0)">
      <h2 className="mb-4 font-(family-name:--sapFontHeaderFamily) text-(length:--sapFontHeader4Size) text-(--sapGroup_TitleTextColor)">{title}</h2>
      {children}
    </section>
  )
}

function IconsPage() {
  const [query, setQuery] = React.useState("")
  const matches = (iconNames as [string, string][]).filter(([n]) => n.includes(query.trim())).slice(0, 120)
  return (
    <div className="grid gap-6">
      <Install name="icons" />
      <p>The Icon component and tree-shakeable SAP Horizon icon data install together.</p>
      <PropsTable props={[{ name: "Icon.icon", type: "FioriIconData", description: "Required SAP icon data imported from fiori-icons." }, { name: "Icon.label", type: "string", description: "Accessible name; omit for a decorative icon." }]} />
        <Section title={`Icons (${iconNames.length})`}>
          <Input aria-label="Filter icons" placeholder="Filter icons" value={query} onChange={(e) => setQuery(e.target.value)} wrapperClassName="mb-4 max-w-xs" />
          <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
            {matches.map(([n]) => (
              <div key={n} className="flex flex-col items-center gap-2 rounded-md p-2 text-center text-(length:--sapFontSmallSize) text-(--sapContent_LabelColor) hover:bg-(--sapList_Hover_Background)">
                <Icon icon={iconByName.get(n)!} className="size-6 text-(--sapContent_IconColor)" />
                <span className="break-all">{n}</span>
              </div>
            ))}
          </div>
        </Section>
    </div>
  )
}

function Install({ name }: { name: string }) {
  return <pre className="overflow-x-auto rounded-(--sapElement_BorderCornerRadius) border border-(--sapGroup_ContentBorderColor) bg-(--sapList_Background) p-4"><code>{`npx shadcn add @petalo/${name}`}</code></pre>
}

function PropsTable({ props }: { props: ComponentDocs["props"] }) {
  return <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-(length:--sapFontSmallSize)">
    <caption className="mb-2 text-left font-(family-name:--sapFontBoldFamily)">Main props</caption>
    <thead className="bg-(--sapList_HeaderBackground) text-(--sapList_HeaderTextColor)"><tr>{["Prop", "Type", "Default", "Description"].map((label) => <th key={label} scope="col" className="border-b border-(--sapList_BorderColor) p-3">{label}</th>)}</tr></thead>
    <tbody>{props.map((prop) => <tr key={prop.name}><th scope="row" className="border-b border-(--sapList_BorderColor) p-3 font-normal"><code>{prop.name}</code></th><td className="border-b border-(--sapList_BorderColor) p-3"><code>{prop.type}</code></td><td className="border-b border-(--sapList_BorderColor) p-3"><code>{prop.defaultValue ?? "—"}</code></td><td className="border-b border-(--sapList_BorderColor) p-3">{prop.description}</td></tr>)}</tbody>
  </table></div>
}

const ui5Sets = new Set(Object.keys(import.meta.glob("./fixtures/*.ui5.ts")).map((path) => path.split("/").pop()!.replace(/\.ui5\.ts$/, "")))
const pageQuery = () => new URLSearchParams({ theme: opts.theme, density: opts.density })
function FixtureLinks({ docs }: { docs: ComponentDocs }) {
  const name = docs.fixtureSet ?? docs.name
  const set = fixtureSets.find((set) => set.name === name) ?? sapui5FixtureSets.find((set) => set.name === name)
  if (!set) return <p className="text-(--sapContent_LabelColor)">Reference: demonstrated by the consuming component.</p>
  // E1's only= is an exact case ID. Component names such as button are not fixture prefixes.
  const fixture = set.cases.find((c) => c.id === docs.fixtureId) ?? set.cases.find((c) => !set.skipCompare?.includes(c.id)) ?? set.cases[0]
  const q = pageQuery()
  q.set(sapui5FixtureSets.includes(set) ? "fixtures-sapui5" : "fixtures", "")
  q.set("only", fixture.id)
  const hasUi5 = ui5Sets.has(name) && !set.skipCompare?.includes(fixture.id)
  const reference = pageQuery()
  reference.set("only", fixture.id)
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-(--sapContent_LabelColor)">
    <a className="text-(--sapLinkColor) underline" data-docs-fixture={fixture.id} href={`${import.meta.env.BASE_URL}index.html?${q}`}>Fixtures</a>
    {hasUi5 ? <a className="text-(--sapLinkColor) underline" data-docs-reference={fixture.id} href={`${import.meta.env.BASE_URL}ui5.html?${reference}`}>UI5 reference</a> : <span>Reference: {sapui5FixtureSets.includes(set) ? "SAPUI5 local comparison harness" : "Fiori guideline review"}; no UI5 Web Components reference.</span>}
  </div>
}

function ComponentContent({ page }: { page: ComponentPage }) {
  const props = [...new Map(page.examples.flatMap(({ docs }) => docs.props).map((prop) => [prop.name, prop])).values()]
  return <div className="grid gap-6">
    <Install name={page.name} />
    {page.examples.map(({ demo, docs }) => <React.Fragment key={demo.title}><p>{docs.description}</p><FixtureLinks docs={docs} /><Section title={demo.title}><demo.Demo /></Section></React.Fragment>)}
    {registryItems[page.name].usage && <Section title="When to use"><UsageGuidance usage={registryItems[page.name].usage!} /></Section>}
    <PropsTable props={props} />
  </div>
}

function UsageGuidance({ usage }: { usage: Usage }) {
  return <div className="grid gap-4" data-usage-guidance="">
    <p>{usage.summary}</p>
    <div><h3 className="mb-2 font-bold">Use when</h3><ul className="list-disc space-y-2 ps-6">{usage.useWhen.map((text) => <li key={text}>{text}</li>)}</ul></div>
    <div><h3 className="mb-2 font-bold">Don't use when</h3><ul className="list-disc space-y-2 ps-6">{usage.avoidWhen.map((entry) => <li key={entry.when}>{entry.when}{!!entry.use?.length && <> → {entry.use.map((name, index) => <React.Fragment key={name}>{index > 0 && ", "}<a className="text-(--sapLinkColor) underline" href={`#/${name}`}>{registryItems[name]?.title ?? blocks.find((block) => block.name === name)?.title ?? name}</a></React.Fragment>)}</>}</li>)}</ul></div>
    {usage.layout && <div><h3 className="mb-2 font-bold">Layout</h3><pre className="overflow-x-auto rounded-(--sapElement_BorderCornerRadius) bg-(--sapBackgroundColor) p-4"><code>{usage.layout.join("\n")}</code></pre></div>}
    {usage.variations && <div><h3 className="mb-2 font-bold">Variations</h3><ul className="list-disc space-y-2 ps-6">{usage.variations.map((text) => <li key={text}>{text}</li>)}</ul></div>}
  </div>
}

const blockHref = (name: string) => `${import.meta.env.BASE_URL}block.html?${new URLSearchParams({ name, theme: opts.theme, density: opts.density })}`
function Floorplans({ name }: { name?: string }) {
  return <div className="grid gap-6">{blocks.filter((block) => !name || block.name === name).map((block) => <Section key={block.name} title={block.title}><div className="grid gap-4"><p>{block.description}</p><Install name={block.name} /><a className="text-(--sapLinkColor) underline" href={blockHref(block.name)}>Open {block.title}</a>{block.usage && <UsageGuidance usage={block.usage} />}</div></Section>)}</div>
}

function Docs() {
  const route = useDocsRoute()
  const [mode, setMode] = React.useState<NavigationLayoutMode>("auto")
  React.useEffect(() => {
    document.fonts.ready.then(() => (document.documentElement.dataset.ready = "true"))
  }, [])
  const page = pageByName.get(route)
  const block = blocks.find((block) => block.name === route)
  const title = page?.title ?? block?.title ?? (route === "locale" ? "Fiori locale" : route === "i18n" ? "Localization" : route === "icons" ? "SAP Horizon icons" : route === "floorplans" ? "Floorplans" : "All component demos")
  // NavigationLayout.css's ".fiori-nl[data-side-collapsed] .fiori-nl__aside" also matches
  // nested light-DOM demos (UI5 isolates each layout in shadow DOM). Reset only the preview
  // layout's own expanded aside; the collapsed docs and preview transforms remain unchanged.
  // Contain NavigationLayout.css's header/aside stacking in this shell so body-hosted surfaces
  // keep their own paint order above it.
  return <div data-docs-shell="" className="relative isolate h-dvh">
    <style>{`[data-docs-shell] main .fiori-nl:not([data-side-collapsed]) > .fiori-nl__root > .fiori-nl__section > .fiori-nl__aside { transform: none; }`}</style>
    <NavigationLayout mode={mode} onModeChange={setMode} header={<DocsShell mode={mode} onModeChange={setMode} />} sideContent={
    <SideNavigation id="docs-navigation" accessibleName="Component library navigation" value={route} texts={{ primaryListLabel: "Components by category" }}>
      {categories.map((category) => <SideNavigationGroup key={category} text={category} defaultExpanded>
        {pages.filter((page) => page.category === category).map((page) => <SideNavigationItem key={page.name} value={page.name} text={page.title} icon={icons.product} href={`#/${page.name}`} />)}
        {category === "Display" && <><SideNavigationItem value="icons" text="Icons" icon={icons.grid} href="#/icons" /><SideNavigationItem value="i18n" text="Localization" icon={icons.world} href="#/i18n" /></>}
      </SideNavigationGroup>)}
      <SideNavigationGroup text="Floorplans" defaultExpanded><SideNavigationItem value="floorplans" text="Overview" icon={icons.home} href="#/floorplans" />{blocks.map((block) => <SideNavigationItem key={block.name} text={block.title} icon={icons.document} href={blockHref(block.name)} />)}</SideNavigationGroup>
    </SideNavigation>
  }>
    <main key={route} data-docs-route={route} className="mx-auto grid max-w-6xl gap-6 p-6 text-(--sapTextColor)">
      <h1 className="font-(family-name:--sapFontHeaderFamily) text-(length:--sapFontHeader2Size)">{title}</h1>
      {page ? <ComponentContent page={page} /> : route === "i18n" || route === "locale" ? <><Install name="locale" /><I18nPage /></> : route === "icons" ? <IconsPage /> : route === "floorplans" || block ? <Floorplans name={block?.name} /> : <>{demos.map(({ title, Demo }) => <Section key={title} title={title}><Demo /></Section>)}<IconsPage /></>}
    </main>
    </NavigationLayout>
  </div>
}

const i18nColumn = createDataTableColumnHelper<{ name: string }>()
const i18nColumns = [i18nColumn.accessor("name", { header: "Name" })]
const i18nValueHelpItems = [{ id: "a", name: "Äther" }, { id: "z", name: "Zulu" }]
const i18nValueHelpColumns = [{ key: "name", label: "Name" }]
function I18nValueHelpExample({ id, title, empty = false, texts }: { id: string; title: string; empty?: boolean; texts?: Partial<ValueHelpTexts> }) {
  const [open, setOpen] = React.useState(false)
  return <section id={id}><ValueHelpDialog title={title} open={open} onOpenChange={setOpen} keyField="id" columns={i18nValueHelpColumns} items={i18nValueHelpItems} defaultValue={empty ? undefined : { keys: ["a"], conditions: [{ operator: "EQ", values: ["A"] }] }} texts={texts}><Button onClick={() => setOpen(true)}>Open {title}</Button></ValueHelpDialog></section>
}

function I18nPage() {
  const [locale, setLocale] = React.useState(query.get("locale") ?? "de-DE")
  const [value, setValue] = React.useState(1.5)
  const [slider, setSlider] = React.useState(0.5)
  const [range, setRange] = React.useState<[number, number]>([0.5, 1.5])
  const [count, setCount] = React.useState(2)
  const [deletableTokens, setDeletableTokens] = React.useState(["Alpha", "Beta", "Gamma"])
  const [viewSettingsOpen, setViewSettingsOpen] = React.useState(false)
  const [customViewSettingsOpen, setCustomViewSettingsOpen] = React.useState(false)
  const [acceptedSegment, setAcceptedSegment] = React.useState("a")
  const [rejectedSegmentAttempts, setRejectedSegmentAttempts] = React.useState(0)
  const [callbackAnnouncement, setCallbackAnnouncement] = React.useState("not called")
  const plural = query.has("plurals") ? { TOKENIZER_SHOW_ALL_ITEMS: { one: "{0} one", two: "{0} two", few: "{0} few", many: "{0} many", zero: "{0} zero", other: "{0} other" }, MULTIINPUT_SHOW_MORE_TOKENS: { one: "{0} one", two: "{0} two", few: "{0} few", many: "{0} many", zero: "{0} zero", other: "{0} other" } } as FioriTexts : {}
  return <div className="grid gap-6">
    <p>Set the language and optional SAP text pack once with FioriLocaleProvider. Existing component text props have precedence. Applications set direction on their own root.</p>
    <pre>{`import de from "@/lib/fiori-i18n/de"
<FioriLocaleProvider locale="de-DE" texts={de}>…</FioriLocaleProvider>`}</pre>
    <label>Locale <select aria-label="Locale" value={locale} onChange={(event) => setLocale(event.target.value)}>{["en-US", "de-DE", "fr-FR", "sv-SE", "zh-CN", "ar-EG", "ru"].map(tag => <option key={tag}>{tag}</option>)}</select></label>
    <FioriLocaleProvider locale={locale} texts={{ ...packFor(locale), ...plural }}>
      <div id="i18n-demo" dir={/^(ar|he|fa|ur)/.test(locale) ? "rtl" : "ltr"} className="grid gap-4">
        <div id="i18n-step"><StepInput defaultValue={1.5} valuePrecision={1} step={0.1} aria-label="Quantity" onValueChange={setValue} /><output data-testid="i18n-value">{String(value)}</output></div>
        <div id="i18n-override"><StepInput defaultValue={1} texts={{ increment: "Component increase" }} aria-label="Override quantity" /></div>
        <div id="i18n-date"><DatePicker formatPattern="MMM d, y" aria-label="Localized date" /></div>
        <section id="i18n-validation" aria-label="Localized form validation">
          <DatePicker id="i18n-date-validity" required minDate={new Date(2024, 2, 8)} maxDate={new Date(2024, 2, 25)} formatPattern="yyyy-MM-dd" aria-label="Date between 8 and 25 March" />
          <DateRangePicker id="i18n-range-validity" required minDate={new Date(2024, 2, 8)} maxDate={new Date(2024, 2, 25)} formatPattern="yyyy-MM-dd" aria-label="Date range between 8 and 25 March" />
          <DateTimePicker id="i18n-datetime-validity" required minDate={new Date(2024, 2, 8)} maxDate={new Date(2024, 2, 25)} formatPattern="yyyy-MM-dd HH:mm:ss" aria-label="Date and time between 8 and 25 March" />
          <TimePicker id="i18n-time-validity" required formatPattern="HH:mm:ss" aria-label="Required time" />
          <DatePicker id="i18n-date-validity-override" required formatPattern="yyyy-MM-dd" texts={{ valueMissing: pattern => `Use ${pattern}` }} aria-label="Custom validation" />
        </section>
        <section id="i18n-precedence" aria-label="Nested locale and text precedence"><FioriLocaleProvider texts={{ NUMBERINPUT_INC_ICON_TITLE: "Inherited increase" }}><StepInput id="i18n-inherited" defaultValue={1234.5} valuePrecision={1} aria-label="Inherited locale" /><FioriLocaleProvider locale="fr-FR" texts={{ NUMBERINPUT_DEC_ICON_TITLE: "Nested decrease" }}><StepInput id="i18n-nested" defaultValue={1234.5} valuePrecision={1} aria-label="Nested locale" /><StepInput id="i18n-locale-prop" locale="en-US" defaultValue={1234.5} valuePrecision={1} texts={{ increment: "Prop increase" }} aria-label="Component locale" /></FioriLocaleProvider></FioriLocaleProvider></section>
        <div id="i18n-calendar"><Calendar defaultSelectedDates={[new Date(2024, 2, 12)]} /></div>
        <div id="i18n-slider" className="w-80"><Slider value={slider} onValueChange={setSlider} min={0} max={2} step={0.1} showTooltip editableTooltip aria-label="Localized slider" /><output data-testid="i18n-slider-value">{String(slider)}</output></div>
        <div id="i18n-range" className="w-80"><RangeSlider value={range} onValueChange={setRange} min={0} max={2} step={0.1} showTooltip editableTooltip aria-label="Localized range" /></div>
        <div id="i18n-progress"><ProgressIndicator value={50} /></div>
        <div id="i18n-number"><ObjectNumber number={1234.5} /></div>
        <div id="i18n-combobox"><ComboBox aria-label="Empty combobox" /></div>
        <div id="i18n-combobox-announcements"><ComboBox aria-label="Grouped announcements" noTypeahead><ComboBoxItemGroup headerText="{0}x"><ComboBoxItem text="Alpha" additionalText="A" /><ComboBoxItem text="Beta" additionalText="B" /></ComboBoxItemGroup><ComboBoxItem text="Zulu" /></ComboBox></div>
        <div id="i18n-combobox-announcements-override"><ComboBox aria-label="Custom grouped announcements" texts={{ groupHeader: "Category", itemPosition: (position, count) => `Count ${count}; position ${position}` }}><ComboBoxItemGroup headerText="{0}x"><ComboBoxItem text="Alpha" additionalText="A" /><ComboBoxItem text="Beta" /></ComboBoxItemGroup></ComboBox></div>
        <div id="i18n-select"><Select><SelectTrigger aria-label="Empty select"><SelectValue /></SelectTrigger><SelectContent /></Select></div>
        <div id="i18n-select-announcements"><Select defaultValue="standalone"><SelectTrigger aria-label="Grouped select" aria-describedby="i18n-select-note"><SelectValue /></SelectTrigger><SelectContent aria-label="Grouped choices"><SelectItem value="standalone">Standalone</SelectItem><SelectGroup><SelectLabel>First group</SelectLabel><SelectItem value="a">Alpha</SelectItem><SelectItem value="b">Beta</SelectItem></SelectGroup><SelectGroup><SelectLabel>Second group</SelectLabel><SelectItem value="disabled" disabled>Unavailable</SelectItem></SelectGroup></SelectContent></Select><span id="i18n-select-note">Application description</span></div>
        <div id="i18n-select-announcements-override"><Select defaultValue="a"><SelectTrigger aria-label="Custom grouped select" texts={{ roleDescription: "Choice selector", optionsInGroups: (options, groups) => `Choices ${options}; categories ${groups}`, itemPosition: (position, count) => `Entry ${position} among ${count}` }}><SelectValue /></SelectTrigger><SelectContent><SelectGroup><SelectLabel>Custom group</SelectLabel><SelectItem value="a">Alpha</SelectItem><SelectItem value="b">Beta</SelectItem></SelectGroup></SelectContent></Select></div>
        <div id="i18n-tag"><Tag design="negative">Delayed</Tag><Tag design="neutral">Category</Tag><Tag design="negative" texts={{ tag: "Component marker", negative: "Component error" }}>Custom state</Tag><Tag design="negative" tagText="Legacy complete description" texts={{ tag: "Ignored marker" }}>Legacy tag</Tag></div>
        <div id="i18n-segmented"><SegmentedButton selectionMode="multiple" defaultValue={["a"]} aria-label="Localized views"><SegmentedButtonItem value="a">Alpha</SegmentedButtonItem><SegmentedButtonItem value="b">Beta</SegmentedButtonItem></SegmentedButton></div>
        <div id="i18n-segmented-override"><SegmentedButton defaultValue="a" texts={{ selected: "Component selection" }} aria-label="Custom views"><SegmentedButtonItem value="a">Alpha</SegmentedButtonItem><SegmentedButtonItem value="b">Beta</SegmentedButtonItem></SegmentedButton></div>
        <div id="i18n-segmented-controlled"><SegmentedButton value={acceptedSegment} onValueChange={value => { setCallbackAnnouncement(document.querySelector('[data-slot="segmented-button-announcement"][data-owner="Controlled views"]')?.textContent ?? ""); setAcceptedSegment(value) }} aria-label="Controlled views"><SegmentedButtonItem value="a">Alpha</SegmentedButtonItem><SegmentedButtonItem value="b">Beta</SegmentedButtonItem></SegmentedButton><output data-testid="i18n-segmented-callback">{callbackAnnouncement}</output></div>
        <div id="i18n-segmented-rejected"><SegmentedButton value="a" onValueChange={() => setRejectedSegmentAttempts(count => count + 1)} aria-label="Rejected views"><SegmentedButtonItem value="a">Alpha</SegmentedButtonItem><SegmentedButtonItem value="b">Beta</SegmentedButtonItem><SegmentedButtonItem value="prevented" onClick={event => event.preventDefault()}>Prevented</SegmentedButtonItem></SegmentedButton><output data-testid="i18n-segmented-rejected-attempts">{rejectedSegmentAttempts}</output></div>
        {(["negative", "critical", "positive", "information"] as const).map(state => <div id={`i18n-select-state-${state}`} key={state}><Select defaultValue="a"><SelectTrigger aria-label={`Localized ${state} select`} valueState={state}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Alpha</SelectItem></SelectContent></Select></div>)}
        <div id="i18n-select-state-override"><Select defaultValue="a"><SelectTrigger aria-label="Custom negative select" valueState="negative" texts={{ negativeType: "Component error" }} valueStateTypeText={{ negative: "Legacy error" }}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Alpha</SelectItem></SelectContent></Select></div>
        <FioriLocaleProvider texts={{ "valuehelp.TABLETITLE": "Rows {0}!", "valuehelp.TABLETITLENONUMBER": "Zero rows", "valuehelp.SELECTFROMLIST": "Selected {0}!", "valuehelp.SELECTFROMLISTNONUMBER": "Zero selected", "valuehelp.DEFINECONDITIONS": "Conditions {0}!", "valuehelp.DEFINECONDITIONSNONUMBER": "Zero conditions", "valuehelp.TOKENIZERTITLE": "Total {0}!", "valuehelp.TOKENIZERTITLENONUMBER": "Zero tokens" }}>
          <I18nValueHelpExample id="i18n-vhd-counted" title="Counted value help" />
          <I18nValueHelpExample id="i18n-vhd-zero" title="Empty counted value help" empty />
          <I18nValueHelpExample id="i18n-vhd-title-override" title="Custom counted value help" texts={{ items: "Legacy rows", searchAndSelectWithCount: count => `Custom selected ${count}`, defineConditionsWithCount: count => `Custom conditions ${count}`, selectedItemsAndConditionsWithCount: count => `Custom total ${count}` }} />
        </FioriLocaleProvider>
        <div id="i18n-collation"><ComboBox aria-label="Collation combobox" noTypeahead filter="startsWith">{["Äland", "Aland", "Zulu"].map(text => <ComboBoxItem key={text} text={text} />)}</ComboBox><Select defaultValue="Zulu"><SelectTrigger aria-label="Collation select"><SelectValue /></SelectTrigger><SelectContent>{["Äland", "Aland", "Zulu"].map(text => <SelectItem key={text} value={text}>{text}</SelectItem>)}</SelectContent></Select></div>
        <div id="i18n-table"><Table /></div>
        <div id="i18n-sort"><DataTable data={[{name:"Zulu"},{name:"Äland"},{name:"Aland"}]} columns={i18nColumns} defaultSorting={[{ id: "name", desc: false }]} /></div>
        <div id="i18n-message"><MessageStrip>Example information</MessageStrip></div>
        <div id="i18n-tokens"><label>Token count <select aria-label="Token count" value={count} onChange={event => setCount(Number(event.target.value))}>{[1,2,5].map(n => <option key={n}>{n}</option>)}</select></label><Tokenizer style={{ width: "3rem" }}>{Array.from({ length: count }, (_, i) => <Token key={i} text={`Long token ${i}`} />)}</Tokenizer></div>
        <div id="i18n-token-deletion"><Tokenizer aria-label="Removable tokens" onTokenDelete={values => setDeletableTokens(old => old.filter(value => !values.includes(value)))}>{deletableTokens.map(value => <Token key={value} text={value} />)}</Tokenizer></div>
        <div id="i18n-token-deletion-override"><Tokenizer texts={{ tokenizer: "Custom tokenizer", tokenDeleted: count => `Removed ${count} selected tokens` }} onTokenDelete={() => {}}><Token text="Custom token" /></Tokenizer></div>
        <div id="i18n-textarea"><TextArea required maxLength={3} counterMode="always" aria-label="Required short note" /><TextArea required aria-label="Custom required note" texts={{ valueMissing: "Please add a note", tooLong: count => `Remove ${count} extra letters` }} /></div>
        <div id="i18n-breadcrumbs"><Breadcrumbs><BreadcrumbsItem href="#home">Home</BreadcrumbsItem><BreadcrumbsItem>Current</BreadcrumbsItem></Breadcrumbs><Breadcrumbs texts={{ position: (position, size) => `${position} among ${size}` }}><BreadcrumbsItem href="#home">Custom home</BreadcrumbsItem><BreadcrumbsItem>Current</BreadcrumbsItem></Breadcrumbs></div>
        <div id="i18n-list"><List selectionMode="multiple"><ListItemGroup headerText="Countries"><ListItemStandard value="a">Alpha</ListItemStandard><ListItemStandard value="b">Beta</ListItemStandard></ListItemGroup></List><List selectionMode="delete" texts={{ deletable: "Custom deletable mode", delete: "Remove row", interactiveDescription: "Custom list guidance" }}><ListItemStandard>Removable row</ListItemStandard></List></div>
        <div id="i18n-wizard" className="h-80"><Wizard><WizardStep titleText="{0}x" subtitleText="Optional"><p>First step</p></WizardStep><WizardStep titleText="Second" disabled><p>Second step</p></WizardStep></Wizard></div>
        <div id="i18n-wizard-override" className="h-80"><Wizard texts={{ stepHeading: "Stage", activeStep: "Ready", optionalStep: "Not required", stepLabel: (n, title) => `Stage ${n}: ${title}` }}><WizardStep titleText="Shipping"><p>Shipping details</p></WizardStep></Wizard></div>
        <div id="i18n-card"><Card accessibleName="{0}x"><CardHeader titleText="Shipping" /><CardContent>Shipping content</CardContent></Card><Card accessibleName="Custom card" texts={{ card: "Panel", content: "Panel content" }}><CardHeader titleText="Custom header" texts={{ header: "Panel header" }} /><CardContent>Custom content</CardContent></Card></div>
        <div id="i18n-file"><FileUploader required aria-label="Required attachment" /><FileUploader multiple aria-label="Multiple attachments" /><FileUploader required aria-label="Custom attachment" texts={{ placeholder: "Attach one document", valueMissing: "Please attach a document" }} /></div>
        <div id="i18n-vsd"><ViewSettingsDialog open={viewSettingsOpen} onOpenChange={setViewSettingsOpen} filterItems={[{ text: "Shipping", values: [{ text: "Express", selected: true }, { text: "Standard" }] }]} resetEnabled><Button onClick={() => setViewSettingsOpen(true)}>Open localized view settings</Button></ViewSettingsDialog><ViewSettingsDialog open={customViewSettingsOpen} onOpenChange={setCustomViewSettingsOpen} texts={{ resetAnnouncement: "Filters restored" }} sortItems={[{ text: "Name" }]} resetEnabled><Button onClick={() => setCustomViewSettingsOpen(true)}>Open custom view settings</Button></ViewSettingsDialog></div>
        <div id="i18n-dialog"><Dialog><DialogTrigger asChild><Button>Open localized dialog</Button></DialogTrigger><DialogContent aria-describedby={undefined}><DialogHeader><DialogTitle>Example</DialogTitle></DialogHeader><DialogClose /></DialogContent></Dialog></div>
      </div>
    </FioriLocaleProvider>
    <FioriLocaleProvider texts={{ DATEPICKER_VALUE_MISSING: "Text-only date {0}", DATERANGE_VALUE_MISSING: "Text-only range {0}", DATETIME_VALUE_MISSING: "Text-only date-time {0}", TIMEPICKER_VALUE_MISSING: "Text-only time {0}", NUMBERINPUT_PATTERN_MISSMATCH: "Text-only precision {0}", LIST_NO_DATA: "Text-only empty" }}>
      <section id="i18n-text-only" aria-label="Text provider without a locale">
        <DatePicker id="i18n-text-only-date" required formatPattern="yyyy-MM-dd" aria-label="Text-only date" />
        <DateRangePicker id="i18n-text-only-range" required formatPattern="yyyy-MM-dd" aria-label="Text-only range" />
        <DateTimePicker id="i18n-text-only-datetime" required formatPattern="yyyy-MM-dd HH:mm:ss" aria-label="Text-only date-time" />
        <TimePicker id="i18n-text-only-time" required formatPattern="HH:mm:ss" aria-label="Text-only time" />
        <StepInput id="i18n-text-only-step" valuePrecision={1} aria-label="Text-only number" />
        <div id="i18n-text-only-combobox"><ComboBox aria-label="Text-only empty combobox" /></div>
        <div id="i18n-text-only-select"><Select><SelectTrigger aria-label="Text-only empty select"><SelectValue /></SelectTrigger><SelectContent /></Select></div>
      </section>
    </FioriLocaleProvider>
    <section id="i18n-no-provider-match"><Select defaultValue="z"><SelectTrigger aria-label="Unlocalized matching"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">Äther</SelectItem><SelectItem value="z">Zulu</SelectItem></SelectContent></Select></section>
    <I18nValueHelpExample id="i18n-vhd-no-provider" title="Unlocalized value help" empty />
    <Section title="Optional SAP language packs"><p>Translations are derived from UI5 Web Components 2.28.1 and OpenUI5 1.154.0, © SAP SE, Apache-2.0. Install only the packs your application needs.</p><div className="grid gap-2">{Object.keys(languagePacks).filter(path => !path.endsWith("registry-items.json")).sort().map(path => { const tag = path.split("/").at(-1)!.slice(0,-5); return <div key={tag}><code>{`npx shadcn add @petalo/i18n-${tag}`}</code></div> })}</div></Section>
  </div>
}

// Expose case ids and tolerances for tests/visual.spec.ts. Anti-aliasing and sub-pixel text layout
// differ slightly between shadow DOM and light DOM, hence the default 2% tolerance.
;(window as any).__fixtures = activeFixtureSets.flatMap((set) =>
  set.cases.filter((c) => (!opts.only || c.id === opts.only) && !set.skipCompare?.includes(c.id)).map((c) => ({ id: c.id, tolerance: set.tolerance ?? 0.02, interact: c.interact }))
)

const fixtureMode = phoneMode || query.has("fixtures") || query.has("fixtures-sapui5")
if (fixtureMode) document.body.style.padding = phoneMode ? "0" : "1rem"
createRoot(document.getElementById("root")!).render(<React.StrictMode>{fixtureMode ? <FixtureGrid /> : <Docs />}</React.StrictMode>)
