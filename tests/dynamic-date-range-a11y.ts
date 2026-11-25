import { expect } from "@playwright/test"

type Snapshot = {
  role: string
  name?: string
  states: string[]
  text?: string
  children: Snapshot[]
}
type AX = {
  role: string
  name: string
  description?: string
  value?: string | number
  properties: Record<string, unknown>
  children: AX[]
}
type Capture = { ax: AX[]; snapshot: Snapshot[] }

const ax = (role: string, name = "", properties: AX["properties"] = {}, children: AX[] = []): AX =>
  ({ role, name, properties, children })
const generic = (children: AX[] = [], properties: AX["properties"] = {}) => ax("generic", "", properties, children)
const snapshot = (role: string, extra: Partial<Omit<Snapshot, "role">> = {}): Snapshot =>
  ({ role, states: [], children: [], ...extra })
const labels = (name: string) => [{ text: name, valid: true }]
const focusable = { focusable: true }
const valid = { invalid: "false" }

function childrenOf(node: AX, count: number, properties: AX["properties"] = {}) {
  expect(node).toEqual(generic(node?.children, properties))
  expect(node.children).toHaveLength(count)
  return node.children
}

function removeEmptyOutlets(ours: Capture, native: Capture, live: "polite" | "assertive", count: number) {
  // Popup.js registers UI5 regions in openPopup. Its pinned fixture is closed.
  // The mounted React portals match the live channels in the interaction tests.
  const a = ours.ax[0].children, b = native.ax[0].children
  const aSnapshot = ours.snapshot[0].children, bSnapshot = native.snapshot[0].children
  expect(a).toHaveLength(b.length + count)
  expect(aSnapshot).toHaveLength(bSnapshot.length + count)
  for (let i = 0; i < count; i++) {
    expect(a.pop()).toEqual(ax("alert", "", { atomic: true, live, relevant: "additions text" }))
    expect(aSnapshot.pop()).toEqual(snapshot("alert"))
  }
}

function verifyName(actual: AX, native: AX, role: string, name: string) {
  expect(actual).toMatchObject({ role, name, properties: { labelledby: labels(name) } })
  expect(native).toMatchObject({ role, name: "" })
  expect(native.properties.labelledby).toBeUndefined()
  native.name = name
  native.properties.labelledby = labels(name)
}

function reconcileOptions(ours: Capture, native: Capture) {
  removeEmptyOutlets(ours, native, "polite", 1)
  const [nativeHost] = native.ax[0].children
  const [nativeRoot] = childrenOf(nativeHost, 1)
  const [nativeInner] = childrenOf(nativeRoot, 1)
  const [nativeScroll] = childrenOf(nativeInner, 1)
  const [start, title, list, end] = childrenOf(nativeScroll, 4)
  expect([start, end]).toEqual([generic([], focusable), generic([], focusable)])
  const [reactHost] = ours.ax[0].children
  const [reactScroll] = childrenOf(reactHost, 1)
  const [, reactTitle, reactList] = childrenOf(reactScroll, 4)
  expect(childrenOf(reactTitle, 1)).toEqual([title])
  expect(title).toEqual(ax("StaticText", "Contains Selectable Items"))
  native.ax[0].children = [generic([generic([start, generic([title]), list, end])])]
  expect(list.children).toHaveLength(7)
  expect(reactList.children).toHaveLength(7)

  // ListTemplate projects the same text before each named option in the
  // snapshot. Only remove that copy after matching the row's visible text.
  const nativeSnapshot = native.snapshot[0].children[1]
  expect(nativeSnapshot.role).toBe("list")
  expect(nativeSnapshot.children).toHaveLength(14)
  const rows: Snapshot[] = []
  for (const [index, item] of list.children.entries()) {
    expect(item.role).toBe("listitem")
    expect(item.children).toHaveLength(3)
    const [label, action, described] = item.children
    const [visible] = childrenOf(label, 1)
    expect(visible).toEqual(ax("StaticText", visible.name))
    expect(described).toEqual(ax("StaticText", "Not Selected"))
    expect(action).toEqual(ax("StaticText", index < 3 ? "Is Active" : "Navigation"))
    item.children = index < 3
      ? [label, generic([action]), generic([described])]
      : [generic([visible, action]), generic(), generic([described])]
    const [copy, row] = nativeSnapshot.children.slice(index * 2, index * 2 + 2)
    expect(copy).toEqual(snapshot("text", { text: visible.name }))
    expect(row).toMatchObject({ role: "listitem", name: item.name })
    rows.push(row)
  }
  nativeSnapshot.children = rows
}

