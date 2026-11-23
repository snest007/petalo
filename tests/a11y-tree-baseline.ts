import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"

// Keep calendar Today labels on the date captured by the initial ratchet.
export const treeBaselineDate = new Date(2026, 10, 18, 12)

export type BaselineEntry = { matrix: string; caseId: string; path: string; kind: string; owner: string; fingerprint?: string }
export type TreeBaseline = { version: 1; entries: BaselineEntry[] }
// docs/plan/README.md wave P is the owning-card map; keep aliases explicit.
export const groups: Record<string, string[]> = {
  P1: "button split-button button-badge numeric-input segmented-button toggle-button label input textarea checkbox radio-group switch slider rating-indicator step-input select form".split(" "),
  P2: "combobox multi-combobox multi-input token tokenizer file-uploader color-palette color-palette-popover color-picker time-picker picker-field dynamic-date-range".split(" "),
  P2a: "calendar date-picker date-range-picker date-time-picker".split(" "),
  P3: "table data-table list tree timeline upload-collection object-status object-number object-identifier".split(" "),
  P4: "dialog popover responsive-popover menu toast user-menu value-help-dialog view-settings-dialog adapt-filters-dialog select-dialog".split(" "),
  P5: "avatar busy-indicator card carousel expandable-text hero-banner illustrated-message link media-gallery message-strip panel progress-indicator tag text title".split(" "),
  P6: "bar breadcrumbs filter-bar notification-list product-switch search shell-bar side-navigation tabs toolbar variant-management wizard dynamic-page dynamic-side-content flexible-column-layout navigation-layout object-page page f6-navigation variants splitter-layout".split(" "),
}
export function componentOwner(component: string): string {
  const aliases: Record<string, string> = { shellbar: "shell-bar", "shellbar-search": "shell-bar", "calendar-legend": "calendar", "time-selection-inputs": "time-picker", icon: "text", icons: "text" }
  const normalized = aliases[component] ?? component
  const owner = Object.entries(groups).find(([, components]) => components.includes(normalized))?.[0]
  if (!owner) throw new Error(`No P-card owner for component ${component}`)
  return owner
}
export function caseOwner(caseId: string): string {
  const normalized = caseId.replace(/^sapui5-/, "").replace(/^shellbar(?=-)/, "shell-bar").replace(/^icons?(?=-|$)/, "text")
  const component = Object.values(groups).flat().sort((a, b) => b.length - a.length).find((name) => normalized === name || normalized.startsWith(`${name}-`))
  if (!component) throw new Error(`No P-card owner for case ${caseId}`)
  return componentOwner(component)
}
// The test server's origin carries PORT (any free port per AGENTS.md), so link `url` mismatches would change
// fingerprint with the port. Hash a port-independent line.
export const portableLine = (line: string) => line.replace(/https?:\/\/(?:localhost|127\.0\.0\.1):\d+/g, "<origin>")
export const entryKey = (entry: BaselineEntry) => JSON.stringify([entry.matrix, entry.caseId, entry.path, entry.kind])
export function differenceEntry(key: string, line: string): BaselineEntry {
  const [engine, direction, ...id] = key.split("/")
  const caseId = id.join("/")
  if (!caseId || !["webcomponents", "phone", "openui5"].includes(engine) || !["ltr", "rtl"].includes(direction)) throw new Error(`Invalid matrix key ${key}`)
  const match = /^(\/[^:]*): (.+)$/.exec(line)
  if (!match) throw new Error(`Non-tree failure cannot enter the baseline: ${key}: ${line}`)
  const [, path, details] = match
  let kind: string
  if (/\/role$/.test(path)) kind = "role"
  else if (/\/name$/.test(path)) kind = "name"
  else if (/\/description$/.test(path)) kind = "description"
  else if (/\/states\/\d+$/.test(path)) kind = `state:${/\[([\w-]+)/.exec(details)?.[1] ?? "unknown"}`
  else if (/\/properties\//.test(path)) kind = `state:${path.split("/properties/")[1].split("/")[0]}`
  else if (/\/value$/.test(path)) kind = "value"
  else if (/\/text$/.test(path)) kind = "text"
  else if (details.startsWith("ours undefined; UI5 ") && /UI5 [\[{]/.test(details)) kind = "missing-node"
  else if (details.endsWith("; UI5 undefined") && /ours [\[{]/.test(details)) kind = "extra-node"
  else kind = "structure"
  return { matrix: `${engine}/${direction}`, caseId, path, kind, owner: caseOwner(caseId), fingerprint: createHash("sha256").update(portableLine(line)).digest("hex") }
}
export function reportEntries(report: Record<string, any>): BaselineEntry[] {
  const entries: BaselineEntry[] = []
  for (const [key, record] of Object.entries(report)) {
    if (!record || record.captured !== true || record.captureError || record.allowanceError || !Array.isArray(record.differences) || record.differences.some((line: unknown) => typeof line !== "string")) throw new Error(`Capture/allowance failure cannot be baselined: ${key}`)
    entries.push(...record.differences.map((line: string) => differenceEntry(key, line)))
  }
  const unique = new Map(entries.map((entry) => [entryKey(entry), entry]))
  if (unique.size !== entries.length) throw new Error("Duplicate baseline difference identities")
  return [...unique.values()].sort((a, b) => entryKey(a).localeCompare(entryKey(b)))
}
export function parseTreeBaseline(value: unknown): TreeBaseline {
  const baseline = value as TreeBaseline
  if (!baseline || baseline.version !== 1 || !Array.isArray(baseline.entries)) throw new Error("Malformed accessibility tree baseline")
  const identities = new Set<string>()
  for (const entry of baseline.entries) {
    if (!entry || !["webcomponents/ltr", "webcomponents/rtl", "phone/ltr", "openui5/ltr"].includes(entry.matrix) || typeof entry.caseId !== "string" || !entry.caseId || typeof entry.path !== "string" || !entry.path.startsWith("/") || typeof entry.kind !== "string" || !entry.kind || !/^[a-f0-9]{64}$/.test(entry.fingerprint ?? "")) throw new Error("Malformed accessibility tree baseline entry")
    if (caseOwner(entry.caseId) !== entry.owner) throw new Error(`Incorrect baseline owner for ${entry.caseId}`)
    const key = entryKey(entry)
    if (identities.has(key)) throw new Error(`Duplicate baseline identity ${key}`)
    identities.add(key)
  }
  return baseline
}
let cached: TreeBaseline | undefined
export function readTreeBaseline(): TreeBaseline {
  return cached ??= parseTreeBaseline(JSON.parse(readFileSync("tests/a11y-tree-baseline.json", "utf8")))
}
export function ratchetCase(key: string, lines: string[], baseline: TreeBaseline): string[] {
  const actual = lines.map((line) => differenceEntry(key, line))
  const [engine, direction, ...id] = key.split("/")
  const expected = baseline.entries.filter((entry) => entry.matrix === `${engine}/${direction}` && entry.caseId === id.join("/"))
  const current = new Set(actual.map(entryKey)), known = new Set(expected.map(entryKey)), expectedByKey = new Map(expected.map((entry) => [entryKey(entry), entry]))
  return [...actual.filter((entry) => expectedByKey.get(entryKey(entry))?.fingerprint && expectedByKey.get(entryKey(entry))!.fingerprint !== entry.fingerprint).map((entry) => `changed mismatch ${entryKey(entry)} (owner ${entry.owner})`),
    ...actual.filter((entry) => !known.has(entryKey(entry))).map((entry) => `unlisted ${entryKey(entry)}`),
    ...expected.filter((entry) => !current.has(entryKey(entry))).map((entry) => `stale — delete it: ${entryKey(entry)} (owner ${entry.owner})`)]
}
export function staleCaseCoverage(matrix: string, ids: string[], baseline = readTreeBaseline()) {
  const covered = new Set(ids)
  return baseline.entries.filter((entry) => entry.matrix === matrix && !covered.has(entry.caseId)).map((entry) => `stale case absent from ${matrix}: ${entry.caseId} (owner ${entry.owner})`)
}
export function baselineCounts(entries: BaselineEntry[]) {
  const owners: Record<string, number> = {}, matrices: Record<string, number> = {}
  for (const entry of entries) { owners[entry.owner] = (owners[entry.owner] ?? 0) + 1; matrices[entry.matrix] = (matrices[entry.matrix] ?? 0) + 1 }
  return { total: entries.length, owners, matrices }
}
