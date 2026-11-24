import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

export const initialMatrices = ["webcomponents/ltr", "webcomponents/rtl", "phone/ltr", "openui5/ltr"] as const
export const matrices = [...initialMatrices, "wcr/ltr", "wcr/rtl"] as const
export const treeReportDirectory = process.env.PETALO_TREE_REPORT_DIR ?? "test-results"
export const treeReportFile = join(treeReportDirectory, "a11y-tree-report.json")

const root = fileURLToPath(new URL("../", import.meta.url))
const coverageFile = (directory: string, matrix: string) => join(directory, `a11y-tree-coverage-${matrix.replace("/", "-")}.json`)

// Tie the runtime inventory to the owning source. A capture made before fixture
// or component edits cannot authorize the one-time initial baseline afterward.
export function captureSourceFingerprint() {
  const directories = ["docs/src/fixtures", "docs/src/fixtures-phone", "docs/src/fixtures-sapui5", "registry/ui"]
  const files = directories.flatMap((directory) => readdirSync(join(root, directory)).filter((file) => /.(tsx?|js)$/.test(file)).map((file) => `${directory}/${file}`))
  files.push("docs/src/fixture-types.ts", "sapui5/webapp/fixtures.js")
  const hash = createHash("sha256")
  for (const file of files.sort()) hash.update(file).update("\0").update(readFileSync(join(root, file))).update("\0")
  return hash.digest("hex")
}

// Call only after both runtime pages agree on their full owning-case inventory.
// A filtered comparison still writes the FULL inventory, so it cannot look complete.
export function writeMatrixCoverage(matrix: string, ids: string[], directory = treeReportDirectory) {
  if (!matrices.includes(matrix as typeof matrices[number]) || !ids.length || new Set(ids).size !== ids.length) throw new Error(`Invalid coverage inventory ${matrix}`)
  mkdirSync(directory, { recursive: true })
  writeFileSync(coverageFile(directory, matrix), JSON.stringify({ version: 1, matrix, count: ids.length, ids: [...ids].sort(), sourceFingerprint: captureSourceFingerprint() }, null, 2) + "\n")
}

export function requireCompleteCapture(report: Record<string, unknown>, reportPath: string, required: readonly string[] = matrices) {
  const counts: Record<string, number> = {}
  const expected = new Set<string>(), fingerprint = captureSourceFingerprint()
  for (const matrix of required) {
    let coverage
    try { coverage = JSON.parse(readFileSync(coverageFile(dirname(reportPath), matrix), "utf8")) }
    catch { throw new Error(`Incomplete report: missing full fixture inventory for ${matrix}`) }
    if (coverage.version !== 1 || coverage.matrix !== matrix || !Array.isArray(coverage.ids) || !coverage.ids.length || coverage.ids.some((id: unknown) => typeof id !== "string" || !id) || new Set(coverage.ids).size !== coverage.ids.length || coverage.count !== coverage.ids.length) throw new Error(`Incomplete report: invalid full fixture inventory for ${matrix}`)
    if (coverage.sourceFingerprint !== fingerprint) throw new Error(`Incomplete report: source changed since ${matrix} inventory was captured`)
    for (const id of coverage.ids) expected.add(`${matrix}/${id}`)
    const actual = Object.keys(report).filter((key) => key.startsWith(`${matrix}/`))
    counts[matrix] = coverage.count
    const missing = coverage.ids.filter((id: string) => !Object.hasOwn(report, `${matrix}/${id}`))
    if (missing.length || actual.length !== coverage.count) throw new Error(`Incomplete report: ${matrix} requires ${coverage.count} fixtures, captured ${actual.length}; missing ${missing.slice(0, 5).join(", ")}`)
  }
  if (Object.keys(report).some((key) => !expected.has(key))) throw new Error("Incomplete report: unexpected fixture or matrix outside the complete inventory")
  return counts
}
