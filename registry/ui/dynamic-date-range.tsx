"use client"

// Derived from UI5 Web Components 2.28.1 DynamicDateRange and its option templates,
// © SAP SE or an SAP affiliate company and contributors. SPDX-License-Identifier: Apache-2.0.
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { DateTimePicker, DateTimeSelection } from "@/components/ui/date-time-picker"
import { Icon } from "@/components/ui/icon"
import { Input, InputIcon } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { List, ListItemStandard } from "@/components/ui/list"
import { ResponsivePopover, ResponsivePopoverAnchor, ResponsivePopoverContent } from "@/components/ui/responsive-popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StepInput } from "@/components/ui/step-input"
import { Title } from "@/components/ui/title"
import { addDays, formatDate, parseDate, resolvePattern, startOfDay } from "@/lib/fiori-dates"
import { appointment2, slimArrowLeft } from "@/lib/fiori-icons"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"
import { formatNumber, parseNumber } from "@/lib/fiori-numbers"
import { useIsPhone } from "@/lib/use-is-phone"
import { cn } from "@/lib/utils"

type DynamicDateRangeValue = { operator: string; values?: readonly (Date | number)[] }
type DynamicDateRangeSlot = "root" | "field" | "trigger" | "popover" | "list" | "option" | "header" | "back" | "editor" | "preview" | "footer" | "submit" | "close"
type DynamicDateRangeOptionContext = { locale: string; now: Date; texts: DynamicDateRangeTexts }
type DynamicDateRangeOption = {
  label: string | ((context: DynamicDateRangeOptionContext) => string)
  format: (value: DynamicDateRangeValue, context: DynamicDateRangeOptionContext) => string
  parse: (text: string, context: DynamicDateRangeOptionContext) => readonly (Date | number)[] | undefined
  toDates: (value: DynamicDateRangeValue, context: DynamicDateRangeOptionContext) => readonly Date[]
  /** A content-only editor. The picker continues to own navigation, preview and submission. */
  renderEditor?: (context: DynamicDateRangeOptionContext & {
    value: DynamicDateRangeValue; onValueChange: (values: readonly (Date | number)[]) => void
  }) => React.ReactNode
}

const defaultTexts = {
  today: "Today", yesterday: "Yesterday", tomorrow: "Tomorrow",
  date: "Date", dateRange: "From / To", dateTimeRange: "From / To (Date and Time)",
  fromDateTime: "From (Date Time)", toDateTime: "To (Date Time)",
  fromPrefix: "From", toPrefix: "To", fromLabel: "From", toLabel: "To",
  selected: "Selected", emptySelection: "Choose Dates", popoverName: "Dynamic Date Range", back: "Navigate Back",
  // UI5 DynamicDateRangePopoverTemplate.js hard-codes Submit and Close.
  submit: "Submit", close: "Close",
  active: "Is Active", // UI5 LIST_ITEM_ACTIVE
  phoneContent: "Content", // UI5 DIALOG_CONTENT_ARIA_LABEL
  phoneFooter: "Footer", // UI5 DIALOG_FOOTER_ARIA_LABEL
  iconRole: "Interactive Icon", // UI5 ICON_ARIA_TYPE_INTERACTIVE
  dateView: "Date", timeView: "Time", amount: "Value for X", unit: "Unit of Time",
  included: "(Included)",
  lastCombined: (units: string) => `Last X ${units} (Included)`,
  nextCombined: (units: string) => `Next X ${units} (Included)`,
  units: { days: "Days", weeks: "Weeks", months: "Months", quarters: "Quarters", years: "Years" },
  last: { days: "Last X Days", weeks: "Last X Weeks", months: "Last X Months", quarters: "Last X Quarters", years: "Last X Years" },
  next: { days: "Next X Days", weeks: "Next X Weeks", months: "Next X Months", quarters: "Next X Quarters", years: "Next X Years" },
}