function reconcileCalendar(ours: Capture, native: Capture, withSwitch: boolean) {
  removeEmptyOutlets(ours, native, "assertive", withSwitch ? 2 : 1)
  const actual = ours.ax[0].children, reference = native.ax[0].children
  const index = withSwitch ? 2 : 1
  const [,, actualYear] = childrenOf(actual[index], 5)
  const [,, nativeYear] = childrenOf(reference[index], 5)
  // CalendarHeaderTemplate's translated key spells the same shortcut with spaces.
  expect(nativeYear).toMatchObject({ role: "button", name: "Year 2026", properties: { keyshortcuts: "Shift + F4" } })
  expect(actualYear).toMatchObject({ role: "button", name: "Year 2026", properties: { keyshortcuts: "Shift+F4" } })
  nativeYear.properties.keyshortcuts = "Shift+F4"
  if (!withSwitch) return

  // FromDateTimeTemplate provides names for Date and Time individually but
  // supplies no accessibleName for their parent SegmentedButton.
  const [actualSwitch, nativeSwitch] = [actual[1], reference[1]]
  expect(actualSwitch).toMatchObject({ role: "listbox", name: "Date / Time" })
  expect(nativeSwitch).toMatchObject({ role: "listbox", name: "" })
  nativeSwitch.name = "Date / Time"
  expect(actualSwitch.children).toHaveLength(2)
  expect(nativeSwitch.children).toHaveLength(2)
  for (const [i, name] of ["Date", "Time"].entries()) {
    const react = actualSwitch.children[i], ui5 = nativeSwitch.children[i]
    expect(react).toMatchObject({ role: "option", name, properties: valid })
    expect(ui5).toMatchObject({ role: "option", name })
    expect(ui5.properties.invalid).toBeUndefined()
    ui5.properties.invalid = "false"
  }
  const a = ours.snapshot[0].children[1], b = native.snapshot[0].children[1]
  expect(a).toMatchObject({ role: "listbox", name: "Date / Time" })
  expect(b.role).toBe("listbox")
  expect(b.name).toBeUndefined()
  b.name = "Date / Time"
}

function reconcileAmount(ours: Capture, native: Capture) {
  const actual = ours.ax[0].children, reference = native.ax[0].children
  expect(actual).toHaveLength(7)
  expect(reference).toHaveLength(7)
  const amountName = "Value for X", unitName = "Unit of Time"

  // LastNextTemplate emits labels beside the controls. NumericInputTemplate
  // uses icon hosts with tooltip parents and a nested Input textbox.
  const [actualRow] = childrenOf(actual[2], 1)
  const [dec, box, inc] = childrenOf(actualRow, 3)
  const [spin] = childrenOf(box, 1)
  const [nativeRoot] = childrenOf(reference[2], 1, valid)
  const [nativeRow, suffix] = childrenOf(nativeRoot, 2, valid)
  expect(suffix).toEqual(generic())
  const [nativeDec, inputHost, nativeInc] = childrenOf(nativeRow, 3)
  const [inputRoot] = childrenOf(inputHost, 1, valid)
  const [prefix, textbox] = childrenOf(inputRoot, 2)
  expect(prefix).toEqual(generic())
  expect(spin).toMatchObject({
    role: "spinbutton", name: amountName, value: 2,
    properties: { labelledby: labels(amountName), valuemin: 1, valuemax: 9999, valuetext: "2" },
  })
  expect(textbox).toMatchObject({ role: "textbox", name: "", value: "2", properties: { multiline: false, readonly: false } })
  expect(textbox.properties.labelledby).toBeUndefined()
  const { multiline, readonly, ...common } = textbox.properties
  const stepped = ax("spinbutton", amountName, {
    ...common, labelledby: labels(amountName), valuemin: 1, valuemax: 9999, valuetext: "2",
  }, textbox.children)
  stepped.value = Number(textbox.value)

  const buttons = ["Decrease", "Increase"].map((name, i) => {
    expect(i === 0 ? nativeDec : nativeInc).toEqual({ ...generic([generic([], focusable)]), description: name })
    const icon = { ...generic([ax("button", name, {
      ...focusable, ...valid, controls: [{ role: "spinbutton", name: amountName, ignored: false, valid: true }],
    })]), description: name }
    expect(i === 0 ? dec : inc).toEqual(icon)
    return icon
  })
  reference[2] = generic([generic([buttons[0], generic([stepped]), buttons[1]])])

  const [aUnit] = childrenOf(actual[4], 1), [bUnit] = childrenOf(reference[4], 1)
  verifyName(aUnit, bUnit, "combobox", unitName)
  expect(aUnit.properties.invalid).toBe("false")
  expect(bUnit.properties.invalid).toBeUndefined()
  bUnit.properties.invalid = "false"
  bUnit.children = [generic(bUnit.children)]

  const [a, b] = [ours.snapshot[0].children, native.snapshot[0].children]
  expect(b[2]).toEqual(snapshot("textbox", { text: '"2"' }))
  expect(a.slice(2, 5)).toEqual([
    snapshot("button", { name: "Decrease" }), snapshot("spinbutton", { name: amountName, text: '"2"' }),
    snapshot("button", { name: "Increase" }),
  ])
  expect(b[4]).toEqual(snapshot("combobox", { text: "Days" }))
  b[4].name = unitName
  b.splice(2, 1, ...a.slice(2, 5))
}

