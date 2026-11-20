"use client"

import * as React from "react"

export type FioriText = string | ((...args: any[]) => string) | Partial<Record<Intl.LDMLPluralRule, string>>
/** Tables use the original SAP keys. UI5 Web Components for React keys use the `wcr:<KEY>` namespace. */
export type FioriTexts = Readonly<Record<string, FioriText>>
export type FioriDirection = "ltr" | "rtl"
export type FioriLocaleProviderProps = { locale?: string; dir?: FioriDirection; texts?: FioriTexts; children?: React.ReactNode }

type LocaleContext = { locale?: string; dir?: FioriDirection; texts: FioriTexts }
const Context = React.createContext<LocaleContext | undefined>(undefined)
const EMPTY: FioriTexts = {}

export function localeDirection(locale: string): FioriDirection {
  return /^(ar|he|iw|fa|ur)(-|$)/i.test(locale) ? "rtl" : "ltr"
}

/**
 * Set document direction on your application root. Nested providers inherit text entries.
 * Pass WCR overrides as `wcr:<KEY>` entries and use the same key when calling `t()`.
 */
export function FioriLocaleProvider({ locale, dir, texts = EMPTY, children }: FioriLocaleProviderProps) {
  const parent = React.useContext(Context)
  const value = React.useMemo(() => ({ locale: locale ?? parent?.locale, dir: dir ?? (locale ? localeDirection(locale) : parent?.dir), texts: { ...parent?.texts, ...texts } }), [parent, locale, dir, texts])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export type FioriTranslator = (key: string, fallback: string | (() => string), ...args: any[]) => string

/** UI5 webcomponents-base/util/formatMessage.js: quoted text and doubled apostrophes. */
export function formatSapText(text: string, args: any[] = []) {
  return text.replace(/('')|'([^']+(?:''[^']*)*)(?:'|$)|\{([0-9]+(?:\s*,[^{}]*)?)\}/g, (match, doubled, quoted, index) => {
    if (doubled) return "'"
    if (quoted) return quoted.replace(/''/g, "'")
    // Existing string-valued component texts substitute their placeholders later; retain an unbound parameter.
    const value = args[parseInt(index, 10)]
    return value === undefined ? match : String(value)
  })
}
export function useFioriLocale(localeProp?: string) {
  const context = React.useContext(Context)
  const locale = localeProp ?? context?.locale ?? (typeof navigator === "undefined" ? "en-US" : navigator.language || "en-US")
  const dir = localeProp ? localeDirection(localeProp) : context?.dir ?? localeDirection(locale)
  const t: FioriTranslator = React.useCallback((key, fallback, ...args) => {
    const entry = context?.texts[key]
    if (typeof entry === "function") return entry(...args)
    const text = typeof entry === "string" ? entry : entry?.[new Intl.PluralRules(locale).select(Number(args[0]))] ?? entry?.other
    if (text !== undefined) return formatSapText(text, args)
    // A component function already formatted its user-supplied label. Never reinterpret
    // placeholders or apostrophes inside that result as a second SAP message template.
    if (typeof fallback === "function") return fallback()
    // UI5 I18nBundle.getText substitutes {0}, {1}, ... in exactly their original order.
    return fallback.replace(/\{(\d+)\}/g, (match, index: string) => args[Number(index)] === undefined ? match : String(args[Number(index)]))
  }, [context, locale])
  return { locale, dir, t, localized: localeProp !== undefined || context?.locale !== undefined, hasProvider: context !== undefined }
}

export type FioriTextKeys<T> = { [P in keyof T]?: string | ((t: FioriTranslator, fallback: T[P]) => T[P]) | (T[P] extends object ? FioriTextKeys<T[P]> : never) }
/** Preserves existing props and function signatures. Components explicitly map every native key at its owner. */
export function useFioriTexts<T extends object>(defaults: T, keys: FioriTextKeys<T>, overrides?: Partial<T>, localeProp?: string): T {
  const { t } = useFioriLocale(localeProp)
  return React.useMemo(() => {
    function resolve(values: any, mapping: any, explicit: any): any {
      return Object.fromEntries(Object.entries(values).map(([property, fallback]) => {
        const key = mapping[property]
        let value = fallback
        if (typeof key === "string") value = typeof fallback === "function" ? (...args: any[]) => t(key, () => fallback(...args), ...args) : t(key, String(fallback))
        else if (typeof key === "function") value = key(t, fallback)
        else if (key && fallback && typeof fallback === "object") return [property, resolve(fallback, key, explicit?.[property])]
        return [property, explicit?.[property] ?? value]
      }))
    }
    return resolve(defaults, keys, overrides)
  }, [defaults, keys, overrides, t])
}

/** Locale-aware matching shared by filtering and type-ahead. Comparing substrings retains Intl's accent rules. */
export function collatorIncludes(value: string, query: string, locale: string | undefined, startsWith = false): boolean {
  if (!query) return true
  if (locale === undefined) return startsWith ? value.toLowerCase().startsWith(query.toLowerCase()) : value.toLowerCase().includes(query.toLowerCase())
  const compare = new Intl.Collator(locale, { sensitivity: "base" }).compare
  const text = Array.from(value.normalize("NFC"))
  for (let start = 0; start < text.length; start++) {
    // Collation-equivalent strings can differ in length (ß/ss, ligatures, combining marks).
    for (let end = start + 1; end <= text.length; end++) if (compare(text.slice(start, end).join(""), query) === 0) return true
    if (startsWith) break
  }
  return false
}
