"use client"

// Derived from UI5 Web Components for React 2.28.2 (SplitterLayout, SplitterElement and Splitter),
// © SAP SE or an SAP affiliate company and contributors. SPDX-License-Identifier: Apache-2.0.
import * as React from "react"
import { Icon } from "@/components/ui/icon"
import { horizontalGrip, verticalGrip } from "@/lib/fiori-icons"
import { useFioriLocale } from "@/lib/fiori-locale"
import { cn } from "@/lib/utils"

type SplitterLayoutSlot = "root" | "pane" | "separator" | "line" | "grip"
type SplitterLayoutTexts = { keyboardHint: string }
type SplitterElementProps = React.ComponentProps<"div"> & {
  /** Initial CSS size, including the separator after this pane. Numbers represent pixels. */
  size?: string | number
  minSize?: number
  resizable?: boolean
}
type SplitterLayoutProps = Omit<React.ComponentProps<"div">, "onResize"> & {
  vertical?: boolean
  /** Controlled pane sizes in pixels, excluding the separator. Undefined entries use the pane's initial size. */
  sizes?: readonly (number | undefined)[]
  defaultSizes?: readonly (number | undefined)[]
  onSizesChange?: (sizes: readonly (number | undefined)[]) => void
  onResize?: (detail: { areas: [{ size: number; area: HTMLElement }, { size: number; area: HTMLElement }]; splitter: HTMLElement }) => void
  locale?: string
  texts?: Partial<SplitterLayoutTexts>
  /** Experimental styling of the owned layout, pane and separator parts. */
  classNames?: Partial<Record<SplitterLayoutSlot, string>>
}

type PaneLayout = { basis: string; className?: string; vertical: boolean }
const PaneContext = React.createContext<PaneLayout | null>(null)

function SplitterElement({ size: _size, minSize = 0, resizable: _resizable, children, className, style, ...props }: SplitterElementProps) {
  const layout = React.useContext(PaneContext)
  return <div {...props} data-slot="splitter-element" className={cn("fiori-splitter-element", layout?.className, className)}
    style={{ ...style, flex: layout?.basis, [layout?.vertical ? "minHeight" : "minWidth"]: minSize }}>
    {children}
  </div>
}

