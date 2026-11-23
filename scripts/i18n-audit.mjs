// Audit the installed pinned sources, including fixture-registered items and rendered subcomponents.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve, relative } from 'node:path'
import { createHash } from 'node:crypto'
import ts from 'typescript'
const packages = ['webcomponents', 'webcomponents-fiori']
const defaults = {}, sourceHashes = {}, definitionSources = {}, componentSources = {}
const defaultTables = {}, definitionTables = {}, componentDomains = {}
export const auditEvidencePath = '.integration/E5-evidence/fourth-20261118/audit.json'
const referenceCache = new Map()
for (const pkg of packages) {
  const domain = `@ui5/${pkg}`
  const table = defaultTables[domain] = {}, definitions = definitionTables[domain] = {}
  const file = `node_modules/@ui5/${pkg}/dist/generated/i18n/i18n-defaults.js`
  const text = readFileSync(file, 'utf8')
  sourceHashes[file] = createHash('sha256').update(text).digest('hex')
  for (const match of text.matchAll(/const (\w+) = \{ key: "([^"]+)", defaultText: ("(?:[^"\\]|\\.)*") \}/g)) { table[match[2]] = defaults[match[2]] = JSON.parse(match[3]); definitions[match[2]] = definitionSources[match[2]] = `${file}:${text.slice(0, match.index).split('\n').length} (English definition)` }
  // A small number of pinned native getters use getText("KEY") instead of an imported constant.
  const bundleFile = `node_modules/@ui5/${pkg}/dist/generated/assets/i18n/messagebundle_en.json`
  const bundleText = readFileSync(bundleFile, 'utf8'), bundle = JSON.parse(bundleText)
  sourceHashes[bundleFile] = createHash('sha256').update(bundleText).digest('hex')
  for (const [key, value] of Object.entries(bundle)) { table[key] ??= value; defaults[key] ??= value; definitions[key] ??= `${bundleFile}:${bundleText.slice(0, bundleText.indexOf(JSON.stringify(key) + ':')).split('\n').length} (English definition)`; definitionSources[key] ??= definitions[key] }
}
const wcr = 'node_modules/@ui5/webcomponents-react/dist'
const wcrDefinitions = `${wcr}/i18n/i18n-defaults.js`
const wcrDefaultsSource = readFileSync(wcrDefinitions, 'utf8')
sourceHashes[wcrDefinitions] = createHash('sha256').update(wcrDefaultsSource).digest('hex')
const wcrEnglish = {}
for (const match of wcrDefaultsSource.matchAll(/const (\w+) = \{\s*key: "([^"]+)",\s*defaultText: ("(?:[^"\\]|\\.)*")\s*\}/g)) {
  const key = `wcr:${match[2]}`
  const english = defaults[key] = JSON.parse(match[3])
  const englishSource = `${wcrDefinitions}:${wcrDefaultsSource.slice(0, match.index).split('\n').length} (English definition)`
  wcrEnglish[match[1]] = { key, english, englishSource }
}