const textKeys = {
  today: "DYNAMIC_DATE_RANGE_TODAY_TEXT", yesterday: "DYNAMIC_DATE_RANGE_YESTERDAY_TEXT", tomorrow: "DYNAMIC_DATE_RANGE_TOMORROW_TEXT",
  date: "DYNAMIC_DATE_RANGE_DATE_TEXT", dateRange: "DYNAMIC_DATE_RANGE_DATERANGE_TEXT", dateTimeRange: "DYNAMIC_DATE_TIME_RANGE_TEXT",
  fromDateTime: "DYNAMIC_DATE_RANGE_FROM_TEXT", toDateTime: "DYNAMIC_DATE_RANGE_TO_TEXT",
  fromPrefix: "DYNAMIC_DATE_RANGE_FROM_INPUT_TEXT", toPrefix: "DYNAMIC_DATE_RANGE_TO_INPUT_TEXT",
  fromLabel: "DYNAMIC_DATE_TIME_RANGE_TEXT_FROM_LABEL", toLabel: "DYNAMIC_DATE_TIME_RANGE_TEXT_TO_LABEL",
  selected: "DYNAMIC_DATE_RANGE_SELECTED_TEXT", emptySelection: "DYNAMIC_DATE_RANGE_EMPTY_SELECTED_TEXT",
  popoverName: "DYNAMIC_DATE_RANGE_POPOVER_ACCESSIBLE_NAME", back: "DYNAMIC_DATE_RANGE_NAVIGATION_ICON_TOOLTIP",
  active: "LIST_ITEM_ACTIVE", phoneContent: "DIALOG_CONTENT_ARIA_LABEL", phoneFooter: "DIALOG_FOOTER_ARIA_LABEL",
  iconRole: "ICON_ARIA_TYPE_INTERACTIVE",
  dateView: "DATETIME_PICKER_DATE_BUTTON", timeView: "DATETIME_PICKER_TIME_BUTTON",
  amount: "DYNAMIC_DATE_RANGE_VALUE_LABEL_TEXT", unit: "DYNAMIC_DATE_RANGE_UNIT_OF_TIME_LABEL_TEXT",
  included: "DYNAMIC_DATE_RANGE_INCLUDED_TEXT", lastCombined: "DYNAMIC_DATE_RANGE_LAST_COMBINED_TEXT", nextCombined: "DYNAMIC_DATE_RANGE_NEXT_COMBINED_TEXT",
  units: { days: "DYNAMIC_DATE_RANGE_DAYS_UNIT_TEXT", weeks: "DYNAMIC_DATE_RANGE_WEEKS_UNIT_TEXT", months: "DYNAMIC_DATE_RANGE_MONTHS_UNIT_TEXT", quarters: "DYNAMIC_DATE_RANGE_QUARTERS_UNIT_TEXT", years: "DYNAMIC_DATE_RANGE_YEARS_UNIT_TEXT" },
  last: { days: "DYNAMIC_DATE_RANGE_LAST_DAYS_TEXT", weeks: "DYNAMIC_DATE_RANGE_LAST_WEEKS_TEXT", months: "DYNAMIC_DATE_RANGE_LAST_MONTHS_TEXT", quarters: "DYNAMIC_DATE_RANGE_LAST_QUARTERS_TEXT", years: "DYNAMIC_DATE_RANGE_LAST_YEARS_TEXT" },
  next: { days: "DYNAMIC_DATE_RANGE_NEXT_DAYS_TEXT", weeks: "DYNAMIC_DATE_RANGE_NEXT_WEEKS_TEXT", months: "DYNAMIC_DATE_RANGE_NEXT_MONTHS_TEXT", quarters: "DYNAMIC_DATE_RANGE_NEXT_QUARTERS_TEXT", years: "DYNAMIC_DATE_RANGE_NEXT_YEARS_TEXT" },
}
type DynamicDateRangeTexts = typeof defaultTexts
type DynamicDateRangeTextOverrides = Partial<Omit<DynamicDateRangeTexts, "units" | "last" | "next">> & {
  [Part in "units" | "last" | "next"]?: Partial<DynamicDateRangeTexts[Part]>
}
type DynamicDateRangeProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "size" | "children"> & {
  options?: readonly string[] | string
  /** Per-instance registrations take priority over static registrations. */
  customOptions?: Readonly<Record<string, DynamicDateRangeOption>>
  value?: DynamicDateRangeValue | null
  defaultValue?: DynamicDateRangeValue
  onValueChange?: (value: DynamicDateRangeValue | null) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  portal?: boolean
  locale?: string
  texts?: DynamicDateRangeTextOverrides
  /** Experimental slots. Native input props, including ARIA names, reach the textbox. */
  classNames?: Partial<Record<DynamicDateRangeSlot, string>>
}

