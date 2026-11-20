// Portions derived from SAP UI5 Web Components 2.28 (NumericInput and Input), © SAP SE or an
// SAP affiliate company and UI5 contributors. SPDX-License-Identifier: Apache-2.0

"use client"

import * as React from "react"
import { useFioriLocale, useFioriTexts } from "@/lib/fiori-locale"
import { formatNumber, numberSymbols, parseNumber } from "@/lib/fiori-numbers"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import { useValueStateTexts, valueStateIcons, type InputTexts, type ValueState } from "@/components/ui/input"

// Bundlers inline NODE_ENV; installed browser projects do not require Node types.
declare const process: { env: { NODE_ENV?: string } }

type NumericInputTexts = InputTexts & {
  invalidFormat: (precision: number) => string
  belowMinimum: (minimum: string) => string
  aboveMaximum: (maximum: string) => string
  errorState: string
  warningState: string
  successState: string
  informationState: string
}

const defaults = {
  invalidFormat: (precision: number) => `This format is not supported. Enter a number with ${precision} decimal places.`, // UI5 NUMBERINPUT_PATTERN_MISSMATCH
  belowMinimum: (minimum: string) => `Enter a number higher than the minimum value of  ${minimum}.`, // UI5 NUMBERINPUT_RANGEUNDERFLOW
  aboveMaximum: (maximum: string) => `Enter a number lower than the maximum value of  ${maximum}.`, // UI5 NUMBERINPUT_RANGEOVERFLOW
  errorState: "Value State Error", // UI5 VALUE_STATE_TYPE_ERROR
  warningState: "Value State Warning", // UI5 VALUE_STATE_TYPE_WARNING
  successState: "Value State Success", // UI5 VALUE_STATE_TYPE_SUCCESS
  informationState: "Value State Information", // UI5 VALUE_STATE_TYPE_INFORMATION
}
const keys = {
  invalidFormat: "NUMBERINPUT_PATTERN_MISSMATCH",
  belowMinimum: "NUMBERINPUT_RANGEUNDERFLOW",
  aboveMaximum: "NUMBERINPUT_RANGEOVERFLOW",
  errorState: "VALUE_STATE_TYPE_ERROR",
  warningState: "VALUE_STATE_TYPE_WARNING",
  successState: "VALUE_STATE_TYPE_SUCCESS",
  informationState: "VALUE_STATE_TYPE_INFORMATION",
} as const
const stateKey = { negative: "errorState", critical: "warningState", positive: "successState", information: "informationState" } as const

type NumericInputSlot = "root" | "field" | "input" | "message" | "messageIcon" | "description"
type NativeProps = Pick<React.ComponentProps<"input">, "id" | "dir" | "name" | "form" | "placeholder" | "disabled" | "readOnly" | "required"
  | "aria-label" | "aria-labelledby" | "aria-describedby" | "aria-description" | "onFocus" | "onBlur" | "onKeyDown">

/**
 * Experimental (follows UI5).
 * @accessibility Label the native textbox with htmlFor/id, aria-label or aria-labelledby.
 * aria-describedby and aria-description also reach the textbox. Validation links a localized description.
 * @accessibility Up/Down adjust by one step. Shift+PageUp/PageDown and Ctrl+Shift+Up/Down
 * go to a bound. Enter or blur commits. Escape restores the last committed value.
 */
type NumericInputProps = NativeProps & {
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  precision?: number
  locale?: string
  valueState?: ValueState
  defaultValueState?: ValueState
  onValueStateChange?: (state: ValueState, valid: boolean) => void
  /** Overrides the value-state message. Use null to suppress the visible message. */
  valueStateMessage?: string | null
  texts?: Partial<NumericInputTexts>
  className?: string
  /** Experimental slot styling API. */
  classNames?: Partial<Record<NumericInputSlot, string>>
}

