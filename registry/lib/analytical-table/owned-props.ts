// SPDX-License-Identifier: Apache-2.0
import type { ComponentPropsWithRef } from "react"
import { cn } from "@/lib/utils"

// Bundlers inline NODE_ENV without requiring Node types in browser projects.
declare const process: { env: { NODE_ENV?: string } }

export type HostProps = ComponentPropsWithRef<"div">

// The layout and content extension surfaces use the same semantic host contract.
export function mergeHost(part: string, owned: HostProps, ...extras: (HostProps | undefined)[]): HostProps {
  const result = { ...owned }
  for (const extra of extras) {
    for (const [key, value] of Object.entries(extra ?? {})) {
      if (value === undefined || key === "children") continue
      const prop = key as keyof HostProps
      if (/^(role|id|tabindex|draggable|data-slot|dangerouslysetinnerhtml)$/i.test(key) ||
        (key.startsWith("aria-") && !["aria-describedby", "aria-details"].includes(key)) ||
        (key.startsWith("data-") && key in owned)) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`AnalyticalTable ${part}: ignored owned prop "${key}".`)
        }
      } else if (key === "aria-describedby") {
        result["aria-describedby"] = [result["aria-describedby"], extra?.["aria-describedby"]].filter(Boolean).join(" ") || undefined
      } else if (key === "className") {
        result.className = cn(result.className, extra?.className)
      } else if (key === "style") {
        result.style = { ...extra?.style, ...result.style }
      } else if (key === "ref") {
        const refs = [result.ref, extra?.ref]
        result.ref = (node) => {
          const cleanups = refs.map(ref => {
            if (typeof ref === "function") return ref(node)
            if (ref) ref.current = node
          })
          return () => refs.forEach((ref, i) => {
            const cleanup = cleanups[i]
            if (typeof cleanup === "function") cleanup()
            else if (typeof ref === "function") ref(null)
            else if (ref) ref.current = null
          })
        }
      } else if (/^on[A-Z]/.test(key) && typeof result[prop] === "function" && typeof value === "function") {
        const core = result[prop] as (event: unknown) => void
        Object.assign(result, { [key]: (event: unknown) => { core(event); value(event) } })
      } else {
        Object.assign(result, { [key]: value })
      }
    }
  }
  return result
}