const relativeUnits = ["days", "weeks", "months", "quarters", "years"] as const
type RelativeUnit = typeof relativeUnits[number]
type RelativeDirection = "last" | "next"
const relativeOperators = new Map(["last", "next"].flatMap(direction =>
  relativeUnits.map(unit => [`${direction}${unit}`.toUpperCase(), { direction: direction as RelativeDirection, unit }] as const)))
const presets = { TODAY: "today", YESTERDAY: "yesterday", TOMORROW: "tomorrow" } as const
const absolute = { DATE: "date", DATERANGE: "dateRange", DATETIMERANGE: "dateTimeRange", FROMDATETIME: "fromDateTime", TODATETIME: "toDateTime" } as const
const standardOperators = [...Object.keys(presets), ...Object.keys(absolute), ...relativeOperators.keys()]
const registeredOptions = new Map<string, DynamicDateRangeOption>()
const emptyOptions: NonNullable<DynamicDateRangeProps["customOptions"]> = {}
const dateValues = (value: DynamicDateRangeValue) => (value.values ?? []).filter((arg): arg is Date => arg instanceof Date && Number.isFinite(arg.getTime()))
const amountValue = (value: DynamicDateRangeValue) => typeof value.values?.[0] === "number" ? value.values[0] : 1
const endOfDay = (date: Date) => new Date(addDays(startOfDay(date), 1).getTime() - 1)

function relativeDates(now: Date, count: number, direction: RelativeDirection, unit: RelativeUnit): readonly Date[] {
  // UI5 toDates.js lastToDates/nextToDates include today and use Monday–Sunday for relative weeks.
  const offset = count - 1
  const mondayOffset = (now.getDay() + 6) % 7
  const year = now.getFullYear()
  const month = now.getMonth()
  const quarter = month - month % 3
  const last = direction === "last"
  const boundary = {
    days: () => addDays(now, last ? -offset : offset),
    weeks: () => addDays(now, last ? -mondayOffset - offset * 7 : 6 - mondayOffset + offset * 7),
    months: () => last ? new Date(year, month - offset, 1) : new Date(year, month + count, 0),
    quarters: () => last ? new Date(year, quarter - offset * 3, 1) : new Date(year, quarter + count * 3, 0),
    years: () => last ? new Date(year - offset, 0, 1) : new Date(year + offset, 11, 31),
  }[unit]()
  return last ? [startOfDay(boundary), endOfDay(now)] : [startOfDay(now), endOfDay(boundary)]
}

