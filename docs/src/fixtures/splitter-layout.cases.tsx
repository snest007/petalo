import type { CSSProperties } from "react"
import type { FixtureCase } from "../fixture-types"

type SplitterCase = { vertical?: boolean; fixed?: boolean; three?: boolean }

const cases: FixtureCase<SplitterCase>[] = [
  { id: "splitter-layout-horizontal", props: {} },
  { id: "splitter-layout-vertical", props: { vertical: true } },
  { id: "splitter-layout-fixed", props: { fixed: true } },
  { id: "splitter-layout-three", props: { three: true } },
]

export const splitterCases = { name: "splitter-layout", reference: "wcr" as const, cases }
export const frame: CSSProperties = { width: 320, height: 224 }
export const paneStyle: CSSProperties = { background: "var(--sapGroup_ContentBackground)" }
