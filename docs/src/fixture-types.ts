// Each component has two fixture files:
//   docs/src/fixtures/<component>.tsx     default-exports a FixtureSet (cases + React renderer)
//   docs/src/fixtures/<component>.ui5.ts  default-exports a Ui5Renderer for the same cases
// index.html?fixtures renders the React side, ui5.html the UI5 side (SAP's official implementation,
// kept in a separate file so UI5 never loads into our page). tests/visual.spec.ts screenshots every
// [data-fixture] cell on both pages and diffs them pixel by pixel.
import type * as React from "react"

export type FixtureCase<P = any> = {
  id: string
  props: P
  /** Reason this individual visual case intentionally lets a popup leave its cell. */
  popupOverflowReason?: string
  /** Interaction target relative to the cell; otherwise use its first focusable element. */
  interact?: { selector?: string; ui5Selector?: string }
}

export type FixtureSet<P = any> = {
  /** Component name, also the prefix of every case id ("button" -> "button-emphasized"). */
  name: string
  cases: FixtureCase<P>[]
  react: (props: P) => React.ReactNode
  /** SAP reference engine for this fixture set. Defaults to UI5 Web Components. */
  reference?: "ui5" | "wcr" | "sapui5"
  /** Max share of differing pixels per cell; default 0.02. Raise only with a comment explaining why. */
  tolerance?: number
  /** Opt out of comparing specific case ids against UI5 (keep them in the docs grid). Explain why. */
  skipCompare?: string[]
  /** Narrow absolute comparison paths; only documented UI5 bugs or inert DOM wrappers may differ. */
  a11yDiff?: Record<string, FixtureA11yDiff>
  /** One path declaration shared by explicitly listed cases with identical wrapper structure. */
  a11yDiffGroups?: { cases: string[]; diff: FixtureA11yDiff }[]
}

type FixtureA11yDiff = {
  ignore: string[]
  reason: string
  /** Zero-based AnalyticalTable body rows whose WCR detail regions lack the required gridcell role. */
  analyticalTableDetailRows?: number[]
  /** The pinned WCR disabled-selection plugin leaves an inactive header instruction. */
  analyticalTableDisabledSelection?: true
  /** Exact UI5 form-associated shadow hosts with implicit invalid=false. */
  ui5FormHosts?: string[]
  /** Exact empty UI5 popup/List focus sentinels and the anonymous UI5 popup host. */
  ui5FocusScaffolding?: string[]
  /** Popup.js resolves custom header name references in the host before emitting aria-label. */
  messageBoxNameRef?: true
  /** InputSuggestionsTemplate's phone Dialog allocates empty Popup announcement outlets. */
  inputPhoneAlerts?: true
  /** PopoverTemplate's nested banner appears as a group in the desktop Input. */
  inputSuggestionBanner?: { ax: string; snapshot: string }
  /** Only exact, closed PopupTemplate shells painted in place by the fixture. */
  pinnedPopupShell?: { kind: "dialog" | "popover"; name: string }
  /** Fixed SelectDialog capture topology, after verifying the pinned Dialog shell. */
  selectDialogShape?: "single" | "multiple" | "selected" | "empty"
  /** Exact H8 composed Menu boundary, including the native focus guards and item hint. */
  splitButtonMenu?: { item: string; opener: string; dialog: string; activeHint: string }
  /** NumericInputTemplate's nested value-state slot loses its supplied text in the native description. */
  numericInputMessage?: { state: string; message: string }
  /** S0's TableTemplate.js loading-grid defect only. Move the complete native
   * overlay after its grid; preserve and compare every channel and descendant.
   * Paths are exact after strictly inert wrappers are removed.
   */
  tableLoadingOverlay?: { gridName: string; progressbarName: string; ax: string; snapshot: string }
  /** Exact CalendarHeaderTemplate.js native bugs only: invalid Shift + F4
   * syntax and S0's missing visible year-range name. Runtime guards validate
   * the complete expected channels before making either correction. */
  calendarHeaderBug?: { shortcutAX: string; yearRange?: { ax: string; snapshot: string; from: number; to: number } }
}

export const defineFixtures = <P,>(set: FixtureSet<P>) => set

/** Optional asynchronous preparation completed after the fixture root is mounted. */
export type Ui5FixtureElement = HTMLElement & { fixtureReady?: Promise<void> }

/** Builds the UI5 element for one case. Import the UI5 component modules (and icons) at the top of the file. */
export type Ui5Renderer<P = any> = (props: P) => Ui5FixtureElement

export const defineUi5 = <S extends FixtureSet>(_set: S, render: Ui5Renderer<S extends FixtureSet<infer P> ? P : never>) => render

/** Shared width for fields, so inputs/selects are the same width on both pages. */
export const FIELD_WIDTH = "13.125rem"

/** Helper for the ui5 renderer: create an element with attributes (true -> boolean attribute) and children. */
export function h(tag: string, attrs: Record<string, string | boolean | undefined | null> = {}, ...children: (Node | string)[]) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v === true) el.setAttribute(k, "")
    else if (v !== false && v != null) el.setAttribute(k, v)
  }
  el.append(...children)
  return el
}

export type PageOptions = { theme: string; density: "cozy" | "compact"; dir: "ltr" | "rtl"; locale?: string; only?: string }

export function readPageOptions(): PageOptions {
  const q = new URLSearchParams(location.search)
  return {
    theme: q.get("theme") ?? "sap_horizon",
    density: q.get("density") === "compact" ? "compact" : "cozy",
    dir: q.get("dir") === "rtl" ? "rtl" : "ltr",
    locale: q.get("locale") ?? undefined,
    only: q.get("only") ?? undefined,
  }
}

/** Rounds every fixture slot up to whole-pixel width/height (shared by both pages). */
export async function snapSlots() {
  await new Promise((r) => requestAnimationFrame(r))
  const slots = [...document.querySelectorAll<HTMLElement>("[data-fixture-slot]")]
  const sizes = slots.map((s) => s.firstElementChild!.getBoundingClientRect())
  slots.forEach((s, i) => {
    s.style.width = `${Math.ceil(sizes[i].width)}px`
    s.style.height = `${Math.ceil(sizes[i].height)}px`
  })
  await new Promise((r) => requestAnimationFrame(r))
}
