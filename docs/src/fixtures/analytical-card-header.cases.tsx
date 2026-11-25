// Neutral inputs for both React and the pinned WCR oracle.
export type KpiState = "none" | "neutral" | "positive" | "critical" | "negative"
export type KpiCase = {
  value: number | string
  state?: KpiState
  trend?: "none" | "up" | "down"
  details?: boolean
  custom?: boolean
}
export const kpiCases: { id: string; props: KpiCase }[] = [
  { id: "analytical-card-header-default", props: { value: 128 } },
  { id: "analytical-card-header-positive", props: { value: 1264.5, state: "positive", trend: "up", details: true } },
  { id: "analytical-card-header-negative", props: { value: -84.2, state: "negative", trend: "down", details: true } },
  { id: "analytical-card-header-critical", props: { value: "91.8", state: "critical", details: true } },
  { id: "analytical-card-header-neutral", props: { value: 0, state: "neutral", details: true } },
  { id: "analytical-card-header-customise", props: { value: 1280.5, state: "positive", trend: "up", details: true, custom: true } },
]
export const actionStyle = { background: "none", border: 0, padding: 0, font: "inherit", color: "inherit" } as const
export const kpiFrame = { width: "24rem" } as const
export const kpiLabels = {
  subtitleText: "Current quarter", scale: "M",
  unitOfMeasurement: "EUR", status: "2 of 4", description: "Compared with the previous quarter",
}
export const kpiSides = [
  { titleText: "Target", number: 1300.25, unit: "M", state: "neutral" },
  { titleText: "Deviation", number: -2.75, unit: "%", state: "critical" },
] as const
