import type { CSSProperties } from "react"
import type { FixtureCase } from "../fixture-types"

type SplitterCase = { vertical?: boolean; fixed?: boolean; three?: boolean; automatic?: boolean }

const cases: FixtureCase<SplitterCase>[] = [
  { id: "splitter-layout-horizontal", props: {} },
  { id: "splitter-layout-vertical", props: { vertical: true } },
  { id: "splitter-layout-fixed", props: { fixed: true } },
  { id: "splitter-layout-three", props: { three: true } },
  { id: "splitter-layout-automatic", props: { automatic: true } },
]

export const splitterCases = { name: "splitter-layout", reference: "wcr" as const, cases }
export const frame: CSSProperties = { width: 320, height: 224 }
export const paneStyle: CSSProperties = { background: "var(--sapGroup_ContentBackground)" }
export const automaticFrame: CSSProperties = { ...frame, width: 500 }
export const automaticWidths = [20, 180]

export function automaticContent(width: number) {
  return <div style={{ width, height: "1rem", background: "var(--sapGroup_ContentBorderColor)" }} />
}