function reconcileDateTimeRange(ours: Capture, native: Capture) {
  const actual = ours.ax[0].children, reference = native.ax[0].children
  expect(actual).toHaveLength(7)
  expect(reference).toHaveLength(7)
  const [a, b] = [ours.snapshot[0].children, native.snapshot[0].children]
  expect(a).toHaveLength(9)
  expect(b).toHaveLength(7)
  const icon = { ...ax("button", "Open Picker"), description: "Open Picker" }

  // DateTimeRangeTemplate supplies no label references. DatePickerInputTemplate
  // composes a focusable icon host. React exposes the same action as a button.
  for (const [index, name] of ["From", "To"].entries()) {
    const slot = 2 + 2 * index
    const [reactBox, reactIcon] = childrenOf(actual[slot], 2)
    const [host] = childrenOf(reference[slot], 1)
    const [root] = childrenOf(host, 1, valid)
    const [spacer, input, nativeIcon] = childrenOf(root, 3)
    expect(spacer).toEqual(generic())
    expect(nativeIcon).toEqual(generic([generic([], focusable)], focusable))
    expect(reactIcon).toEqual(icon)
    verifyName(reactBox, input, "textbox", name)
    reference[slot].children = [input, icon]
    const react = a[2 + 3 * index], ui5 = b[slot]
    expect(ui5).toEqual(snapshot("textbox", { text: String(input.value) }))
    // The DateTimeInput shadow wrapper represents the value as snapshot text
    // and omits the input placeholder from that projection. Keep both checks.
    expect(react).toEqual(snapshot("textbox", { name, children: [
      snapshot("/placeholder", { text: "e.g. Dec 31, 2026, 11:59:59 PM" }),
      snapshot("text", { text: ui5.text }),
    ] }))
    expect(a[3 + 3 * index]).toEqual(snapshot("button", { name: "Open Picker" }))
  }
  for (const [nativeIndex, reactIndex] of [[4, 5], [2, 2]]) {
    b.splice(nativeIndex, 1, a[reactIndex], snapshot("button", { name: "Open Picker" }))
  }
}

export function reconcileDynamicDateRangeEditor(ours: Capture, reference: Capture, id: string) {
  switch (id) {
    case "dynamic-date-range-options":
      reconcileOptions(ours, reference)
      break
    case "dynamic-date-range-date-editor":
    case "dynamic-date-range-period-editor":
      reconcileCalendar(ours, reference, false)
      break
    case "dynamic-date-range-from-date-time-editor":
    case "dynamic-date-range-to-date-time-editor":
      reconcileCalendar(ours, reference, true)
      break
    case "dynamic-date-range-amount":
    case "dynamic-date-range-next-editor":
      reconcileAmount(ours, reference)
      break
    case "dynamic-date-range-date-time-editor":
      reconcileDateTimeRange(ours, reference)
      break
    default:
      throw new Error("DynamicDateRange tree reconciliation requires an exact open case: " + id)
  }
}