export function properties(text) {
  const table = {}
  // Java resource properties: continuation lines, Unicode, newline and escaped separators.
  const lines = text.replace(/\\\r?\n\s*/g, '').split(/\r?\n/)
  for (const line of lines) {
    const m = line.match(/^([^#!\s][^=]*)=(.*)$/)
    if (m) table[m[1]] = m[2].replace(/\\u([a-f0-9]{4})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\([=:!# \\])/g, '$1')
  }
  return table
}
const openBundles = {}
for (const pkg of ['sap.m', 'sap.ui.mdc', 'sap.ui.core', 'sap.ui.layout', 'sap.ui.fl']) {
  const file = `node_modules/@openui5/${pkg}/src/${pkg.replaceAll('.', '/')}/messagebundle.properties`
  const text = readFileSync(file, 'utf8')
  sourceHashes[file] = createHash('sha256').update(text).digest('hex')
  openBundles[pkg] = properties(text)
  defaultTables[`@openui5/${pkg}`] = openBundles[pkg]
  const definitions = definitionTables[`@openui5/${pkg}`] = {}
  Object.assign(defaults, openBundles[pkg])
  for (const [index, line] of text.split(/\r?\n/).entries()) { const key = line.match(/^([^#!\s][^=]*)=/)?.[1]; if (key) definitions[key] = definitionSources[key] = `${file}:${index + 1} (library definition; channel still needs review)` }
}
// Source references do not prove render reachability. In particular accessibilityInfo
// types can be consumed by CustomAnnouncement.getCustomAnnouncement in ListItemCustom
// and Table; they must not be globally erased as unused metadata.
function keyReferences(file, text = readFileSync(file, 'utf8')) {
  if (referenceCache.has(file)) return referenceCache.get(file)
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS)
  const refs = Object.create(null)
  function visit(node) {
    if ((ts.isIdentifier(node) || ts.isStringLiteral(node)) && Object.hasOwn(defaults, node.text)) {
      let imported = false, owner = 'native key expression'
      for (let parent = node.parent; parent; parent = parent.parent) {
        if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) { imported = true; break }
        if (ts.isMethodDeclaration(parent) || ts.isGetAccessorDeclaration(parent) || ts.isFunctionDeclaration(parent)) { owner = parent.name?.getText(source) ?? owner; break }
        if (ts.isFunctionExpression(parent) && ts.isBinaryExpression(parent.parent)) { owner = parent.parent.left.getText(source); break }
      }
      if (!imported) { const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1; (refs[node.text] ??= new Set()).add(`${file}:${line} (${owner})`) }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  referenceCache.set(file, refs)
  return refs
}
const scan = (file, seen = new Set()) => {
  if (!existsSync(file) || seen.has(resolve(file))) return []
  seen.add(resolve(file))
  const text = readFileSync(file, 'utf8')
  sourceHashes[relative(process.cwd(), file)] = createHash('sha256').update(text).digest('hex')
  keyReferences(relative(process.cwd(), file), text)
  const keys = [...text.matchAll(/import\s*\{([^}]+)\}\s*from\s*["'].*?generated\/i18n\/i18n-defaults\.js["']/g)].flatMap(m => m[1].split(',').map(k => k.trim()).filter(Boolean))
  keys.push(...[...text.matchAll(/\.getText\("([^"]+)"/g)].map(match => match[1]).filter(key => key in defaults))
  for (const m of text.matchAll(/from\s*["'](\.\/[^"']+\.js)["']/g)) {
    const next = resolve(dirname(file), m[1])
    // Function-only i18n helpers are behavior owners too. CustomAnnouncement.js
    // is invoked by ListItemCustom._onfocusin and TableCustomAnnouncement; skipping
    // it merely because it has no class would omit real announced ACC_STATE_* keys.
    if (existsSync(next)) { const nextText = readFileSync(next, 'utf8'); if (/Template\.js$/.test(next) || /class.*extends /.test(nextText) || (nextText.includes('generated/i18n/i18n-defaults.js') && nextText.includes('.getText('))) keys.push(...scan(next, seen)) }
  }
  return [...new Set(keys)].sort()
}
const aliases = { checkbox: 'CheckBox', combobox: 'ComboBox', 'multi-combobox': 'MultiComboBox', 'data-table': 'Table', textarea: 'TextArea', tabs: 'TabContainer', 'radio-group': 'RadioButton', 'picker-field': 'Input' }
const nativeKeys = name => {
  const native = aliases[name] ?? name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('')
  const sources = packages.flatMap(pkg => existsSync(`node_modules/@ui5/${pkg}/dist/${native}.js`) ? [`node_modules/@ui5/${pkg}/dist/${native}.js`] : [])
  if (name === 'illustrated-message') sources.push(...readdirSync('node_modules/@ui5/webcomponents-fiori/dist/illustrations').filter(file => file.endsWith('.js')).map(file => `node_modules/@ui5/webcomponents-fiori/dist/illustrations/${file}`))
  // Public subcomponents owned by the same registry item; fixture wrapper imports are not audit roots.
  const children = { card: ['CardHeader'], calendar: ['CalendarLegend', 'CalendarLegendItem'], table: ['TableHeaderRow','TableHeaderCell','TableRow','TableCell','TableGroupRow','TableSelectionMulti','TableSelectionSingle','TableGrowing','TableRowAction','TableRowActionNavigation'], list: ['ListItemStandard','ListItemCustom','ListItemGroup'], tree: ['TreeItem'], 'notification-list': ['NotificationListItem','NotificationListGroupItem'], 'upload-collection': ['UploadCollectionItem'], tabs: ['Tab','TabSeparator'], menu: ['MenuItem','MenuItemGroup'], tokenizer: ['Token'] }
  for (const child of children[name] ?? []) for (const pkg of packages) if (existsSync(`node_modules/@ui5/${pkg}/dist/${child}.js`)) sources.push(`node_modules/@ui5/${pkg}/dist/${child}.js`)
  const seen = new Set()
  const keys = sources.flatMap(file => scan(file, seen))
  const related = {
    'variant-management': ['sap.m/src/sap/m/VariantManagement.js'],
    'filter-bar': ['sap.ui.mdc/src/sap/ui/mdc/FilterBar.js', 'sap.ui.mdc/src/sap/ui/mdc/filterbar/FilterBarBase.js'],
    'value-help-dialog': ['sap.ui.mdc/src/sap/ui/mdc/valuehelp/Dialog.js', 'sap.ui.mdc/src/sap/ui/mdc/valuehelp/content/Conditions.js', 'sap.ui.mdc/src/sap/ui/mdc/valuehelp/content/MTable.js', 'sap.ui.mdc/src/sap/ui/mdc/valuehelp/base/FilterableListContent.js'],
  }
  for (const entry of related[name] ?? []) { const file = `node_modules/@openui5/${entry}`; if (existsSync(file)) { const text = readFileSync(file, 'utf8'); keyReferences(file, text); sourceHashes[file] = createHash('sha256').update(text).digest('hex'); seen.add(resolve(file)) } }
  if (name === 'variant-management') keys.push(...Object.keys(openBundles['sap.m']).filter(k => k.startsWith('VARIANT_MANAGEMENT_')))
  if (name === 'filter-bar' || name === 'adapt-filters-dialog') keys.push(...Object.keys(openBundles['sap.ui.mdc']).filter(k => /^(filterbar|adaptFiltersPanel|p13nDialog)\./.test(k)))
  if (name === 'adapt-filters-dialog') keys.push(...Object.keys(openBundles['sap.m']).filter(k => /^p13n\./.test(k)))
  if (name === 'value-help-dialog') keys.push(...Object.keys(openBundles['sap.ui.mdc']).filter(k => /^valuehelp\./.test(k)))
  // These controls have no Web Component: inspect their owning OpenUI5 JS/renderer, not a guessed key family.
  const openControls = { 'object-number': 'ObjectNumber', 'object-status': 'ObjectStatus', 'object-identifier': 'ObjectIdentifier' }
  if (openControls[name]) {
    for (const suffix of ['', 'Renderer']) {
      const file = `node_modules/@openui5/sap.m/src/sap/m/${openControls[name]}${suffix}.js`
      const source = readFileSync(file, 'utf8')
      sourceHashes[file] = createHash('sha256').update(source).digest('hex')
      keyReferences(file, source); seen.add(resolve(file))
      keys.push(...[...source.matchAll(/getText\("([^"]+)"\)/g)].map(match => match[1]))
    }
    if (name === 'object-number') keys.push(...Object.keys(openBundles['sap.m']).filter(key => key.startsWith('OBJECTNUMBER_ARIA_VALUE_STATE_')))
    if (name === 'object-status') {
      for (const file of ['ValueStateSupport', 'IndicationColorSupport']) {
        const path = `node_modules/@openui5/sap.ui.core/src/sap/ui/core/${file}.js`
        const source = readFileSync(path, 'utf8')
        sourceHashes[path] = createHash('sha256').update(source).digest('hex')
        keyReferences(path, source); seen.add(resolve(path))
        keys.push(...[...source.matchAll(/getText\("([^"]+)"\)/g)].map(match => match[1]))
      }
    }
  }
  componentSources[name] = [...seen].map(file => relative(process.cwd(), file))
  componentDomains[name] = [...new Set(componentSources[name].map(sourceDomain))]
  if (name === 'adapt-filters-dialog') componentDomains[name].push('@openui5/sap.ui.mdc', '@openui5/sap.m')
  return [...new Set(keys)].sort()
}
function sourceDomain(file) { return file.match(/node_modules\/(@(?:ui5|openui5)\/[^/]+)/)?.[1] }
function englishDefinition(component, key, references, property) {
  // Select/ComboBox own WC LIST_ITEM_POSITION ("List item {0} of {1}");
  // sap.m's identically named key has a different contract ("{0} of {1}").
  // Resolve the bundle from the native consuming counterpart, never the merged key table.
  const owner = property.match(/(?:^|delegated )([^ :]+):/)?.[1]
  const domains = [...references.map(sourceDomain), ...(componentDomains[component] ?? []), ...(componentDomains[owner] ?? []), ...Object.keys(defaultTables)]
  const domain = domains.find(domain => domain && Object.hasOwn(defaultTables[domain], key))
  const source = domain?.startsWith('@openui5/') ? 'openui5' : domain === '@ui5/webcomponents-fiori' ? 'ui5-fiori' : 'ui5'
  return { source, english: defaultTables[domain]?.[key] ?? '', englishSource: definitionTables[domain]?.[key] }
}
const shipped = readdirSync('registry/ui').filter(file => file.endsWith('.tsx')).map(file => file.slice(0, -4)).sort()
const resolutions = {}
for (const name of shipped) {
  const file = `registry/ui/${name}.tsx`, source = readFileSync(file, 'utf8')
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const rows = {}
  const usedMappings = new Set()
  const translatedOutputs = new Map()
  // A returned text hook (Input.useValueStateTexts) still owns a map when its caller consumes the translated output.
  const hookMappings = new Map()
  function findHooks(node) {
    if (ts.isFunctionDeclaration(node) && node.name && node.body) {
      function body(part) {
        if (ts.isReturnStatement(part) && part.expression && ts.isCallExpression(part.expression) && part.expression.expression.getText(sf) === 'useFioriTexts') {
          hookMappings.set(node.name.text, part.expression.arguments[1]?.getText(sf))
        }
        ts.forEachChild(part, body)
      }
      body(node.body)
    }
    ts.forEachChild(node, findHooks)
  }
  findHooks(sf)
  function findOwners(node) {
    if (ts.isVariableDeclaration(node) && node.initializer && ts.isCallExpression(node.initializer)) {
      const call = node.initializer, callee = call.expression.getText(sf)
      const mapping = callee === 'useFioriTexts' ? call.arguments[1]?.getText(sf) : hookMappings.get(callee)
      if (mapping) { usedMappings.add(mapping); translatedOutputs.set(mapping, node.name.getText(sf)) }
    }
    if (ts.isCallExpression(node) && /^(t|translate)$/.test(node.expression.getText(sf))) {
      for (const match of (node.arguments[0]?.getText(sf) ?? '').matchAll(/\b(\w+Keys)\b/g)) usedMappings.add(match[1])
    }
    ts.forEachChild(node, findOwners)
  }
  findOwners(sf)
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(sf) === 't' && !source.includes('const t = (key: TextKey')) {
      // Conditional singular/plural keys still pass to the actual provider translator.
      function keyArgument(argument) {
        if (!argument) return
        if (ts.isStringLiteral(argument) && argument.text in defaults) rows[argument.text] = `${name}: owning t() text expression`
        else if (ts.isConditionalExpression(argument)) { keyArgument(argument.whenTrue); keyArgument(argument.whenFalse) }
        else if (ts.isParenthesizedExpression(argument)) keyArgument(argument.expression)
      }
      keyArgument(node.arguments[0])
    }
    if (ts.isVariableDeclaration(node) && usedMappings.has(node.name.getText(sf))) {
      const init = node.initializer && (ts.isAsExpression(node.initializer) ? node.initializer.expression : node.initializer)
      function object(n, path = []) { if (!n || !ts.isObjectLiteralExpression(n)) return; for (const prop of n.properties) if (ts.isPropertyAssignment(prop)) { const p = [...path, prop.name.getText(sf).replace(/^['"]|['"]$/g, '')]; if (ts.isStringLiteral(prop.initializer)) {
        const output = translatedOutputs.get(node.name.getText(sf))
        // Registering an unused map is not a text owner. Require use of the translated output.
        const usedOutput = !output || source.includes(`${output}.${p[0]}`) || source.includes(`${output}[`)
        if (usedOutput) rows[prop.initializer.text] = `${name}: texts/labels.${p.join('.')}`
      } else object(prop.initializer, p) } }
      object(init)
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
  resolutions[name] = { source, rows, imports: [...source.matchAll(/from "@\/components\/ui\/([^"/]+)"/g)].map(m => m[1]) }
}
function resolveKey(name, key, seen = new Set()) {
  if (seen.has(name)) return undefined
  seen.add(name)
  // Button's badge keys are consumed only when an action supplies the badge slot.
  // A dependency on Button alone does not prove the equivalent native slot is ported.
  if (seen.size > 1 && name === 'button' && /^BUTTON_BADGE_(?:ONE_ITEM|MANY_ITEMS)$/.test(key)) return undefined
  const owner = resolutions[name]
  if (!owner) return undefined
  if (owner.rows[key]) return owner.rows[key]
  // DateTimePicker renders both Calendar and TimePicker. Their native DayPicker
  // and SegmentedButton each consume LIST_ITEM_SELECTED; implementing one must
  // not hide the other outstanding announced channel under a shared key.
  if (name === 'date-time-picker' && key === 'LIST_ITEM_SELECTED' && (!resolveKey('calendar', key, new Set(seen)) || !resolveKey('time-picker', key, new Set(seen)))) return undefined
  for (const next of owner.imports) { const result = resolveKey(next, key, seen); if (result) return `delegated ${result}` }
}
const nativeByComponent = Object.fromEntries(shipped.map(component => [component, nativeKeys(component)]))
const triage = new Map()
const categories = { 'Needs owner review': 'owner-review', 'Unresolved delegation': 'delegation', 'Custom-content announcement prerequisite': 'custom-content', 'Confirmed absent feature': 'absent-feature', 'Native guarded channel': 'guarded-channel' }
// Migrate retained author triage once; thereafter the committed audit is its owning
// source, so fresh clones preserve every category without private evidence files.
const retainedTriage = '.integration/E5-evidence/GAP-TRIAGE.md'
if (existsSync(retainedTriage)) for (const line of readFileSync(retainedTriage, 'utf8').split('\n')) {
  const cells = line.split(/(?<!\\)\|/).map(cell => cell.trim())
  if (categories[cells[3]]) triage.set(`${cells[1]}/${cells[2]}`, { triage: categories[cells[3]], triageNote: cells[4] })
}
if (existsSync('docs/plan/i18n-audit.md')) {
  let component
  for (const line of readFileSync('docs/plan/i18n-audit.md', 'utf8').split('\n')) {
    if (line.startsWith('## ')) component = line.slice(3)
    const cells = line.split(/(?<!\\)\|/).map(cell => cell.trim())
    if (component && cells[4] === 'gap' && Object.values(categories).includes(cells[5])) triage.set(`${component}/${cells[1]}`, { triage: cells[5], triageNote: cells[6] })
  }
}
// Wave P's Calendar pilot is P2a. Its owner-table cell ends in an explanatory
// parenthesis; keep that note out of the final component's public name.
const ownerByComponent = Object.fromEntries([...readFileSync('docs/plan/README.md', 'utf8').matchAll(/^\| (P(?:2a|[1-6])) \| ([^|]+) \|$/gm)].flatMap(match => match[2].replace(/\s+\([^)]*\)\s*$/, '').split(',').map(component => [component.trim(), match[1]])))
// Icon has no i18n rows and is omitted from the wave-P table; keep the shared
// display primitive's zero-count inventory under P5 rather than inventing gaps.
ownerByComponent.icon = 'P5'

// Audit WCR's package-owned text imports from each component and its internal
// hooks/renderers. Shared Web Component keys continue to use their own domain.
const wcrComponents = {
  'action-sheet': ['ActionSheet', 'H10'],
  'analytical-card-header': ['AnalyticalCardHeader', 'H10'],
  'analytical-table': ['AnalyticalTable', 'H1'],
  'message-box': ['MessageBox', 'H7'],
  'message-view': ['MessageView', 'H0'],
  'select-dialog': ['SelectDialog', 'H9'],
  'splitter-layout': ['SplitterLayout', 'H9'],
}

function wcrRows(component, name) {
  // SplitterLayout delegates the separator and its keyboard hint to Splitter.
  const directories = (component === 'splitter-layout' ? [name, 'Splitter'] : [name]).map(part => `${wcr}/components/${part}`)
  const files = directories.flatMap(directory => readdirSync(directory, { recursive: true })
    .filter(file => file.endsWith('.js')).map(file => `${directory}/${file}`)).sort()
  const imports = new Map()
  for (const path of files) {
    const text = readFileSync(path, 'utf8')
    const declaration = /import\s*\{([^}]+)\}\s*from\s*['"](\.[^'"]*\/i18n\/i18n-defaults\.js)['"]/g
    for (const match of text.matchAll(declaration)) {
      if (resolve(dirname(path), match[2]) !== resolve(wcrDefinitions)) continue
      sourceHashes[path] = createHash('sha256').update(text).digest('hex')
      const line = text.slice(0, match.index).split('\n').length
      for (const symbol of match[1].split(',').map(entry => entry.trim().split(/\s+as\s+/)[0])) {
        if (!wcrEnglish[symbol]) throw new Error(`Missing WCR English definition for ${symbol} in ${path}`)
        if (!imports.has(symbol)) imports.set(symbol, [])
        imports.get(symbol).push(`${path}:${line} (WCR key import)`)
      }
    }
  }
  return [...imports].sort(([a], [b]) => a.localeCompare(b)).map(([symbol, nativeReferences]) => {
    const definition = wcrEnglish[symbol]
    const property = resolveKey(component, definition.key)
    const reason = unreachable[`${component}/${definition.key}`]
    const status = property ? 'ok' : reason ? 'not rendered' : shipped.includes(component) ? 'gap' : 'reference only'
    return {
      ...definition, source: 'wcr', nativeReferences, status,
      property: property ?? reason ?? (status === 'gap' ? 'No implemented provider/override text owner' : 'Port pending'),
    }
  })
}

// Keep scanned keys visible when the pinned component's template cannot reach them.
const unreachable = {}
function unrendered(component, keys, reason) {
  for (const key of keys) unreachable[`${component}/${key}`] = reason
}
for (const [component, reason] of [
  ['button-badge', 'ButtonBadgeTemplate hides the Tag state icon.'],
  ['split-button', 'SplitButtonTemplate only renders decorative Button icons.'],
  ['numeric-input', 'NumericInputTemplate hides private step icons; InputPopoverTemplate uses a decorative state icon.'],
]) unrendered(component, ['ICON_ARIA_TYPE_IMAGE', 'ICON_ARIA_TYPE_INTERACTIVE'], reason)
unrendered('button-badge', ['TAG_ERROR', 'TAG_INFORMATION', 'TAG_ROLE_DESCRIPTION', 'TAG_SUCCESS'], 'ButtonBadgeTemplate only renders a noninteractive Critical Tag.')
unrendered('split-button', ['BUSY_INDICATOR_TITLE', 'BUTTON_ROLE_DESCRIPTION', 'LINK_ROLE_DESCRIPTION', 'LABEL_COLON', 'BUTTON_BADGE_ONE_ITEM', 'BUTTON_BADGE_MANY_ITEMS'],
  'SplitButtonTemplate renders plain inner buttons without loading, badge, associated label or CustomAnnouncement metadata.')
unrendered('numeric-input', ['VALUE_STATE_SUCCESS'], 'Input.hasValueStateMessage excludes Positive from the default message; the VALUE_STATE_TYPE_SUCCESS description remains.')
unrendered('numeric-input', ['NUMBERINPUT_DEC_ICON_TITLE', 'NUMBERINPUT_INC_ICON_TITLE'], 'NumericInputTemplate guards these titles with private _showStepButtons; StepInput enables that flag and owns the visible controls.')
unrendered('numeric-input', [
  'INPUT_AVALIABLE_VALUES', 'INPUT_CLEAR_ICON_ACC_NAME', 'INPUT_SUGGESTIONS', 'INPUT_SUGGESTIONS_CANCEL_BUTTON',
  'INPUT_SUGGESTIONS_COLLAPSED', 'INPUT_SUGGESTIONS_EXPANDED', 'INPUT_SUGGESTIONS_MORE_HITS', 'INPUT_SUGGESTIONS_NO_HIT',
  'INPUT_SUGGESTIONS_OK_BUTTON', 'INPUT_SUGGESTIONS_ONE_HIT', 'INPUT_SUGGESTIONS_TITLE',
], 'NumericInputTemplate does not enable clear or suggestion features on its inner Input.')
unrendered('numeric-input', ['POPOVER_ARIA_DESCRIBEDBY_RESIZABLE', 'POPOVER_HANDLE_ARIA_ROLEDESCRIPTION', 'POPOVER_RESIZE_HANDLE_ARIA_LABEL', 'POPOVER_RESIZE_HANDLE_TOOLTIP'],
  'InputPopoverTemplate does not make the NumericInput value-state popover resizable.')
unrendered('numeric-input', ['VALUE_STATE_LINK', 'VALUE_STATE_LINKS', 'VALUE_STATE_LINKS_MAC', 'VALUE_STATE_LINK_MAC'],
  'NumericInputTemplate forwards a slot element to the inner Input; Input.valueStateLinks inspects element children, not assigned nodes of that slot.')

for (const [card, keys] of [
  ['H3 grouping and aggregates', ['GROUP', 'GROUPED', 'UNGROUP']],
  ['H4 tree, selection and row states', [
    'ALL_ROWS_DESELECTED', 'ALL_ROWS_DESELECTED_FILTERED', 'ALL_ROWS_SELECTED', 'ALL_ROWS_SELECTED_FILTERED',
    'COLLAPSE_NODE', 'DESELECT_ALL', 'EXPAND_NODE',
    'HIGHLIGHT_COLUMN', 'NAVIGATION_COLUMN', 'ROW_COLLAPSED', 'ROW_DESELECTED', 'ROW_DESELECTED_MULTI',
    'ROW_DESELECTED_MULTI_FILTERED', 'ROW_EXPANDED', 'ROW_SELECTED', 'ROW_SELECTED_MULTI',
    'ROW_SELECTED_MULTI_FILTERED', 'SELECT_ALL',
    'SELECTION_COLUMN',
  ]],
  ['H5 overlay', ['INVALID_TABLE']],
]) unrendered('analytical-table', keys.map(key => `wcr:${key}`), `Native channel activates with ${card}.`)

for (const component of shipped) if (!ownerByComponent[component] && !wcrComponents[component]) throw new Error(`Missing owning card for ${component}`)
const audit = shipped.filter(component => !wcrComponents[component]).map(component => ({ component, owner: ownerByComponent[component], rows: [...new Set([...nativeByComponent[component], ...Object.keys(resolutions[component].rows).filter(key => key in defaults)])].sort().map(key => {
  const inactive = unreachable[`${component}/${key}`]
  const implementation = !inactive && resolveKey(component, key)
  const property = inactive || implementation || 'No implemented provider/override text owner'
  const status = inactive ? 'not rendered' : implementation ? 'fixed in E5' : 'gap'
  const nativeReferences = [...new Set(componentSources[component].flatMap(file => [...(referenceCache.get(file)?.[key] ?? [])]))].sort()
  const definition = englishDefinition(component, key, nativeReferences, property)
  if (!nativeReferences.length && definition.englishSource) nativeReferences.push(definition.englishSource)
  return { key, ...definition, property, status, ...(status === 'gap' ? triage.get(`${component}/${key}`) ?? { triage: 'owner-review', triageNote: 'Newly inventoried native channel requires owning P-card review.' } : {}), nativeReferences }
}) }))
for (const [component, [native, owner]] of Object.entries(wcrComponents)) {
  audit.push({ component, owner, reference: 'wcr', rows: wcrRows(component, native) })
}
audit.sort((a, b) => a.component.localeCompare(b.component))
const escape = s => String(s).replaceAll('|', '\\|').replaceAll('\n', '<br>')
const all = audit.flatMap(group => group.rows), keys = [...new Set(all.map(row => row.key))].sort()
const markdown = '# UI5 localization audit\n\nGenerated by `node scripts/i18n-audit.mjs` from installed UI5 Web Components 2.28.1, UI5 Web Components for React 2.28.2 and OpenUI5 1.154.0. Every native imported key is retained, including rendered subcomponents, function-only announcement helpers and the OpenUI5 library key families required by E5. `gap` means no actual translated render/announcement owner exists; it is never counted as fixed by an unused prop.\n\nThe 2026-11-17 E5 scope creates the ratchet in `tests/i18n-audit-baseline.json`; remaining gaps belong to P1, P2, P2a and P3–P6. P2a owns Calendar and the three date pickers; TimePicker and PickerField remain P2. Native source references identify key expressions, not automatic proof of render reachability. Library-definition-only rows still need owning-channel review. `accessibilityInfo.type` is metadata at its direct owner but CustomAnnouncement consumes it in custom List/Table content, so there is no global metadata exclusion. Retained triage categories and notes are carried forward below; they never waive a gap. Full source references, owning English definitions and hashes are preserved in `' + auditEvidencePath + '`. English defaults resolve from the native consuming counterpart, including identically named WC and OpenUI5 keys. WCR keys are namespaced as `wcr:<KEY>`. H cards own the WCR inventory, where `reference only` means the translation is available in the pack and the component port is pending.\n\nPinned-source drift: StepInput delegates to NumericInput in 2.28.1 and uses `NUMBERINPUT_*`, rather than the card example’s earlier `STEPINPUT_*`. Icon has no i18n rows; its zero-count shared display inventory is assigned to P5.\n\n' + audit.map(group => `## ${group.component}\n\nOwner: ${group.owner}\n\n| SAP key | English text | React property / owner | Status | Triage | Triage note | Native source / channel | Source |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n` + group.rows.map(row => `| ${escape(row.key)} | ${escape(row.english)} | ${escape(row.property)} | ${row.status} | ${row.triage ?? ''} | ${escape(row.triageNote ?? '')} | ${escape(row.nativeReferences.slice(0, 3).join('; '))}${row.nativeReferences.length > 3 ? `; +${row.nativeReferences.length - 3} more in audit.json` : ''} | ${row.source} |`).join('\n') + '\n').join('\n')
writeFileSync('docs/plan/i18n-audit.md', markdown)
mkdirSync(dirname(auditEvidencePath), { recursive: true })
writeFileSync(auditEvidencePath, JSON.stringify({ audit, keys, sourceHashes }, null, 2) + '\n')
if (process.argv.includes('--write-baseline')) {
  if (audit.some(group => !group.owner)) throw new Error('Every baseline component needs its owning P card')
  writeFileSync('tests/i18n-audit-baseline.json', JSON.stringify(Object.fromEntries(audit.filter(group => group.reference !== 'wcr' || shipped.includes(group.component)).map(group => [group.component, { owner: group.owner, gapCount: group.rows.filter(row => row.status === 'gap').length, okKeys: group.rows.filter(row => row.status === 'ok' || row.status === 'fixed in E5').map(row => row.key) }])), null, 2) + '\n')
}
console.log(process.argv.includes('--json') ? JSON.stringify({ audit, keys, sourceHashes }) : `i18n audit: ${audit.length} components, ${keys.length} unique keys, ${all.length} rows, ${all.filter(row => row.status === 'gap').length} gaps`)
export { audit, keys, defaults }