function resolveDates(value: DynamicDateRangeValue, context: DynamicDateRangeOptionContext, option?: DynamicDateRangeOption): readonly Date[] {
  if (option) return option.toDates(value, context)
  const { operator } = value
  const relative = relativeOperators.get(operator)
  if (relative) return relativeDates(context.now, amountValue(value), relative.direction, relative.unit)
  if (Object.hasOwn(presets, operator)) {
    const date = addDays(context.now, operator === "YESTERDAY" ? -1 : operator === "TOMORROW" ? 1 : 0)
    return [startOfDay(date), endOfDay(date)]
  }
  const dates = dateValues(value)
  if (operator === "DATE" && dates.length === 1) return [startOfDay(dates[0]), endOfDay(dates[0])]
  if (operator === "DATERANGE" && dates.length === 2) return [startOfDay(dates[0]), endOfDay(dates[1])]
  if ((operator === "FROMDATETIME" || operator === "TODATETIME") && dates.length === 1) {
    const start = new Date(dates[0]), end = new Date(dates[0])
    start.setMilliseconds(0)
    end.setMilliseconds(999)
    return [start, end]
  }
  return operator === "DATETIMERANGE" && dates.length === 2 ? dates : []
}

const interval = " - " // UI5 DateRange.js and DateTimeRange.js use this delimiter.
function formatValue(value: DynamicDateRangeValue, context: DynamicDateRangeOptionContext, option?: DynamicDateRangeOption) {
  if (option) return option.format(value, context)
  const { locale, texts } = context
  const { operator } = value
  const preset = presets[operator as keyof typeof presets]
  if (Object.hasOwn(presets, operator)) return texts[preset]
  const relative = relativeOperators.get(operator)
  if (relative) return texts[relative.direction][relative.unit].replace("X", formatNumber(amountValue(value), locale, { useGrouping: false }))
  const dates = dateValues(value)
  const kind = operator === "DATE" || operator === "DATERANGE" ? "date" : "datetime"
  const format = (date: Date) => formatDate(date, resolvePattern("medium", locale, kind), locale)
  if ((operator === "DATERANGE" || operator === "DATETIMERANGE") && dates.length === 2) return dates.map(format).join(interval)
  if (operator === "DATE" && dates.length === 1) return format(dates[0])
  if (dates.length !== 1) return ""
  if (operator === "FROMDATETIME") return `${texts.fromPrefix} ${format(dates[0])}`
  if (operator === "TODATETIME") return `${texts.toPrefix} ${format(dates[0])}`
  return ""
}

function parseValue(operator: string, raw: string, context: DynamicDateRangeOptionContext, option?: DynamicDateRangeOption): DynamicDateRangeValue | undefined {
  if (option) {
    const values = option.parse(raw, context)
    return values === undefined ? undefined : { operator, values }
  }
  const { locale, texts } = context
  if (Object.hasOwn(presets, operator)) return raw === texts[presets[operator as keyof typeof presets]] ? { operator } : undefined
  const relative = relativeOperators.get(operator)
  if (relative) {
    const [before, after = ""] = texts[relative.direction][relative.unit].split("X", 2)
    const prefix = before.toLocaleLowerCase(locale)
    const suffix = after.toLocaleLowerCase(locale)
    const text = raw.toLocaleLowerCase(locale)
    if (!text.startsWith(prefix) || !text.endsWith(suffix)) return
    const count = parseNumber(text.slice(prefix.length, text.length - suffix.length).trim(), locale)
    return Number.isInteger(count) && count >= 1 && count <= 9999 ? { operator, values: [count] } : undefined
  }
  const range = operator === "DATERANGE" || operator === "DATETIMERANGE"
  const kind = operator === "DATE" || operator === "DATERANGE" ? "date" : "datetime"
  const prefix = operator === "FROMDATETIME" ? texts.fromPrefix : operator === "TODATETIME" ? texts.toPrefix : ""
  if (prefix && !raw.startsWith(prefix + " ")) return
  const parts = range ? raw.split(interval) : [raw.slice(prefix.length).trim()]
  if (parts.length !== (range ? 2 : 1)) return
  const values = parts.map(part => parseDate(part, resolvePattern("medium", locale, kind), locale, kind))
  if (values.every((date): date is Date => date !== null)) return { operator, values: values.sort((a, b) => +a - +b) }
}

