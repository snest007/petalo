// Portions derived from SAP's open-source UI5 Web Components for React 2.28.2,
// © SAP SE or an SAP affiliate company and UI5 contributors. SPDX-License-Identifier: Apache-2.0
"use client"

import * as React from "react"
import { Icon } from "@/components/ui/icon"
import { down, up } from "@/lib/fiori-icons"
import { FioriLocaleProvider, useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"
import { cn } from "@/lib/utils"

declare const process: { env: { NODE_ENV?: string } }

type IndicatorState = "none" | "neutral" | "positive" | "critical" | "negative"
type IndicatorTrend = "none" | "up" | "down"

const defaults = {
  header: "Card Header", // WCR ARIA_DESC_CARD_HEADER
  up: "Ascending", // WCR NUMERICCONTENT_DEVIATION_UP
  down: "Descending", // WCR NUMERICCONTENT_DEVIATION_DOWN
  neutral: "Neutral", // WCR SEMANTIC_COLOR_NEUTRAL
  positive: "Good", // WCR SEMANTIC_COLOR_GOOD
  critical: "Warning", // WCR SEMANTIC_COLOR_CRITICAL
  negative: "Critical", // WCR SEMANTIC_COLOR_ERROR
}
type AnalyticalCardHeaderTexts = typeof defaults
const textKeys = {
  header: "wcr:ARIA_DESC_CARD_HEADER",
  up: "wcr:NUMERICCONTENT_DEVIATION_UP",
  down: "wcr:NUMERICCONTENT_DEVIATION_DOWN",
  neutral: "wcr:SEMANTIC_COLOR_NEUTRAL",
  positive: "wcr:SEMANTIC_COLOR_GOOD",
  critical: "wcr:SEMANTIC_COLOR_CRITICAL",
  negative: "wcr:SEMANTIC_COLOR_ERROR",
} as const

/** @experimental Stable styling slots for the KPI header and its visible parts. */
type AnalyticalCardHeaderSlot = "root" | "titles" | "titleRow" | "title" | "status" | "subtitleRow" | "subtitle" |
  "measurement" | "indicators" | "mainIndicator" | "value" | "trendScale" | "trend" | "scale" | "sideIndicators" | "description"
/** @experimental Stable styling slots for a side indicator. */
type NumericSideIndicatorSlot = "root" | "title" | "value"

type IndicatorProps = Omit<React.ComponentProps<"div">, "role" | "tabIndex" | "aria-label" | "aria-labelledby" | "aria-roledescription"> & {
  state?: IndicatorState
  locale?: string
  /** Formats numeric inputs. String inputs are already formatted. */
  numberFormat?: Intl.NumberFormatOptions
}
type AnalyticalCardHeaderProps = IndicatorProps & {
  titleText?: string
  titleTextLevel?: React.AriaAttributes["aria-level"]
  subtitleText?: string
  value?: number | string
  scale?: string
  unitOfMeasurement?: string
  status?: string
  description?: string
  trend?: IndicatorTrend
  /** Overrides the named group's role description and the KPI trend/state phrases. */
  texts?: Partial<AnalyticalCardHeaderTexts>
  /** @experimental Styles the owning parts without replacing their semantics. */
  classNames?: Partial<Record<AnalyticalCardHeaderSlot, string>>
}
type NumericSideIndicatorProps = Omit<IndicatorProps, "children"> & {
  titleText: string
  number: number | string
  unit?: string
  /** @experimental Styles the owning parts without replacing their semantics. */
  classNames?: Partial<Record<NumericSideIndicatorSlot, string>>
}

const ownedProps = ["role", "tabIndex", "aria-label", "aria-labelledby", "aria-roledescription", "aria-hidden",
  "aria-selected", "aria-expanded", "data-slot", "data-state", "data-trend", "data-interactive", "data-sap-ui-fastnavgroup", "slot", "dangerouslySetInnerHTML", "asChild"]
function ownedAttributes(props: React.ComponentProps<"div">, component: string) {
  const result = { ...props } as Record<string, unknown>
  for (const key of ownedProps) {
    if (result[key] === undefined) continue
    if (process.env.NODE_ENV !== "production") console.warn(`${component}: ignored owned prop "${key}".`)
    delete result[key]
  }
  return result as React.ComponentProps<"div">
}

function displayNumber(value: number | string | undefined, locale: string, options: Intl.NumberFormatOptions | undefined) {
  return typeof value === "number" ? new Intl.NumberFormat(locale, options).format(value) : value
}

function sideItems(children: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(children).flatMap(child =>
    React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === React.Fragment
      ? sideItems(child.props.children)
      : [child],
  )
}

/** @accessibility The named group includes the title, subtitle, measurement, KPI, side indicators and description in reading order. */
function AnalyticalCardHeader({
  titleText, titleTextLevel = 3, subtitleText, value, scale, unitOfMeasurement, status, description,
  trend = "none", state = "none", children, locale: localeProp, numberFormat, texts: overrides, classNames,
  className, id: idProp, dir, onClick, onKeyDown, onKeyUp, ref, ...props
}: AnalyticalCardHeaderProps) {
  const automaticId = React.useId()
  const id = idProp ?? automaticId
  const { locale, dir: localeDir, localized, hasProvider } = useFioriLocale(localeProp)
  const texts = useFioriTexts(defaults, textKeys, overrides, localeProp)
  const direction = dir ?? (localized || hasProvider ? localeDir : undefined)
  const displayed = displayNumber(value, locale, numberFormat)

  // WCR AnalyticalCardHeader/index.js publishes the KPI as one image name and
  // tooltip. The value and scale are read together before trend and state.
  const label = [
    `${displayed ?? ""}${scale ?? ""}`,
    trend !== "none" ? texts[trend] : undefined,
    state !== "none" ? texts[state] : undefined,
  ].filter(Boolean).join("\n")
  const indicators = sideItems(children).map((child, index) => {
    const element = React.isValidElement<{ id?: string; locale?: string }>(child) ? child : undefined
    const indicatorId = `${id}-indicator${index}`
    if (element && (element.type === NumericSideIndicator || typeof element.type === "string")) {
      return [element.props.id ?? indicatorId, React.cloneElement(element, { id: element.props.id ?? indicatorId })] as const
    }
    // A consumer component need not forward an ID. Own its IDREF target while
    // keeping the caller's interactive descendants outside the KPI image.
    return [indicatorId, <div id={indicatorId}>{child}</div>] as const
  })
  const indicatorContent = indicators.map(([indicatorId, child]) => <React.Fragment key={indicatorId}>{child}</React.Fragment>)
  const labelledBy = [
    titleText && `${id}-title`, subtitleText && `${id}-subtitle`, unitOfMeasurement && `${id}-unitOfMeasurement`,
    label && `${id}-mainIndicator`, ...indicators.map(([indicatorId]) => indicatorId), description && `${id}-description`,
  ].filter(Boolean).join(" ")

  // WCR keeps a focusable group even without onClick. Activate the focused
  // header by keyboard and leave nested buttons and links to their own handlers.
  const keyActivation = (event: React.KeyboardEvent<HTMLDivElement>) =>
    !!onClick && event.target === event.currentTarget && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey

  return <div {...ownedAttributes(props, "AnalyticalCardHeader")} ref={ref} id={id} dir={direction} slot="header"
    data-slot="analytical-card-header" data-state={state} data-trend={trend} data-interactive={onClick ? "" : undefined}
    data-sap-ui-fastnavgroup="true" role="group" tabIndex={0} aria-roledescription={texts.header} aria-labelledby={labelledBy || undefined}
    className={cn("fiori-analytical-card-header", classNames?.root, className)}
    onClick={(event) => {
      const childControl = (event.target as Element).closest("a[href], button, input, select, textarea, [role=button], [role=link], [contenteditable=true]")
      if (!childControl || !event.currentTarget.contains(childControl)) onClick?.(event)
    }}
    onKeyDown={(event) => {
      if (keyActivation(event)) {
        if (event.key === " ") event.preventDefault()
        if (event.key === "Enter" && !event.repeat) event.currentTarget.click()
      }
      onKeyDown?.(event)
    }}
    onKeyUp={(event) => {
      if (keyActivation(event) && event.key === " ") event.currentTarget.click()
      onKeyUp?.(event)
    }}>
    <div>
      <div data-slot="analytical-card-header-titles" className={cn("fiori-analytical-card-header__titles", classNames?.titles)}>
        <div data-slot="analytical-card-header-title-row" className={cn("fiori-analytical-card-header__title-row", classNames?.titleRow)}>
          {titleText && <span id={`${id}-title`} role="heading" aria-level={titleTextLevel} data-slot="analytical-card-header-title"
            className={cn("fiori-analytical-card-header__title", classNames?.title)}>{titleText}</span>}
          {status && <span data-slot="analytical-card-header-status" className={cn("fiori-analytical-card-header__status", classNames?.status)}>{status}</span>}
        </div>
        {(subtitleText || unitOfMeasurement) && <div data-slot="analytical-card-header-subtitle-row" className={cn("fiori-analytical-card-header__subtitle-row", classNames?.subtitleRow)}>
          <span id={`${id}-subtitle`} data-slot="analytical-card-header-subtitle" className={classNames?.subtitle}>{subtitleText}</span>
          {unitOfMeasurement && <span id={`${id}-unitOfMeasurement`} data-slot="analytical-card-header-measurement"
            className={cn("fiori-analytical-card-header__measurement", classNames?.measurement)}>{unitOfMeasurement}</span>}
        </div>}
      </div>
      <div data-slot="analytical-card-header-indicators" className={cn("fiori-analytical-card-header__indicators", classNames?.indicators)}>
        <div id={`${id}-mainIndicator`} role={label ? "img" : undefined} aria-hidden={label ? undefined : true} aria-label={label || undefined} title={label || undefined}
          data-slot="analytical-card-header-main-indicator" className={cn("fiori-analytical-card-header__main-indicator", classNames?.mainIndicator)}>
          <span data-slot="analytical-card-header-value" className={cn("fiori-analytical-card-header__value", classNames?.value)}>{displayed}</span>
          <div data-slot="analytical-card-header-trend-scale" className={cn("fiori-analytical-card-header__trend-scale", classNames?.trendScale)}>
            {trend !== "none" && <Icon icon={trend === "up" ? up : down} data-slot="analytical-card-header-trend"
              className={cn("fiori-analytical-card-header__trend", classNames?.trend)} />}
            <div data-slot="analytical-card-header-scale" className={cn("fiori-analytical-card-header__scale", classNames?.scale)}>{scale}</div>
          </div>
        </div>
        <div className="fiori-analytical-card-header__gap" />
        <div data-slot="analytical-card-header-side-indicators" className={cn("fiori-analytical-card-header__side-indicators", classNames?.sideIndicators)}>
          {localeProp || direction === "ltr" || direction === "rtl"
            ? <FioriLocaleProvider locale={localeProp} dir={direction === "rtl" || direction === "ltr" ? direction : undefined}>
              {indicatorContent}
            </FioriLocaleProvider>
            : indicatorContent}
        </div>
      </div>
      {description && <span id={`${id}-description`} data-slot="analytical-card-header-description"
        className={cn("fiori-analytical-card-header__description", classNames?.description)}>{description}</span>}
    </div>
  </div>
}

/** @accessibility The indicator's title and formatted value remain visible text and can label the enclosing KPI header. */
function NumericSideIndicator({ titleText, number, unit, state = "none", className, classNames, ref, dir, locale: localeProp, numberFormat, ...props }: NumericSideIndicatorProps) {
  const { locale, localized, hasProvider, dir: localeDir } = useFioriLocale(localeProp)
  return <div {...ownedAttributes(props, "NumericSideIndicator")} ref={ref} dir={dir ?? (localized || hasProvider ? localeDir : undefined)}
    data-slot="numeric-side-indicator" data-state={state} className={cn("fiori-numeric-side-indicator", classNames?.root, className)}>
    <span data-slot="numeric-side-indicator-title" className={cn("fiori-numeric-side-indicator__title", classNames?.title)}>{titleText}</span>
    <span data-slot="numeric-side-indicator-value" className={cn("fiori-numeric-side-indicator__value", classNames?.value)}>
      {displayNumber(number, locale, numberFormat)}{unit}
    </span>
  </div>
}

export { AnalyticalCardHeader, NumericSideIndicator, type AnalyticalCardHeaderProps, type NumericSideIndicatorProps,
  type AnalyticalCardHeaderTexts, type AnalyticalCardHeaderSlot, type NumericSideIndicatorSlot, type IndicatorState, type IndicatorTrend }
