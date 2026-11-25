import { reconcileNavigationMenuFixture } from "./navigation-menu-a11y"
import { reconcileSelectDialogFixture, type SelectDialogFixtureShape } from "./select-dialog-a11y"
import { reconcileDynamicDateRangeEditor } from "./dynamic-date-range-a11y"
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs"
import { expect, type Page } from "@playwright/test"
import ts from "typescript"
import { join } from "node:path"
import { treeReportDirectory, treeReportFile } from "./a11y-tree-coverage"
import { pairedWrapperDifferences, ratchetCase, readTreeBaseline } from "./a11y-tree-baseline"

type SnapshotNode = { role: string; name?: string; states: string[]; text?: string; children: SnapshotNode[] }
/** Parse Playwright's actual snapshot while normalizing whitespace in accessible names only.
 * Unknown syntax throws instead of dropping a role, state or description.
 */
export function normalizeSnapshot(snapshot: string): SnapshotNode[] {
  const roots: SnapshotNode[] = []
  const stack: { indent: number; node: SnapshotNode }[] = []
  for (const line of snapshot.split("\n")) {
    if (!line.trim()) continue
    const match = /^(\s*)- (.+)$/.exec(line)
    if (!match) throw new Error(`Unsupported ariaSnapshot line: ${line}`)
    const indent = match[1].length
    let body = match[2]
    // Playwright quotes YAML scalar lines whose accessible name contains a colon.
    if (body.startsWith("'")) {
      const closing = body.lastIndexOf("'")
      if (closing <= 0) throw new Error(`Invalid YAML scalar: ${line}`)
      body = body.slice(1, closing).replace(/''/g, "'") + body.slice(closing + 1)
    }
    const role = /^[\w/-]+/.exec(body)?.[0]
    if (!role) throw new Error(`Missing snapshot role: ${line}`)
    body = body.slice(role.length).trimStart()
    let name: string | undefined
    if (body.startsWith('"')) {
      const quoted = /^"(?:[^"\\]|\\.)*"/.exec(body)?.[0]
      if (!quoted) throw new Error(`Invalid snapshot name: ${line}`)
      name = (JSON.parse(quoted) as string).replace(/\s+/g, " ").trim()
      body = body.slice(quoted.length).trimStart()
    }
    const states: string[] = []
    while (body.startsWith("[")) {
      const state = /^\[[^\]]+\]/.exec(body)?.[0]
      if (!state) throw new Error(`Invalid snapshot state: ${line}`)
      states.push(state); body = body.slice(state.length).trimStart()
    }
    if (body && !body.startsWith(":")) throw new Error(`Unknown snapshot channel: ${line}`)
    const content = body.slice(1).trimStart()
    const node: SnapshotNode = { role, ...(name === undefined ? {} : { name }), states,
      ...(content ? { text: content } : {}), children: [] }
    while (stack.length && stack.at(-1)!.indent >= indent) stack.pop()
    ;(stack.at(-1)?.node.children ?? roots).push(node)
    stack.push({ indent, node })
  }
  return roots
}

export type AXNode = {
  nodeId: string; ignored?: boolean; role?: { value?: unknown }; name?: { value?: unknown }
  description?: { value?: unknown }; value?: { value?: unknown }
  properties?: { name: string; value: { value?: unknown } }[]; childIds?: string[]; backendDOMNodeId?: number
}
const text = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : value

/** ariaSnapshot omits descriptions, invalid and numeric bounds. CDP supplies these actual AX channels.
 * Chromium-ignored nodes alone are removed. Unignored roles and nesting are retained, including generic.
 * InlineTextBox is Chromium's layout fragment of its parent StaticText, not a separate screen-reader node.
 */
export function normalizeAX(nodes: AXNode[], rootId: string): unknown[] {
  const byId = new Map(nodes.map((node) => [node.nodeId, node]))
  const byBackendId = new Map(nodes.filter((node) => node.backendDOMNodeId !== undefined).map((node) => [node.backendDOMNodeId, node]))
  const referenceText = (node: AXNode | undefined): string => {
    if (!node) return ""
    const name = text(node.name?.value ?? "")
    if (name) return String(name)
    // CDP's describedby idrefList does not supply relatedNodes.text. A React
    // generic span exposes StaticText children, whereas UI5's ignored hidden
    // span exposes the same text as its own name. Read either representation.
    return (node.childIds ?? []).map((id) => referenceText(byId.get(id))).filter(Boolean).join(" ")
  }
  const walk = (id: string): unknown[] => {
    const node = byId.get(id)
    if (!node) throw new Error(`Missing AX node ${id}`)
    if (node.role?.value === "InlineTextBox") return []
    const children = (node.childIds ?? []).flatMap(walk)
    if (node.ignored) return children
    const properties = Object.fromEntries((node.properties ?? []).map((p) => {
      const related = (p.value as any).relatedNodes as { backendDOMNodeId: number; text?: string }[] | undefined
      const value = related ? related.map((target) => {
        const resolved = byBackendId.get(target.backendDOMNodeId)
        // E4's hidden-description normalization: labelledby/describedby targets
        // contribute CDP's resolved text, whether a React span or UI5's ignored
        // ui5-hidden-text span. Their presentational role/ignored flag is DOM
        // representation, not an extra screen-reader channel. Retain target text,
        // validity and order; other relations retain their semantic target roles.
        if (p.name === "labelledby" || p.name === "describedby") return { text: text(target.text ?? referenceText(resolved)), valid: !!resolved }
        return { role: resolved?.role?.value, name: text(resolved?.name?.value ?? target.text ?? ""), ignored: resolved?.ignored, valid: !!resolved }
      }) : text(p.value.value)
      return [p.name, value]
    }).sort(([a], [b]) => String(a).localeCompare(String(b))))
    return [{ role: node.role?.value, name: text(node.name?.value ?? ""),
      ...(node.description ? { description: text(node.description.value) } : {}),
      ...(node.value ? { value: text(node.value.value) } : {}), properties, children }]
  }
  return walk(rootId)
}