function NumericInput({
  value: controlledValue, defaultValue = 0, onValueChange, min, max, step = 1, precision = 0,
  locale: localeProp, valueState, defaultValueState = "none", onValueStateChange, valueStateMessage,
  texts, className, classNames, id, dir, name, form, placeholder, disabled, readOnly, required,
  "aria-label": label, "aria-labelledby": labelledBy, "aria-describedby": describedBy,
  "aria-description": description, onFocus, onBlur, onKeyDown, ...extra
}: NumericInputProps) {
  const { locale, dir: resolvedDir, localized } = useFioriLocale(localeProp)
  const resolved = useFioriTexts(defaults, keys, texts, localeProp)
  const messages = useValueStateTexts(texts)
  const descriptionId = React.useId()
  const fieldRef = React.useRef<HTMLInputElement>(null)
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const [state, setState] = React.useState(defaultValueState)
  const [draft, setDraft] = React.useState<{ text: string; value: number; locale: string; precision: number }>()
  const effectiveState = valueState ?? state
  const value = controlledValue ?? uncontrolled
  const fraction = Number.isFinite(precision) ? Math.max(0, Math.min(100, Math.trunc(precision))) : 0
  const formatted = format(value)
  const currentDraft = draft?.value === value && draft.locale === locale && draft.precision === fraction ? draft : undefined
  const text = currentDraft?.text ?? formatted
  if (draft && !currentDraft) setDraft(undefined)
  const interactive = !disabled && !readOnly
  const hasState = effectiveState !== "none"

  if (process.env.NODE_ENV !== "production" && Object.keys(extra).some((key) =>
    key === "role" || key === "tabIndex" || key.startsWith("aria-"))) {
    console.warn("NumericInput owns its textbox role, tab stop and validation state.")
  }

  function updateDraft(next: string) { setDraft({ text: next, value, locale, precision: fraction }) }

  function format(next: number) {
    return formatNumber(next, locale, { minFractionDigits: fraction, maxFractionDigits: fraction })
  }

  // NumericInput.js/_onInputChange removes locale grouping before parsing.
  function parse(raw: string) {
    return parseNumber(raw.replaceAll(numberSymbols(locale).group, ""), locale)
  }

  function validity(next: number, raw: string) {
    const decimal = numberSymbols(locale).decimal
    const nativeDecimal = new Intl.NumberFormat(locale).formatToParts(1.1).find(part => part.type === "decimal")?.value
    const normalized = nativeDecimal ? raw.replaceAll(nativeDecimal, decimal) : raw
    const enteredFraction = normalized.split(decimal)[1]?.length ?? 0
    if (!Number.isFinite(next) || enteredFraction !== fraction) return resolved.invalidFormat(fraction)
    if (min !== undefined && next < min) return resolved.belowMinimum(format(min))
    if (max !== undefined && next > max) return resolved.aboveMaximum(format(max))
    return ""
  }

  const validationMessage = validity(text.trim() ? parse(text) : min ?? 0, text.trim() ? text : format(min ?? 0))
  React.useLayoutEffect(() => {
    fieldRef.current?.setCustomValidity(validationMessage)
  }, [validationMessage])

  function updateState(valid: boolean) {
    const nextState = valid ? "none" : "negative"
    if (valueState === undefined) setState(nextState)
    onValueStateChange?.(nextState, valid)
  }

  function commit(raw: string) {
    if (!interactive) return
    const candidate = raw.trim() ? parse(raw) : min ?? 0
    const next = Number.isFinite(candidate) ? candidate : min ?? 0
    const nextText = raw.trim() ? raw : format(next)
    const error = validity(candidate, nextText)
    if (next === value && !currentDraft && !error) return
    fieldRef.current?.setCustomValidity(error)
    updateState(!error)
    if (controlledValue === undefined) setUncontrolled(next)
    if (next !== value) onValueChange?.(next)
    // The reference retains invalid precision and preserves the fractional spelling.
    // A controlled value stays authoritative if the parent rejects the committed number.
    setDraft(error || !Number.isInteger(next)
      ? { text: nextText, value: next, locale, precision: fraction }
      : undefined)
  }

  function stepValue(modifier: number, immediately = false) {
    if (min !== undefined && max !== undefined && min > max) return
    const candidate = parse(text)
    const current = Number.isFinite(candidate) ? candidate : value
    const bounded = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, current + modifier))
    const digits = 10 ** fraction
    const next = digits > Number.MAX_SAFE_INTEGER || Math.abs(bounded) * digits > Number.MAX_SAFE_INTEGER
      ? bounded : Math.round(bounded * digits) / digits
    if (!Number.isFinite(next) || next === current) return
    const nextText = format(next)
    if (immediately) commit(nextText)
    else {
      updateState(!validity(next, nextText))
      updateDraft(nextText)
    }
  }

  // Non-passive: UI5's _onMouseWheel consumes scrolling only while the input has focus.
  React.useEffect(() => {
    const field = fieldRef.current!
    function wheel(event: WheelEvent) {
      if (!interactive || !field.matches(":focus") || event.deltaY === 0) return
      event.preventDefault()
      stepValue(event.deltaY < 0 ? step : -step, true)
    }
    field.addEventListener("wheel", wheel, { passive: false })
    return () => field.removeEventListener("wheel", wheel)
  })

  // NumericInput.js/_onkeydown: ordinary arrows step, modified arrows can jump to bounds.
  function handleKey(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event)
    if (event.defaultPrevented || !interactive || event.nativeEvent.isComposing) return
    const { key, ctrlKey, shiftKey, altKey, metaKey } = event
    if (altKey || metaKey) return
    const plain = !ctrlKey && !shiftKey
    if (key === "Enter" && plain) { commit(event.currentTarget.value); return }
    const current = parse(text)
    const base = Number.isFinite(current) ? current : value
    if (key === "Escape" && plain) {
      setDraft(undefined)
      event.currentTarget.setCustomValidity(validity(value, formatted))
    } else if (key === "ArrowUp" && plain) stepValue(step)
    else if (key === "ArrowDown" && plain) stepValue(-step)
    else if (max !== undefined && shiftKey && ((!ctrlKey && key === "PageUp") || (ctrlKey && key === "ArrowUp"))) stepValue(max - base)
    else if (min !== undefined && shiftKey && ((!ctrlKey && key === "PageDown") || (ctrlKey && key === "ArrowDown"))) stepValue(min - base)
    else if (key !== "ArrowUp" && key !== "ArrowDown") {
      if (key.length === 1 && !ctrlKey) {
        const field = event.currentTarget
        const next = field.value.slice(0, field.selectionStart ?? 0) + key + field.value.slice(field.selectionEnd ?? 0)
        if (!Number.isFinite(parse(next)) && !["-", "+", numberSymbols(locale).decimal].includes(next)) event.preventDefault()
      }
      return
    }
    event.preventDefault()
  }

  const message = hasState ? valueStateMessage === undefined ? messages[effectiveState] : valueStateMessage : undefined
  const stateDescription = hasState ? [resolved[stateKey[effectiveState]], message].filter(Boolean).join(" ") : undefined
  const direction = dir ?? (localized ? resolvedDir : undefined)
  return (
    <div data-slot="numeric-input" dir={direction} data-disabled={disabled || undefined} data-readonly={readOnly || undefined}
      className={cn("fiori-step-input-host fiori-numeric-input-host", className, classNames?.root)}>
      {/* The same NumericInput CSS underlies UI5's StepInput. Only StepInput enables its private step buttons. */}
      <div className={cn("fiori-step-input fiori-numeric-input", classNames?.field)}
        data-slot="numeric-input-field" data-disabled={disabled || undefined} data-readonly={readOnly || undefined}
        data-value-state={hasState ? effectiveState : undefined}>
        <div className="fiori-field fiori-step-input__field" data-open="" data-value-state={hasState ? effectiveState : undefined}
          data-disabled={disabled || undefined} data-readonly={readOnly || undefined}>
          <input ref={fieldRef} id={id} data-slot="numeric-input-input" type="text" inputMode="decimal" autoComplete="off"
            form={form} placeholder={placeholder} disabled={disabled} readOnly={readOnly} required={required}
            aria-required={required ?? false} aria-invalid={effectiveState === "negative" || undefined}
            aria-label={label} aria-labelledby={labelledBy} aria-description={description}
            aria-describedby={[stateDescription && descriptionId, describedBy].filter(Boolean).join(" ") || undefined}
            className={cn("fiori-field__input", classNames?.input)} value={text}
            onChange={(event) => updateDraft(event.target.value)} onFocus={onFocus}
            onBlur={(event) => { commit(event.currentTarget.value); onBlur?.(event) }}
            onKeyDown={handleKey}
          />
          {/* InputTemplate.js/valueStateDesc links the state and its message even
              when the visible popup is closed. */}
          {stateDescription && <span id={descriptionId} data-slot="numeric-input-description" className={cn("fiori-numeric-input__description", classNames?.description)}>{stateDescription}</span>}
        </div>
      </div>
      {name && <input type="hidden" name={name} form={form} disabled={disabled} value={String(value)} />}
      {hasState && interactive && message && (
        <div data-slot="numeric-input-message" data-value-state={effectiveState} data-popover=""
          data-sap-ui-fastnavgroup-container="true" role="status"
          className={cn("fiori-value-state-message fiori-numeric-input__message", classNames?.message)}>
          <Icon icon={valueStateIcons[effectiveState]} data-slot="numeric-input-message-icon" className={classNames?.messageIcon} />
          {message}
        </div>
      )}
    </div>
  )
}

export { NumericInput, type NumericInputProps, type NumericInputTexts, type NumericInputSlot }