function DynamicDateRangeField({
  options = standardOperators, customOptions = emptyOptions, value, defaultValue, onValueChange, open, defaultOpen = false, onOpenChange,
  locale: localeProp, dir, texts: overrides, className, classNames, portal = true, ref, onKeyDown, onBlur, disabled, readOnly, ...props
}: DynamicDateRangeProps) {
  const { locale, dir: localeDir, localized, hasProvider } = useFioriLocale(localeProp)
  const texts = useFioriTexts(defaultTexts, textKeys, overrides as Partial<DynamicDateRangeTexts>, localeProp)
  const phone = useIsPhone()
  const [internalValue, setValue] = React.useState<DynamicDateRangeValue | null>(defaultValue ?? null)
  const [internalOpen, setOpen] = React.useState(defaultOpen)
  const [raw, setRaw] = React.useState<string>()
  const [draft, setDraft] = React.useState<DynamicDateRangeValue>()
  const [activeOperator, setActiveOperator] = React.useState<string>()
  const [dateTimeView, setDateTimeView] = React.useState("date")
  const input = React.useRef<HTMLInputElement>(null)
  const popup = React.useRef<HTMLDivElement>(null)
  const returnTo = React.useRef<string | undefined>(undefined)
  const [editorDates, setEditorDates] = React.useState<[Date | null, Date | null]>([null, null])
  React.useImperativeHandle(ref, () => input.current!, [])
  const current = value === undefined ? internalValue : value
  const expanded = !disabled && !readOnly && (open ?? internalOpen)
  const context = { locale, now: new Date(), texts }
  const lookup = (operator: string) => customOptions[operator] ?? registeredOptions.get(operator)
  const operators = [...new Set((typeof options === "string" ? options.split(",") : options)
    .map(operator => operator.trim().toUpperCase()).filter(operator => standardOperators.includes(operator) || lookup(operator)))]
  const groups = operators.filter(operator => relativeOperators.has(operator))
  const listRows = operators.filter((operator, index) => {
    const group = relativeOperators.get(operator)
    return !group || index === operators.findIndex(candidate => relativeOperators.get(candidate)?.direction === group.direction)
  })
  const relative = activeOperator ? relativeOperators.get(activeOperator) : undefined
  const editorOptions = relative ? groups.filter(operator => relativeOperators.get(operator)?.direction === relative.direction) : []
  const effectiveDir = dir ?? (localized || hasProvider ? localeDir : undefined)
  const id = React.useId()

  function rowLabel(operator: string) {
    const custom = lookup(operator)
    if (custom) return typeof custom.label === "function" ? custom.label(context) : custom.label
    if (Object.hasOwn(presets, operator)) return texts[presets[operator as keyof typeof presets]]
    if (Object.hasOwn(absolute, operator)) return texts[absolute[operator as keyof typeof absolute]]
    const group = relativeOperators.get(operator)!
    const units = groups.filter(candidate => relativeOperators.get(candidate)?.direction === group.direction).map(candidate => texts.units[relativeOperators.get(candidate)!.unit])
    return units.length > 1
      ? (group.direction === "last" ? texts.lastCombined : texts.nextCombined)(units.join(" / "))
      : `${texts[group.direction][group.unit]} ${texts.included}`
  }

  function changeOpen(next: boolean) {
    if (open === undefined) setOpen(next)
    onOpenChange?.(next)
  }

  // Discard unsubmitted edits after the popup actually closes. A controlled
  // opener can keep the surface open after an outside interaction.
  React.useEffect(() => {
    if (expanded) return
    setActiveOperator(undefined)
    setDraft(undefined)
    returnTo.current = undefined
  }, [expanded])

  function commit(next: DynamicDateRangeValue | null) {
    setRaw(undefined)
    if (value === undefined) setValue(next)
    onValueChange?.(next)
  }

  function commitInput() {
    if (raw === undefined) return
    const text = raw.trim()
    const parsed = text && operators.map(operator => parseValue(operator, text, context, lookup(operator))).find(Boolean)
    commit(parsed || null)
  }

  function selectOption(operator: string) {
    if (Object.hasOwn(presets, operator) || (lookup(operator) && !lookup(operator)?.renderEditor)) {
      const parsed = parseValue(operator, rowLabel(operator), context, lookup(operator))
      if (parsed) commit(parsed)
      changeOpen(false)
      return
    }
    const group = relativeOperators.get(operator)
    const matching = current && (current.operator === operator ||
      (group && operators.includes(current.operator) && relativeOperators.get(current.operator)?.direction === group.direction))
    const initial = matching ? current : { operator, values: group ? [1] : [] }
    setDraft(initial)
    const dates = dateValues(initial)
    setEditorDates([dates[0] ?? null, dates[1] ?? null])
    setActiveOperator(operator)
    setDateTimeView("date")
    returnTo.current = operator
  }

  function focusList() {
    const list = popup.current
    const rows = Array.from(list?.querySelectorAll<HTMLElement>("[data-ddr-option]") ?? [])
    const target = rows.find(row => row.dataset.ddrOption === returnTo.current) ?? rows.find(row => row.hasAttribute("data-selected")) ?? rows[0]
    target?.focus()
  }

  React.useLayoutEffect(() => {
    if (!expanded || !portal || !returnTo.current) return
    if (activeOperator) popup.current?.querySelector<HTMLElement>('[data-ddr-back]')?.focus()
    else focusList()
  }, [activeOperator, expanded, portal])

  const activeCustom = activeOperator ? lookup(activeOperator) : undefined
  const formatted = current ? formatValue(current, context, lookup(current.operator)) : ""
  const draftText = draft ? formatValue(draft, context, lookup(draft.operator)) : ""
  const selectedDates = draft ? resolveDates(draft, context, lookup(draft.operator)) : []
  const preview = relative && selectedDates.length
    ? selectedDates.map(date => formatDate(date, resolvePattern("medium", locale, "date"), locale)).filter((date, i, dates) => i === 0 || date !== dates[i - 1]).join(interval)
    : draftText
  const header = activeOperator && <header data-slot="dynamic-date-range-header" className={cn("fiori-ddr__header", classNames?.header)}>
    <Button type="button" variant="transparent" aria-label={texts.back} title={texts.back} data-ddr-back=""
      className={classNames?.back} onClick={() => { setActiveOperator(undefined); setDraft(undefined) }}><Icon icon={slimArrowLeft} /></Button>
    <Title>{rowLabel(activeOperator)}</Title>
  </header>
  const footer = activeOperator && <footer role={phone ? "region" : undefined} aria-label={phone ? texts.phoneFooter : undefined} data-slot="dynamic-date-range-footer" className={cn("fiori-ddr__footer", classNames?.footer)}>
    <Button type="button" variant="emphasized" className={classNames?.submit} onClick={() => {
      if (draft && draftText && parseValue(draft.operator, draftText, context, activeCustom)) commit(draft)
      changeOpen(false)
    }}>{texts.submit}</Button>
    <Button type="button" variant="transparent" className={classNames?.close} onClick={() => changeOpen(false)}>{texts.close}</Button>
  </footer>
  function toggleKey(event: React.KeyboardEvent, inside: boolean) {
    if (event.defaultPrevented || event.shiftKey || event.ctrlKey || event.metaKey) return
    const f4 = event.key === "F4" && !event.altKey
    const altArrow = event.altKey && (event.key === "ArrowDown" || event.key === "ArrowUp")
    if (!f4 && !altArrow) return
    // DynamicDateRange.js onInputKeyDown and onKeyDownPopover have separate F4 behavior.
    event.preventDefault()
    if (!expanded || inside || altArrow) changeOpen(!expanded)
  }

  return <ResponsivePopover open={expanded} modal={portal} onOpenChange={changeOpen} dir={effectiveDir === "rtl" ? "rtl" : undefined}>
    <ResponsivePopoverAnchor asChild>
      <div dir={effectiveDir} data-slot="dynamic-date-range" data-open={expanded || undefined} className={cn("fiori-ddr", className, classNames?.root)}>
        <Input {...props} className={classNames?.field} ref={input} value={raw ?? formatted} disabled={disabled} readOnly={readOnly}
          onChange={event => setRaw(event.currentTarget.value)} onBlur={event => { onBlur?.(event); commitInput() }}
          onKeyDown={event => {
            onKeyDown?.(event)
            if (disabled || readOnly || event.defaultPrevented) return
            toggleKey(event, false)
            if (event.key === "Enter") commitInput()
          }}
          wrapperClassName="w-full" icon={<InputIcon data-slot="dynamic-date-range-trigger" data-pressed={expanded || undefined}
            className={classNames?.trigger} tabIndex={-1}
            onMouseDown={event => event.preventDefault()} onClick={() => { if (!disabled && !readOnly) changeOpen(!expanded) }}>
            {/* InputTemplate.js wraps the slotted DynamicDateRangeInputTemplate icon.
                Both hosts use tabindex=-1. F4/Alt+Arrow open the field from the textbox. */}
            <span tabIndex={-1} role={phone ? "button" : undefined} aria-label={phone ? texts.popoverName : undefined}
              aria-roledescription={phone ? texts.iconRole : undefined}><Icon icon={appointment2} /></span>
          </InputIcon>} />
      </div>
    </ResponsivePopoverAnchor>
    <ResponsivePopoverContent portal={portal} aria-modal={true} aria-label={texts.popoverName} aria-labelledby={undefined} side="bottom" align="start" hideArrow
      dir={effectiveDir} ref={popup} className={cn("fiori-ddr__popover", classNames?.popover)} data-in-place={portal ? undefined : ""} phoneField phoneHeader={header || <></>} phoneFooter={footer}
      onInteractOutside={event => { if (!portal) event.preventDefault() }}
      onOpenAutoFocus={event => { event.preventDefault(); if (portal) focusList() }}
      onCloseAutoFocus={event => { event.preventDefault(); if (portal) input.current?.focus() }}
      onKeyDown={event => { if (!(event.target as HTMLElement).closest("[data-slot=calendar]")) toggleKey(event, true) }}>
      {!phone && header}
      <div className="fiori-ddr__view" role={phone ? "region" : undefined} aria-label={phone ? texts.phoneContent : undefined}>
      {activeOperator && draft ? <div data-slot="dynamic-date-range-editor" className={cn("fiori-ddr__editor", classNames?.editor)}>
        {relative ? <div className="fiori-ddr__fields">
          <Label htmlFor={`${id}-amount`}>{texts.amount}</Label>
          <StepInput id={`${id}-amount`} locale={locale} value={amountValue(draft)} min={1} max={editorOptions.length > 1 ? 9999 : 999}
            onValueChange={amount => setDraft({ ...draft, values: [amount] })} />
          {editorOptions.length > 1 && <><Label htmlFor={`${id}-unit`}>{texts.unit}</Label>
            <Select value={draft.operator} onValueChange={operator => setDraft({ ...draft, operator })}>
              <SelectTrigger id={`${id}-unit`}><SelectValue /></SelectTrigger>
              <SelectContent>{editorOptions.map(operator => <SelectItem key={operator} value={operator}>{texts.units[relativeOperators.get(operator)!.unit]}</SelectItem>)}</SelectContent>
            </Select></>}
        </div> : activeCustom?.renderEditor ? activeCustom.renderEditor({
          ...context, value: draft, onValueChange: values => setDraft({ ...draft, values }),
        }) : activeOperator === "DATETIMERANGE" ? <div className="fiori-ddr__fields">
          {[texts.fromLabel, texts.toLabel].map((label, index) => <React.Fragment key={index}>
            <Label htmlFor={`${id}-date-${index}`}>{label}</Label>
            <DateTimePicker id={`${id}-date-${index}`} locale={locale}
              value={editorDates[index] ? formatDate(editorDates[index], resolvePattern("medium", locale, "datetime"), locale) : ""}
              onValueChange={(_, date) => {
                const next: [Date | null, Date | null] = [...editorDates]
                next[index] = date
                setEditorDates(next)
                setDraft({ operator: activeOperator, values: next.every(Boolean) ? next.filter((day): day is Date => day !== null).sort((a, b) => +a - +b) : [] })
              }} />
          </React.Fragment>)}
        </div> : activeOperator === "FROMDATETIME" || activeOperator === "TODATETIME" ? <DateTimeSelection
          locale={locale} phone phoneView={dateTimeView} onPhoneViewChange={setDateTimeView} dateLabel={texts.dateView} timeLabel={texts.timeView}
          pattern={resolvePattern("medium", locale, "datetime")} day={dateValues(draft)[0] ?? context.now} time={dateValues(draft)[0] ?? context.now}
          onDayChange={day => {
            const time = dateValues(draft)[0] ?? context.now
            day.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds())
            setDraft({ operator: activeOperator, values: [day] })
          }}
          onTimeChange={time => setDraft({ operator: activeOperator, values: [time] })} /> :
          <Calendar locale={locale} selectionMode={activeOperator === "DATERANGE" ? "range" : "single"}
            selectedDates={dateValues(draft)} onSelectedDatesChange={dates => setDraft({ operator: activeOperator, values: dates })} />}
        <div data-slot="dynamic-date-range-preview" className={cn("fiori-ddr__preview", classNames?.preview)}>{preview ? `${texts.selected}: ${preview}` : texts.emptySelection}</div>
      </div> : <List selectionMode="single" separators="none" className={classNames?.list} texts={{ active: texts.active }}
        value={current ? listRows.filter(operator => operator === current.operator || (relativeOperators.has(operator) &&
          relativeOperators.get(operator)?.direction === relativeOperators.get(current.operator)?.direction)) : []}
        onItemClick={selectOption}>
        {listRows.map(operator => <ListItemStandard key={operator} data-ddr-option={operator} value={operator} className={cn("fiori-ddr__option", classNames?.option)}
          icon={Object.hasOwn(absolute, operator) ? appointment2 : undefined} iconEnd
          type={relativeOperators.has(operator) || Object.hasOwn(absolute, operator) || lookup(operator)?.renderEditor ? "navigation" : "active"}>
          {rowLabel(operator)}
        </ListItemStandard>)}
      </List>}
      </div>
      {!phone && footer}
    </ResponsivePopoverContent>
  </ResponsivePopover>
}

const DynamicDateRange = Object.assign(DynamicDateRangeField, {
  /** Experimental. Register a named option without replacing a built-in or an earlier registration. */
  register(operator: string, option: DynamicDateRangeOption) {
    const name = operator.trim().toUpperCase()
    if (name && !standardOperators.includes(name) && !registeredOptions.has(name)) registeredOptions.set(name, option)
  },
  toDates(value: DynamicDateRangeValue, options?: { now?: Date; locale?: string; customOptions?: DynamicDateRangeProps["customOptions"] }) {
    return resolveDates(value, { now: options?.now ?? new Date(), locale: options?.locale ?? "en-US", texts: defaultTexts },
      options?.customOptions?.[value.operator] ?? registeredOptions.get(value.operator))
  },
})

export { DynamicDateRange, type DynamicDateRangeProps, type DynamicDateRangeSlot, type DynamicDateRangeTextOverrides, type DynamicDateRangeOption, type DynamicDateRangeOptionContext, type DynamicDateRangeValue }