/** Explicit DOM-only allowances unwrap one inert generic node, preserving all children.
 * This is applied only to paths listed by a fixture's a11yDiff; it is not a global normalization.
 */
export function applyAllowedWrappers(ours: unknown, ui5: unknown, paths: string[], ui5FormHosts: string[] = [], ui5FocusScaffolding: string[] = []) {
  const values: Record<string, any> = { ours: structuredClone(ours), ui5: structuredClone(ui5) }
  const forms = new Set(ui5FormHosts)
  const focus = new Set(ui5FocusScaffolding)
  if ([...focus].some(path => !path.startsWith("/ui5/ax/"))) throw new Error("Focus scaffolding allowances must name exact UI5 AX paths")
  if ([...forms].some(path => !path.startsWith("/ui5/ax/"))) throw new Error("Form host allowances must name an exact UI5 AX path")
  const wrappers = [...paths.filter(path => /^\/(ours|ui5)\/ax\//.test(path)), ...forms, ...focus].map(path => path.slice(1).split("/"))
  wrappers.sort((a, b) => b.length - a.length || b.join("/").localeCompare(a.join("/"), "en", { numeric: true }))
  for (const parts of wrappers) {
    let parent: any = values
    for (const part of parts.slice(0, -1)) {
      parent = parent?.[part]
      if (parent === undefined) throw new Error(`Stale a11yDiff wrapper path: /${parts.join("/")}`)
    }
    const index = Number(parts.at(-1)), node = parent?.[index]
    const props = node?.properties ?? {}
    const path = "/" + parts.join("/")
    const form = forms.has(path)
    if (focus.has(path)) {
      const focusOnly = JSON.stringify(props) === '{"focusable":true}'
      const emptySentinel = node?.role === "generic" && node.children?.length === 0
      const popupHost = node?.role === "group" && node.children?.length === 1
        && ["dialog", "alertdialog"].includes(node.children[0].role)
      if (!Array.isArray(parent) || !focusOnly || node?.name !== "" || node.description !== undefined || node.value !== undefined
        || !(emptySentinel || popupHost)) throw new Error(`Unexpected UI5 focus scaffolding: ${path}`)
      parent.splice(index, 1, ...node.children)
      continue
    }
    const disabled = props.disabled === true
    const ownedControl = Array.isArray(node?.children) ? node.children.filter((child: { role: string }) => child.role === "button" || child.role === "textbox") : []
    // Button, NumericInput and its inner Input are form-associated custom
    // elements. CDP repeats the native control's disabled state on an otherwise
    // inert shadow host and adds implicit invalid=false. Keep the control itself.
    const formState = form
      && props.invalid === "false" && Object.keys(props).length === (disabled ? 2 : 1)
      && ownedControl.length === 1 && (ownedControl[0].properties.disabled === true) === disabled
    if (!Array.isArray(parent) || !node || node.role !== "generic" || node.name !== "" || node.description !== undefined
      || node.value !== undefined || !(form ? formState : Object.keys(props).length === 0) || !Array.isArray(node.children)) {
      throw new Error(`a11yDiff may unwrap only an unnamed state-free generic wrapper: /${parts.join("/")}`)
    }
    parent.splice(index, 1, ...node.children)
  }
  const relocations = paths.filter((path) => /^\/(ours|ui5)\/snapshot\//.test(path)).map((path) => path.slice(1).split("/"))
  relocations.sort((a, b) => b.length - a.length || b.join("/").localeCompare(a.join("/"), "en", { numeric: true }))
  for (const parts of relocations) {
    if (parts.at(-1) !== "children") throw new Error(`Owned snapshot relocation must name exact children: /${parts.join("/")}`)
    const capture = values[parts[0]]
    let target = values as any
    for (const part of parts.slice(0, -1)) target = target?.[part]
    if (!target || target.role !== "list" || !target.name || target.children.length) throw new Error(`Owned snapshot relocation requires an empty named list: /${parts.join("/")}`)
    const findAX = (nodes: any[]): any[] => nodes.flatMap((node) => [...(node.role === target.role && node.name === target.name ? [node] : []), ...findAX(node.children)])
    const candidates = findAX(capture.ax)
    if (candidates.length !== 1 || !candidates[0].properties.owns?.length || !candidates[0].children.length
      || candidates[0].properties.owns.some((target: any) => target.valid !== true)) throw new Error(`Owned snapshot relocation requires a unique nonempty actual AX owner with valid targets: /${parts.join("/")}`)
    const expected = candidates[0].children
    const findHeader = (nodes: any[]): { siblings: any[]; index: number }[] => nodes.flatMap((node, index) => [
      ...(node.role === "listitem" && node.children.includes(target) ? [{ siblings: nodes, index }] : []), ...findHeader(node.children),
    ])
    const headers = findHeader(capture.snapshot)
    if (headers.length !== 1) throw new Error(`Owned snapshot relocation requires one containing group header: /${parts.join("/")}`)
    const { siblings, index } = headers[0]
    const moved = siblings.slice(index + 1, index + 1 + expected.length)
    if (moved.length !== expected.length || moved.some((node, i) => node.role !== "listitem" || node.role !== expected[i].role || node.name !== expected[i].name)) {
      throw new Error(`Owned snapshot relocation must preserve the actual AX child roles, names and order: /${parts.join("/")}`)
    }
    // ListItemGroupTemplate.js's aria-owns crosses UI5's shadow roots. Chromium
    // reparents these items correctly, while ariaSnapshot leaves them as siblings.
    // Move the complete existing snapshot nodes; discard no names/states/content.
    // Actual AX ownership, nesting and every descendant still undergo diffTree.
    target.children.push(...siblings.splice(index + 1, moved.length))
  }
  return { ours: values.ours, ui5: values.ui5, leaves: paths.filter((path) => !/^\/(ours|ui5)\/(ax|snapshot)\//.test(path)) }
}

export function diffTree(ours: unknown, reference: unknown, ignore: string[] = [], path = ""): string[] {
  if (ignore.includes(path)) {
    if (path.endsWith("/properties/invalid") && !((ours === "false" && reference === undefined) || (reference === "false" && ours === undefined))) {
      throw new Error(`Implicit-default allowance requires invalid=false versus absence: ${path}`)
    }
    // Never discard a wrapper subtree or compound channel. Approved paths are
    // individual scalar channels, so all semantic descendants remain compared.
    if ((ours !== null && typeof ours === "object") || (reference !== null && typeof reference === "object")) {
      throw new Error(`a11yDiff cannot suppress a subtree: ${path}`)
    }
    return []
  }
  if (Object.is(ours, reference)) return []
  if (ours === null || reference === null || typeof ours !== "object" || typeof reference !== "object") {
    return [`${path || "/"}: ours ${JSON.stringify(ours)}; UI5 ${JSON.stringify(reference)}`]
  }
  if (Array.isArray(ours) !== Array.isArray(reference)) return [`${path || "/"}: structure differs`]
  const a = ours as Record<string, unknown>, b = reference as Record<string, unknown>
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].flatMap((key) => diffTree(a[key], b[key], ignore, `${path}/${key}`))
}

export type TableLoadingOverlayRelocation = {
  gridName: string
  progressbarName: string
  /** Exact paths after the case's strictly inert wrapper removals. */
  ax: string
  snapshot: string
}

/** S0's one documented TableTemplate.js bug: its complete loading overlay is
 * inside role=grid. Move only this case-declared native overlay immediately after
 * its owning grid, preserving every existing node and channel. Raw captures stay
 * unchanged. All other Table differences still go through diffTree.
 */
export function relocateTableLoadingOverlay(capture: any, declaration: TableLoadingOverlayRelocation) {
  const adjusted = structuredClone(capture)
  for (const channel of ["ax", "snapshot"] as const) {
    const path = declaration[channel]
    const match = new RegExp(`^/${channel}/(?:\\d+/children/)*\\d+/children/\\d+$`).exec(path)
    if (!match) throw new Error(`Table loading relocation requires an exact overlay child path: ${path}`)
    const parts = path.slice(1).split("/")
    let siblings: any = adjusted
    for (const part of parts.slice(0, -3)) siblings = siblings?.[part]
    const gridIndex = Number(parts.at(-3)), grid = siblings?.[gridIndex]
    const overlayIndex = Number(parts.at(-1))
    if (!Array.isArray(siblings) || grid?.role !== "grid" || grid.name !== declaration.gridName
      || !Array.isArray(grid.children) || overlayIndex < 1
      || grid.children.slice(0, overlayIndex).some((node: any) => node.role !== "row")) {
      throw new Error(`Table loading relocation requires its exact named grid and preceding rows: ${path}`)
    }
    const find = (nodes: any[], role: string): any[] => nodes.flatMap((node) => [
      ...(node.role === role ? [node] : []), ...find(node.children ?? [], role),
    ])
    const grids = find(adjusted[channel], "grid")
    const bars = find(adjusted[channel], "progressbar")
    const overlay = grid.children.slice(overlayIndex)
    if (grids.length !== 1 || grids[0] !== grid || bars.length !== 1
      || overlay[0] !== bars[0] || overlay[0].name !== declaration.progressbarName
      || overlay.length !== (channel === "ax" ? 2 : 1)) {
      throw new Error(`Table loading relocation requires one final, uniquely named progressbar overlay: ${path}`)
    }
    if (channel === "ax") {
      // BusyIndicatorTemplate.js puts an after-busy-indicator focus sentinel in
      // the overlay host. It is focusable, so retain it; it is never an inert wrapper.
      const sentinel = overlay[1]
      if (sentinel.role !== "generic" || sentinel.name !== "" || sentinel.description !== undefined
        || sentinel.value !== undefined || JSON.stringify(sentinel.properties) !== '{"focusable":true}'
        || !Array.isArray(sentinel.children) || sentinel.children.length !== 0) {
        throw new Error(`Table loading relocation requires the unchanged overlay focus sentinel: ${path}`)
      }
    }
    siblings.splice(gridIndex + 1, 0, ...grid.children.splice(overlayIndex, overlay.length))
  }
  return adjusted
}

export type CalendarHeaderBug = { shortcutAX: string; yearRange?: { ax: string; snapshot: string; from: number; to: number } }
/** Only the two source-pinned CalendarHeaderTemplate.js defects. Correct the
 * reference's invalid shortcut and S0's missing visible range name, while
 * retaining all other properties, descriptions, states and descendants. */
export function correctCalendarHeaderBugs(ours: any, reference: any, declaration: CalendarHeaderBug) {
  const native = structuredClone(reference)
  const at = (capture: any, path: string, channel: "ax" | "snapshot") => {
    if (!new RegExp(`^/${channel}/(?:\\d+/children/)*\\d+$`).test(path)) throw new Error(`Calendar bug requires an exact ${channel} node path: ${path}`)
    return path.slice(1).split("/").reduce((node: any, key) => node?.[key], capture)
  }
  const a = at(ours, declaration.shortcutAX, "ax"), b = at(native, declaration.shortcutAX, "ax")
  if (a?.role !== "button" || b?.role !== "button" || a.properties?.keyshortcuts !== "Shift+F4" || b.properties?.keyshortcuts !== "Shift + F4"
    || !(/^Year \d{4}$/.test(b.name) || declaration.yearRange && declaration.yearRange.ax === declaration.shortcutAX)) {
    throw new Error("Calendar shortcut allowance requires the exact native year/year-range Shift + F4 bug")
  }
  b.properties.keyshortcuts = "Shift+F4"
  if (declaration.yearRange) {
    const range = declaration.yearRange
    if (!Number.isInteger(range.from) || range.to !== range.from + 19) throw new Error("Calendar range allowance requires its exact 20-year range")
    const visible = `${range.from} - ${range.to}`, purpose = `Year range from ${range.from} to ${range.to}`, name = `${visible} ${purpose}`
    const actual = at(ours, range.ax, "ax"), expected = at(native, range.ax, "ax")
    const staticText = (text: string) => ({ role: "StaticText", name: text, properties: {}, children: [] })
    const labelledby = [{ text: visible, valid: true }, { text: purpose, valid: true }]
    if (actual?.role !== "button" || expected?.role !== "button" || actual.name !== name || expected.name !== purpose
      || actual.description !== purpose || expected.description !== purpose
      || JSON.stringify(actual.properties?.labelledby) !== JSON.stringify(labelledby) || expected.properties?.labelledby !== undefined
      || JSON.stringify(actual.children) !== JSON.stringify([staticText(visible), staticText(purpose)])
      || JSON.stringify(expected.children) !== JSON.stringify([staticText(visible)])) throw new Error("Calendar range allowance requires unchanged visible text, purpose, description and valid owned name references")
    expected.name = name
    expected.properties.labelledby = labelledby
    expected.children.push(staticText(purpose))
    const actualSnapshot = at(ours, range.snapshot, "snapshot"), expectedSnapshot = at(native, range.snapshot, "snapshot")
    if (actualSnapshot?.role !== "button" || expectedSnapshot?.role !== "button" || actualSnapshot.name !== name || expectedSnapshot.name !== purpose
      || actualSnapshot.text !== undefined || expectedSnapshot.text !== visible || actualSnapshot.children.length || expectedSnapshot.children.length) throw new Error("Calendar range snapshot allowance requires the exact visible range and purpose")
    expectedSnapshot.name = name
    delete expectedSnapshot.text
  }
  return native
}

type SplitButtonMenu = { item: string; opener: string; dialog: string; activeHint: string }
type Allowed = { navigationMenu?: true; dynamicDateRangeEditor?: true; analyticalTableDetailRows?: number[]; analyticalTableDisabledSelection?: true; analyticalTableHeaderText?: number; analyticalTableBusyRow?: true; selectDialogShape?: SelectDialogFixtureShape; pinnedPopupShell?: { kind: "dialog" | "popover"; name: string }; numericInputMessage?: { state: string; message: string }; ui5FormHosts?: string[]; ui5FocusScaffolding?: string[]; messageBoxNameRef?: true; inputPhoneAlerts?: true; inputSuggestionBanner?: { ax: string; snapshot: string }; splitButtonMenu?: SplitButtonMenu; ignore: string[]; reason: string; tableLoadingOverlay?: TableLoadingOverlayRelocation; calendarHeaderBug?: CalendarHeaderBug }
/** As with the in-place SplitButton/Menu fixture, the closed reference is
 * painted inside its cell without opening a modal surface. Verify PopupTemplate's
 * owning host, closed block layer and both exact focus guards, then compare all
 * descendants of its inner dialog. React implements the actual trap in Radix;
 * the body, live regions, dialog name and modal state still undergo diffTree.
 */
export function reconcilePinnedPopupShell(ours: any, ui5: any, { kind, name }: NonNullable<Allowed["pinnedPopupShell"]>) {
  const node = (role: string, properties: object = {}) => ({ role, name: "", properties, children: [] })
  expect(ours.ax).toHaveLength(1)
  expect(ui5.ax).toHaveLength(1)
  const [react] = ours.ax
  const [host] = ui5.ax
  const expectedHost = node(kind === "dialog" ? "group" : "generic", { focusable: true })
  const { children: nativeHostChildren, ...nativeHostProperties } = host
  const { children: _children, ...expectedHostProperties } = expectedHost
  expect(nativeHostProperties).toEqual(expectedHostProperties)
  expect(nativeHostChildren).toHaveLength(kind === "dialog" ? 2 : 1)
  if (kind === "dialog") expect(nativeHostChildren[0]).toEqual(node("generic"))
  const native = nativeHostChildren.at(-1)
  for (const dialog of [react, native]) {
    expect(dialog.role).toBe("dialog")
    expect(dialog.name).toBe(name)
    expect(dialog.properties.modal).toBe(true)
  }
  expect(react.properties.focusable).toBe(true)
  expect(native.properties.focusable).toBeUndefined()
  const guards = [native.children[0], native.children.at(-1)]
  expect(guards).toEqual([node("generic", { focusable: true }), node("generic", { focusable: true })])
  native.children = native.children.slice(1, -1)
  delete react.properties.focusable
  ui5.ax[0] = native
}

/** The H8 fixture composes the existing desktop Menu in place. The UI5
 * ResponsivePopover advertises aria-modal and exposes focus guards even though
 * the fixture paints a closed surface. Pin both surfaces exactly, then compare
 * the common menu and item semantics together with the whole SplitButton. */
function reconcileSplitButtonMenu(ours: any, ui5: any, entry: SplitButtonMenu) {
  const { item, opener, dialog, activeHint } = entry
  const label = (text: string) => ({ text, valid: true })
  const ax = (role: string, name = "", properties = {}, children: unknown[] = []) => ({ role, name, properties, children })
  const guard = ax("generic", "", { focusable: true })
  const generic = (children: unknown[]) => ax("generic", "", {}, children)
  const text = generic([ax("StaticText", item)])
  const activeName = `${item} ${activeHint}`
  const nativeRow = ax("menuitem", activeName, {
    describedby: [label("")], focusable: true, labelledby: [label(item), label(activeHint)],
  }, [text, ax("StaticText", activeHint)])
  const nativeMenu = ax("menu", "", { orientation: "vertical" }, [nativeRow])
  const nativeSurface = ax("group", "", { focusable: true }, [
    ax("dialog", dialog, { modal: true }, [guard, generic([generic([generic([generic([guard, nativeMenu, guard])])])]), guard]),
  ])
  const row = ax("menuitem", item, { focusable: true }, [text])
  const menu = ax("menu", opener, { focusable: true, labelledby: [label(opener)], orientation: "vertical" }, [row])
  const snapshot = (role: string, name: string | undefined, children: unknown[]) => ({
    role, ...(name === undefined ? {} : { name }), states: [], children,
  })
  const snapshotMenu = snapshot("menu", undefined, [snapshot("menuitem", item, [])])
  const nativeSnapshot = snapshot("dialog", dialog, [snapshot("menu", undefined, [snapshot("menuitem", activeName, [])])])
  expect(ours.ax).toHaveLength(2)
  expect(ui5.ax).toHaveLength(2)
  expect(ours.snapshot).toHaveLength(2)
  expect(ui5.snapshot).toHaveLength(2)
  expect(ours.ax[1]).toEqual(menu)
  expect(ui5.ax[1]).toEqual(nativeSurface)
  expect(ours.snapshot[1]).toEqual(snapshotMenu)
  expect(ui5.snapshot[1]).toEqual(nativeSnapshot)

  const oursArrow = ours.ax[0].children[1]
  const nativeArrow = ui5.ax[0].children[1]
  expect(oursArrow.name).toBe(opener)
  expect(nativeArrow.name).toBe(opener)
  expect(oursArrow.properties.controls).toEqual([{ role: "menu", name: opener, ignored: false, valid: true }])
  // SplitButtonTemplate lacks an aria-controls link to the separately composed
  // popup. Compare the remaining arrow channels and preserve the verified link.
  expect(nativeArrow.properties.controls).toBeUndefined()
  nativeArrow.properties.controls = oursArrow.properties.controls
  ui5.ax[1] = menu
  ui5.snapshot[1] = snapshotMenu
}

/** NumericInputTemplate forwards a slot element, whose textContent is empty
 * in Input.ariaValueStateHiddenText. Verify the native omission and our complete
 * message on the textbox, target and snapshot before aligning the text. */
function reconcileNumericInputMessage(ours: any, ui5: any, { state, message }: NonNullable<Allowed["numericInputMessage"]>) {
  const complete = `${state} ${message}`
  for (const [capture, description] of [[ours, complete], [ui5, state]]) {
    expect(capture.ax[0].role).toBe("textbox")
    expect(capture.ax[0].description).toBe(description)
    expect(capture.ax[0].properties.describedby).toEqual([{ text: description, valid: true }])
    expect(capture.ax[1]).toEqual({ role: "StaticText", name: description, properties: {}, children: [] })
    expect(capture.snapshot[1]).toEqual({ role: "text", states: [], text: description, children: [] })
  }
  ui5.ax[0].description = complete
  ui5.ax[0].properties.describedby[0].text = complete
  ui5.ax[1].name = complete
  ui5.snapshot[1].text = complete
}

/** WCR MessageBox/index.js passes the title and text references to the UI5
 * host. Dialog.js resolves the two strings into aria-label on its inner
 * alertdialog. Compare the resolved name and both valid reference texts. */
export function reconcileMessageBoxNameRef(ours: any, ui5: any) {
  const actual = ours.ax[0], native = ui5.ax[0], refs = actual?.properties.labelledby
  const heading = native?.children[0]?.children[0]
  const bodyText = native?.children[1]?.children[0]
  if (actual?.role !== "alertdialog" || native?.role !== "alertdialog" || native.properties.labelledby !== undefined
    || heading?.role !== "heading" || bodyText?.role !== "StaticText"
    || JSON.stringify(refs) !== JSON.stringify([{ text: heading.name, valid: true }, { text: bodyText.name, valid: true }])
    || native.name !== `${heading.name} ${bodyText.name}` || actual.name !== native.name) {
    throw new Error("WCR MessageBox must resolve its exact title and message reference texts")
  }
  native.properties.labelledby = refs
}

/** Popup.js allocates two empty global announcement outlets on phone. Input uses
 * its own status and count in both implementations, and the phone Dialog has no
 * additional announcement content. Retain any nonempty alert as a failure. */
function removeEmptyInputPhoneAlerts(ui5: any) {
  const ax = ui5.ax[0], snapshot = ui5.snapshot[0]
  if (ax?.role !== "dialog" || snapshot?.role !== "dialog") throw new Error("Expected the owned Input phone Dialog")
  const alerts = ax.children.slice(-2)
  const live = ["polite", "assertive"]
  if (alerts.length !== 2 || !alerts.every((node: any, index: number) => node.role === "alert" && node.name === ""
    && node.children.length === 0 && node.properties.live === live[index] && node.properties.atomic === true)
    || !snapshot.children.slice(-2).every((node: any) => node.role === "alert" && !node.name && !node.text && node.children.length === 0)) {
    throw new Error("Input's native phone Dialog announcement outlets changed")
  }
  ax.children.splice(-2)
  snapshot.children.splice(-2)
}

/** PopoverTemplate.js exposes a banner inside the desktop suggestion dialog.
 * Compare the exact header as the React group while retaining its text, all
 * descendants and the field's separately compared description relationship. */
function reconcileInputSuggestionBanner(ours: any, ui5: any, paths: NonNullable<Allowed["inputSuggestionBanner"]>) {
  for (const channel of ["ax", "snapshot"] as const) {
    const path = paths[channel]
    if (!new RegExp(`^/${channel}/\\d+/children/0$`).test(path)) {
      throw new Error(`Input validation header requires an exact first-child path: ${path}`)
    }
    const [, , index] = path.split("/")
    const actualDialog = ours[channel][Number(index)]
    const nativeDialog = ui5[channel][Number(index)]
    const actual = actualDialog?.children[0], native = nativeDialog?.children[0]
    if (actualDialog?.role !== "dialog" || nativeDialog?.role !== "dialog" || actual?.role !== "group" || native?.role !== "banner") {
      throw new Error(`Input validation header must be the native dialog banner and its React group: ${path}`)
    }
    native.role = "group"
  }
}

/** AnalyticalTable/index.js renders the independent BusyIndicator before the grid.
 * H5 puts the loading text in a grid row and marks the grid busy while preserving
 * the overlay paint. Validate both exact shapes and compare the loaded rows.
 */
function reconcileAnalyticalTableBusyRow(ours: any, ui5: any) {
  const actual = ours.ax[0].children[0]
  const native = ui5.ax[0].children[1]
  const text = "Please wait"
  expect(actual.role).toBe("grid")
  expect(native.role).toBe("grid")
  expect(actual.properties.busy).toBe(1)
  expect(native.properties.busy).toBeUndefined()
  const node = (role: string, name: string, properties = {}, children: unknown[] = []) => ({ role, name, properties, children })
  const generic = (...children: unknown[]) => node("generic", "", {}, children)
  expect(ui5.ax[0].children[0]).toEqual(generic(generic(
    node("progressbar", text, { focusable: true, valuemax: 100, valuemin: 0, valuetext: "" },
      [generic(generic(), generic(), generic())]),
    node("generic", "", { focusable: true }),
  )))
  const actualSnapshot = ours.snapshot[0]
  const nativeSnapshot = ui5.snapshot[1]
  expect(actualSnapshot.role).toBe("grid")
  expect(nativeSnapshot.role).toBe("grid")
  expect(ui5.snapshot[0]).toEqual({ role: "progressbar", name: text, states: [], children: [] })
  const body = actual.children[1].children[0]
  const snapshotBody = actualSnapshot.children[1]
  expect(actual.children[1].role).toBe("rowgroup")
  expect(snapshotBody.role).toBe("rowgroup")
  expect(body.children.at(-1)).toEqual(node("row", text, {}, [
    node("gridcell", text, { readonly: false, required: false }, [node("StaticText", text)]),
  ]))
  expect(snapshotBody.children.at(-1)).toEqual({ role: "row", name: text, states: [], children: [
    { role: "gridcell", name: text, states: [], children: [] },
  ] })
  delete actual.properties.busy
  body.children.pop()
  snapshotBody.children.pop()
  ui5.ax[0].children.shift()
  ui5.snapshot.shift()
}

/** WCR RowSubComponent.js places a focusable div directly under the row.
 * Petalo supplies the required gridcell role. Check the two hosts and prepend
 * that role in the oracle snapshot, retaining the original button and AX children.
 */
function reconcileAnalyticalTableDetails(ours: any, ui5: any, rows: number[]) {
  for (const index of rows) {
    const actualRow = ours.ax[0]?.children[0]?.children[1]?.children[0]?.children[index]
    const nativeRow = ui5.ax[0]?.children[0]?.children[1]?.children[0]?.children[index]
    const actual = actualRow?.children[0], native = nativeRow?.children[0]
    const inspector = native?.children[0]?.children[0]
    const actualSnapshotRow = ours.snapshot[0]?.children[1]?.children[index]
    const nativeSnapshotRow = ui5.snapshot[0]?.children[1]?.children[index]
    const actualSnapshot = actualSnapshotRow?.children[0]
    const nativeSnapshot = nativeSnapshotRow?.children[0]
    const name = inspector?.name

    expect(actualRow.role).toBe("row")
    expect(nativeRow.role).toBe("row")
    expect(inspector.role).toBe("button")
    expect(name).toMatch(/^Inspect .+/)
    expect(actual).toMatchObject({ role: "gridcell", name })
    expect(actual.properties).toEqual({ focusable: true, readonly: false, required: false })
    expect(native).toMatchObject({ role: "generic", name: "" })
    expect(native.properties).toEqual({ focusable: true })
    expect(nativeSnapshot).toMatchObject({ role: "button", name })
    expect(actualSnapshot).toEqual({ role: "gridcell", name, states: [], children: [nativeSnapshot] })

    native.role = "gridcell"
    native.name = name
    native.properties = actual.properties
    nativeSnapshotRow.children[0] = { role: "gridcell", name, states: [], children: [nativeSnapshot] }
  }
}

/** useRowDisableSelection removes the select-all action but useA11y still
 * describes it on the header. Verify exactly that stale instruction in WCR. */
function reconcileAnalyticalTableDisabledHeader(ours: any, ui5: any) {
  const header = (capture: any) => capture.ax[0]?.children[0]?.children[0]?.children[0]?.children[0]
  const actual = header(ours), native = header(ui5)
  for (const node of [actual, native]) expect(node).toMatchObject({ role: "columnheader", name: "Selection Column" })
  expect(actual.description).toBeUndefined()
  expect(actual.properties.describedby).toBeUndefined()
  expect(native.description).toBe("To select all rows, press the spacebar.")
  expect(native.properties.describedby).toEqual([{ text: native.description, valid: true }])
  delete native.description
  delete native.properties.describedby
}

/** ColumnHeader/index.js names synthetic headers with an ARIA label alone.
 * Petalo also supplies real text matching that exact name, as required by axe.
 * Compare the original name and all other AX channels. */
function reconcileAnalyticalTableHeaderText(ours: any, ui5: any, index: number) {
  const header = (capture: any) => capture.ax[0]?.children[0]?.children[0]?.children[index]?.children[0]
  const actual = header(ours), native = header(ui5)
  expect(native.role).toBe("columnheader")
  expect(native.name).toMatch(/^(Selection|Highlight|Navigation) Column$/)
  expect(actual).toMatchObject({ role: native.role, name: native.name })
  const text = { role: "StaticText", name: native.name, properties: {}, children: [] }
  expect(native.children).toEqual([])
  expect(actual.children).toEqual([text])
  native.children.push(text)
}

/** Read only the literal a11yDiff object, without running fixture React modules or broadening main.tsx ownership. */
export function allowedDifferences(directory: string): Record<string, Allowed> {
  const result: Record<string, Allowed> = {}
  for (const file of readdirSync(directory).filter((name) => name.endsWith(".tsx"))) {
    const source = ts.createSourceFile(file, readFileSync(`${directory}/${file}`, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const visit = (node: ts.Node) => {
      if (ts.isPropertyAssignment(node) && node.name.getText(source) === "a11yDiffGroups") {
        const groups: { cases: string[]; diff: Allowed }[] = JSON.parse(node.initializer.getText(source))
        for (const { cases, diff } of groups) for (const id of cases) {
          if (result[id]) throw new Error(`Duplicate a11yDiff fixture: ${id}`)
          result[id] = diff
        }
      }
      if (ts.isPropertyAssignment(node) && node.name.getText(source) === "a11yDiff") {
        const json = node.initializer.getText(source)
        // JSON literal metadata gives stable paths and cannot execute arbitrary fixture code.
        Object.assign(result, JSON.parse(json))
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  return result
}

export async function pageAX(page: Page): Promise<AXNode[]> {
  const session = await page.context().newCDPSession(page)
  try {
    await session.send("Accessibility.enable")
    return (await session.send("Accessibility.getFullAXTree")).nodes as AXNode[]
  } finally { await session.detach() }
}

export async function captureAX(page: Page, selector: string, matrixNodes?: AXNode[]) {
  const cell = page.locator(selector)
  await expect(cell).toHaveCount(1)
  const snapshot = normalizeSnapshot(await cell.ariaSnapshot())
  await cell.evaluate((element) => { (window as any).__a11yCell = element })
  const session = await page.context().newCDPSession(page)
  try {
    await session.send("Accessibility.enable")
    const { result } = await session.send("Runtime.evaluate", { expression: "window.__a11yCell" })
    const { node } = await session.send("DOM.describeNode", { objectId: result.objectId! })
    const nodes = matrixNodes ?? (await session.send("Accessibility.getFullAXTree")).nodes
    const root = nodes.find((entry) => entry.backendDOMNodeId === node.backendNodeId)
    if (!root) throw new Error(`Chromium AX tree omitted fixture root ${selector}`)
    return { snapshot, ax: normalizeAX(nodes as AXNode[], root.nodeId) }
  } finally { await session.detach() }
}

export function recordComparison(id: string, record: unknown) {
  const directory = join(treeReportDirectory, "a11y-tree")
  mkdirSync(directory, { recursive: true })
  writeFileSync(`${directory}/${encodeURIComponent(id)}.json`, JSON.stringify({ id, record }, null, 2))
}

export function writeComparisonReport() {
  const directory = join(treeReportDirectory, "a11y-tree")
  mkdirSync(directory, { recursive: true })
  // Each case already has its complete shard. Merge once per matrix under a lock,
  // instead of reparsing every prior capture for every new case.
  // Synchronous write/read/rename under a filesystem lock prevents default parallel
  // workers from publishing a report missing another worker's already-written cases.
  const lock = `${directory}/.report-lock`
  let locked = false
  const lockStart = Date.now()
  while (!locked) { try { mkdirSync(lock); locked = true } catch (error: any) { if (error.code !== "EEXIST") throw error; if (Date.now() - lockStart > 5_000) throw new Error("a11y report lock timed out") } }
  try {
    const report = Object.fromEntries(readdirSync(directory).filter((name) => name.endsWith(".json")).map((name) => {
      const entry = JSON.parse(readFileSync(`${directory}/${name}`, "utf8")); return [entry.id, entry.record]
    }))
    const temp = `${directory}/report-${process.pid}.tmp`
    writeFileSync(temp, JSON.stringify(report, null, 2))
    renameSync(temp, treeReportFile)
  } finally { rmSync(lock, { recursive: true }) }
}

export function diffCapturedTrees(
  ours: Parameters<typeof pairedWrapperDifferences>[0],
  ui5: Parameters<typeof pairedWrapperDifferences>[1],
  ignore: string[] = [],
  legacy = false,
) {
  const raw = diffTree(ours, ui5, ignore)
  if (legacy || !raw.length) return raw
  return pairedWrapperDifferences(ours, ui5) ?? raw
}

export async function compareCase(ours: Page, reference: Page, id: string, key: string, allowed?: Allowed, selector = `[data-fixture="${id}"]`, matrix?: { ours: AXNode[]; reference: AXNode[] }) {
  let a: Awaited<ReturnType<typeof captureAX>>, b: Awaited<ReturnType<typeof captureAX>>
  try {
    ;[a, b] = await Promise.all([captureAX(ours, selector, matrix?.ours), captureAX(reference, selector, matrix?.reference)])
  } catch (error) {
    const captureError = error instanceof Error ? error.message : String(error)
    recordComparison(key, { captured: false, differences: [captureError], captureError })
    return [`${id}: capture failed: ${captureError}`]
  }
  if (allowed) {
    expect(allowed.reason.trim().length).toBeGreaterThan(0)
    expect(allowed.ignore, "Ignoring an entire case is forbidden").not.toContain("")
    expect(allowed.ignore, "Ignoring an entire tree is forbidden").not.toContain("/ax")
    expect(allowed.ignore, "Ignoring the entire snapshot is forbidden").not.toContain("/snapshot")
    for (const path of allowed.ignore) expect(path, "Use an absolute exact channel, explicit inert wrapper, or verified snapshot ownership relocation").toMatch(/^\/(?:snapshot|ax|(?:ours|ui5)\/(?:ax|snapshot))\//)
  }
  let differences: string[], allowanceError: string | undefined
  let compared: { ours: typeof a; ui5: typeof b } | undefined
  try {
    const adjusted = applyAllowedWrappers(a, b, allowed?.ignore ?? [], allowed?.ui5FormHosts, allowed?.ui5FocusScaffolding)
    let native = allowed?.tableLoadingOverlay ? relocateTableLoadingOverlay(adjusted.ui5, allowed.tableLoadingOverlay) : adjusted.ui5
    if (allowed?.calendarHeaderBug) native = correctCalendarHeaderBugs(adjusted.ours, native, allowed.calendarHeaderBug)
    if (allowed?.pinnedPopupShell) {
      if (!/^(select-dialog|dynamic-date-range)-/.test(id)) throw new Error("Pinned popup shell applies only to H9 paired fixtures")
      reconcilePinnedPopupShell(adjusted.ours, native, allowed.pinnedPopupShell)
    }
    if (allowed?.selectDialogShape) {
      if (!allowed.pinnedPopupShell || !id.startsWith("select-dialog-")) throw new Error("SelectDialog fixture shape requires its pinned Dialog shell")
      reconcileSelectDialogFixture(adjusted.ours, native, allowed.selectDialogShape)
    }
    if (allowed?.navigationMenu) {
      if (!/^navigation-menu-(?:default|rtl|customise|expanded(?:-rtl)?)$/.test(id)) throw new Error("NavigationMenu allowance is specific to its paired in-place menus")
      reconcileNavigationMenuFixture(adjusted.ours, native, id.startsWith("navigation-menu-expanded"))
    }
    if (allowed?.dynamicDateRangeEditor) {
      if (allowed.pinnedPopupShell?.kind !== "popover") throw new Error("DynamicDateRange needs its verified pinned popover shell")
      reconcileDynamicDateRangeEditor(adjusted.ours, native, id)
    }
    if (allowed?.splitButtonMenu) {
      if (id !== "split-button-menu-open") throw new Error("Menu composition allowance is specific to split-button-menu-open")
      reconcileSplitButtonMenu(adjusted.ours, native, allowed.splitButtonMenu)
    }
    if (allowed?.analyticalTableHeaderText !== undefined) {
      if (!/^analytical-table-(?:select-single-row(?:selector)?|select-disabled|row-highlight|row-navigation)$/.test(id)) {
        throw new Error("Header text allowance applies only to the paired synthetic AnalyticalTable headers")
      }
      reconcileAnalyticalTableHeaderText(adjusted.ours, native, allowed.analyticalTableHeaderText)
    }
    if (allowed?.analyticalTableDisabledSelection) {
      if (id !== "analytical-table-select-disabled") throw new Error("Disabled selection allowance is specific to analytical-table-select-disabled")
      reconcileAnalyticalTableDisabledHeader(adjusted.ours, native)
    }
    if (allowed?.analyticalTableBusyRow) {
      if (id !== "analytical-table-infinite-busy") throw new Error("Busy-row allowance applies only to the loaded AnalyticalTable")
      reconcileAnalyticalTableBusyRow(adjusted.ours, native)
    }
    if (allowed?.analyticalTableDetailRows) {
      if (!/^analytical-table-details-(?:expanded|visible|included-height|included-expandable)$/.test(id)) {
        throw new Error("Detail-cell allowance applies only to the paired AnalyticalTable detail states")
      }
      reconcileAnalyticalTableDetails(adjusted.ours, native, allowed.analyticalTableDetailRows)
    }
    if (allowed?.numericInputMessage) {
      if (id !== "numeric-input-information") throw new Error("Nested value-state slot allowance is specific to numeric-input-information")
      reconcileNumericInputMessage(adjusted.ours, native, allowed.numericInputMessage)
    }
    if (allowed?.inputPhoneAlerts) {
      if (!id.startsWith("input-suggestions-phone")) throw new Error("Empty phone outlets allowance is specific to Input")
      removeEmptyInputPhoneAlerts(native)
    }
    if (allowed?.messageBoxNameRef) {
      if (id !== "message-box-confirm") throw new Error("Name reference allowance is specific to message-box-confirm")
      reconcileMessageBoxNameRef(adjusted.ours, native)
    }
    if (allowed?.inputSuggestionBanner) {
      if (id !== "input-suggestions-state") throw new Error("Validation header allowance is specific to input-suggestions-state")
      reconcileInputSuggestionBanner(adjusted.ours, native, allowed.inputSuggestionBanner)
    }
    const [engine, direction, ...casePath] = key.split("/")
    const legacy = existsSync("tests/a11y-tree-baseline.json") && readTreeBaseline().entries.some((entry) =>
      entry.matrix === `${engine}/${direction}` && entry.caseId === casePath.join("/") && !entry.path.startsWith("/wrappers/"))
    differences = diffCapturedTrees(adjusted.ours, native, adjusted.leaves, legacy)
    if (allowed && differences.length) compared = { ours: adjusted.ours, ui5: native }
  } catch (error) {
    // A stale or invalid allowance is a case failure, never a reason to lose the
    // rest of the matrix. Keep both full captures for reviewing that allowance.
    allowanceError = error instanceof Error ? error.message : String(error)
    differences = [allowanceError, ...diffTree(a, b)]
  }
  // Captures retain every difference; the ratchet changes acceptance, never the
  // compared roles/names/states/relations/descendants or a11yDiff's strict guards.
  // Before E4's one initial --write, capture real differences and fail normally.
  // The absent-baseline path is never an acceptance waiver.
  const failures = allowanceError || !existsSync("tests/a11y-tree-baseline.json") ? differences : ratchetCase(key, differences, readTreeBaseline())
  recordComparison(key, { captured: true, differences, ratchetFailures: failures, allowed, allowanceError, ours: a, ui5: b, compared })
  return failures.map((line) => `${id}${allowed ? ` (${allowed.reason})` : ""}: ${line}`)
}