function SplitterLayout({
  vertical = false, sizes, defaultSizes, onSizesChange, onResize, locale, texts, classNames,
  children, dir, className, ...props
}: SplitterLayoutProps) {
  const { dir: localeDir, hasProvider, localized, t } = useFioriLocale(locale)
  const direction = dir ?? (localized || hasProvider ? localeDir : undefined)
  const keyboardHint = texts?.keyboardHint ?? t("wcr:PRESS_ARROW_KEYS_TO_MOVE", "Press ARROW keys to move") // WCR PRESS_ARROW_KEYS_TO_MOVE
  const [internalSizes, setInternalSizes] = React.useState(defaultSizes)
  const [measured, setMeasured] = React.useState<number[]>([])
  const root = React.useRef<HTMLDivElement>(null)
  const { ref, ...rootProps } = props
  React.useImperativeHandle(ref, () => root.current!, [])
  const extent = vertical ? "height" : "width"
  const panes = React.Children.toArray(children).filter(React.isValidElement<SplitterElementProps>)
  const requestedSizes = sizes ?? internalSizes
  const drag = React.useRef<{ pointer: number; index: number; start: number; sign: number; before: number; after: number } | null>(null)

  React.useLayoutEffect(() => {
    const layout = root.current
    if (!layout) return
    const measure = () => {
      const next = Array.from(layout.children).filter(child => child.getAttribute("data-slot") === "splitter-element")
        .map(child => child.getBoundingClientRect()[extent])
      setMeasured(old => old.length === next.length && old.every((size, i) => size === next[i]) ? old : next)
    }
    const observer = new ResizeObserver(measure)
    for (const child of layout.children) observer.observe(child)
    measure()
    return () => observer.disconnect()
  }, [extent, panes.length])

  function resize(separator: HTMLElement, index: number, before: number, after: number, delta: number) {
    const first = separator.previousElementSibling as HTMLElement
    const second = separator.nextElementSibling as HTMLElement
    const total = before + after
    const min = panes[index].props.minSize ?? 0
    const max = Math.max(min, total - (panes[index + 1].props.minSize ?? 0))
    const next = Math.min(max, Math.max(min, before + delta))
    if (next === first.getBoundingClientRect()[extent]) return
    const updated = Array.from({ length: panes.length }, (_, i) => requestedSizes?.[i])
    updated[index] = next
    updated[index + 1] = total - next
    if (sizes === undefined) setInternalSizes(updated)
    onSizesChange?.(updated)
    const barSize = separator.getBoundingClientRect()[extent]
    onResize?.({ areas: [
      { size: next + barSize, area: first },
      { size: total - next + (second.nextElementSibling?.getAttribute("role") === "separator" ? barSize : 0), area: second },
    ], splitter: separator })
  }

  function axisSign(separator: HTMLElement) {
    return !vertical && getComputedStyle(separator).direction === "rtl" ? -1 : 1
  }

  return <div {...rootProps} ref={root} dir={direction} data-slot="splitter-layout" data-orientation={vertical ? "vertical" : "horizontal"}
    className={cn("fiori-splitter-layout", classNames?.root, className)}>
    {panes.map((pane, index) => {
      const showSeparator = index < panes.length - 1 && pane.props.resizable !== false && panes[index + 1].props.resizable !== false
      const initial = pane.props.size ?? "auto"
      const cssSize = typeof initial === "number" ? initial + "px" : initial
      const fixed = requestedSizes?.[index]
      // WCR useConcatSplitterElements subtracts the following bar from an explicitly sized pane.
      const basis = fixed !== undefined ? `0 0 ${fixed}px` : initial === "auto" ? "1 1 0px" :
        `0 1 ${showSeparator ? `calc(${cssSize} - var(--fiori-wcr-x-splittersize))` : cssSize}`
      const gripIcon = vertical ? horizontalGrip : verticalGrip
      const min = pane.props.minSize ?? 0
      const max = Math.max(min, (measured[index] ?? 0) + (measured[index + 1] ?? 0) - (panes[index + 1]?.props.minSize ?? 0))
      // WCR omits a live value. Express position as a percentage of its actual travel.
      const percent = max === min ? 50 : Math.round(1000 * Math.max(0, (measured[index] ?? min) - min) / (max - min)) / 10
      return <React.Fragment key={pane.key}>
        <PaneContext.Provider value={{ vertical, basis, className: classNames?.pane }}>{pane}</PaneContext.Provider>
        {showSeparator && <div role="separator" tabIndex={0} data-slot="splitter-separator"
          className={cn("fiori-splitter-separator", classNames?.separator)} title={keyboardHint} aria-label={keyboardHint}
          aria-orientation={vertical ? "vertical" : "horizontal"}
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, percent)}
          onKeyDown={event => {
            if (event.target !== event.currentTarget) return
            const { key, currentTarget: separator } = event
            // WCR Splitter.onHandleKeyDown accepts all arrows and uses a 20 px step.
            const step = event.shiftKey ? 1 : 20
            const sign = axisSign(separator)
            const deltas: Record<string, number> = {
              ArrowLeft: -step * sign, ArrowUp: -step * sign, ArrowRight: step * sign, ArrowDown: step * sign,
              Home: -Infinity, End: Infinity,
            }
            if (!Object.hasOwn(deltas, key)) return
            event.preventDefault()
            resize(separator, index, separator.previousElementSibling!.getBoundingClientRect()[extent],
              separator.nextElementSibling!.getBoundingClientRect()[extent], deltas[key])
          }}
          onPointerDown={event => {
            if (event.button !== 0) return
            const separator = event.currentTarget
            separator.focus()
            separator.setPointerCapture(event.pointerId)
            drag.current = { pointer: event.pointerId, index, start: vertical ? event.clientY : event.clientX,
              sign: axisSign(separator), before: separator.previousElementSibling!.getBoundingClientRect()[extent],
              after: separator.nextElementSibling!.getBoundingClientRect()[extent] }
          }}
          onPointerMove={event => {
            const active = drag.current
            if (active?.pointer !== event.pointerId || active.index !== index) return
            const position = vertical ? event.clientY : event.clientX
            resize(event.currentTarget, index, active.before, active.after, (position - active.start) * active.sign)
          }}
          onLostPointerCapture={event => {
            if (drag.current?.pointer === event.pointerId) drag.current = null
          }}>
          <span data-slot="splitter-line" data-side="before" className={classNames?.line} />
          <span data-slot="splitter-grip" className={classNames?.grip} aria-hidden="true">
            <Icon icon={gripIcon} />
          </span>
          <span data-slot="splitter-line" data-side="after" className={classNames?.line} />
        </div>}
      </React.Fragment>
    })}
  </div>
}

export { SplitterLayout, SplitterElement, type SplitterLayoutProps, type SplitterElementProps, type SplitterLayoutSlot, type SplitterLayoutTexts }
