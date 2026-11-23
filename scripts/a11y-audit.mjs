// Generate a source-backed inventory. An inferred prop name is never a verified equivalent.
import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import ts from "typescript"
import { componentOwner } from "../tests/a11y-tree-baseline.ts"

const root = process.cwd()
const read = (file) => readFileSync(path.join(root, file), "utf8")
const owners = readdirSync("registry/ui").filter((name) => name.endsWith(".tsx"))
const exported = new Map()
for (const file of owners) {
  const source = read(`registry/ui/${file}`)
  for (const match of source.matchAll(/(?:function|const)\s+([A-Z]\w*)\b/g)) exported.set(match[1], file.replace(/\.tsx$/, ""))
}
const aliases = {
  TextArea: "textarea", CheckBox: "checkbox", ComboBoxItem: "combobox", ComboBoxItemGroup: "combobox", Option: "select", OptionGroup: "select",
  MultiComboBoxItem: "multi-combobox", MultiComboBoxItemGroup: "multi-combobox", RadioButton: "radio-group",
  ListItemStandard: "list", ListItemCustom: "list", ListItemGroup: "list", ListItemBase: "list", ListItem: "list",
  TableSelectionMulti: "table", TableSelectionSingle: "table", TableGrowing: "table", DayPicker: "calendar", MonthPicker: "calendar", YearPicker: "calendar", YearRangePicker: "calendar",
  NotificationListItem: "notification-list", NotificationListGroupItem: "notification-list", UploadCollectionItem: "upload-collection", TimelineItem: "timeline",
  Tab: "tabs", TabSeparator: "tabs", TabContainer: "tabs", TreeItem: "tree", TreeItemCustom: "tree", TreeItemBase: "tree",
  SideNavigationItem: "side-navigation", SideNavigationSubItem: "side-navigation", SideNavigationGroup: "side-navigation",
  ProductSwitchItem: "product-switch", CardHeader: "card", WizardStep: "wizard", BreadcrumbsItem: "breadcrumbs",
  UserMenuAccount: "user-menu", UserMenuItem: "user-menu", MediaGalleryItem: "media-gallery", CarouselItem: "carousel",
}
const sourceOwner = (name) => aliases[name] ?? exported.get(name)
const packages = ["@ui5/webcomponents", "@ui5/webcomponents-fiori"]
const verified = Object.fromEntries([
  ["Input", "inner native input", "tests/input.spec.ts: Input <channel> reaches the same native textbox as UI5", "ok"],
  ["SegmentedButton", "root listbox", "tests/segmented-button.spec.ts: root <channel> reaches the UI5 owning element", "ok"],
  ["SegmentedButtonItem", "option host (including asChild); description refs include the owned hint target", "tests/segmented-button.spec.ts: item <channel> reaches the UI5 owning element", "fixed in E4"],
].flatMap(([component, element, proof, status]) => [
  ["accessibleName", "aria-label"], ["accessibleNameRef", "aria-labelledby"],
  ["accessibleDescription", "aria-description"], ["accessibleDescriptionRef", "aria-describedby"],
].map(([member, equivalent]) => [`${component}.${member}`, { equivalent: `${equivalent} on the ${element}`, status, proof }])))
const verify = (component, member, equivalent, proof) => {
  verified[`${component}.${member}`] = { equivalent, proof, status: "fixed in E4" }
}
for (const [member, equivalent] of [
  ["accessibleName", "aria-label on inner ul"],
  ["accessibleNameRef", "aria-labelledby on inner ul"],
  ["accessibleDescription", "aria-description on inner ul, composed with owned text"],
  ["accessibleDescriptionRef", "aria-describedby prop resolved onto inner ul aria-description, tracking target changes"],
]) verify("List", member, equivalent, "tests/list.spec.ts: List <channel> reaches the native owning element; description refs track changed targets on the native ul description channel")
verify("List", "accessibleRole", "accessibleRole on inner ul; list/listbox/menu/tree item roles inherit", "tests/list.spec.ts: List <role> inherits the UI5 item role")
verify("List", "accessibilityAttributes", "growingButtonName / growingButtonDescription on the owned growing button and description target", "tests/list.spec.ts: List growing reaches the native owning element")
verify("ListItemStandard", "accessibleName", "aria-label prop composed with the active hint in li aria-labelledby", "tests/list.spec.ts: List list-a11y-standard-name preserves UI5 descriptions and custom content semantics")
verify("ListItemCustom", "accessibleName", "aria-label prop composed with the active hint in li aria-labelledby", "tests/list.spec.ts: List list-a11y-custom-name preserves UI5 descriptions and custom content semantics")
verify("ListItemCustom", "accessibleRole", "role on the owned li, overriding parent inheritance and retaining selection under an ordinary list", "tests/list.spec.ts: List list-a11y-custom-name preserves UI5 descriptions and custom content semantics; list: an explicit Option item keeps its selected state under an ordinary list")
verify("ListItemCustom", "accessibilityAttributes", "aria-posinset / aria-setsize on the owned li, retaining selected/description/tabindex", "tests/list.spec.ts: List list-a11y-custom-name preserves UI5 descriptions and custom content semantics")
verify("ListItemGroupHeader", "accessibleName", "accessibleName appended to visible title in the owned li aria-label", "tests/list.spec.ts: List list-a11y-group-header-name preserves UI5 descriptions and custom content semantics")
for (const [member, equivalent] of [
  ["accessibleName", "aria-label on SelectTrigger combobox"],
  ["accessibleNameRef", "aria-labelledby on SelectTrigger combobox"],
  ["accessibleDescription", "aria-description on SelectTrigger combobox"],
  ["accessibleDescriptionRef", "aria-describedby on SelectTrigger combobox"],
]) verify("Select", member, equivalent + (member === "accessibleName" || member === "accessibleNameRef" ? "; resolved field name also reaches the phone listbox and prefixed dialog name" : ""), "tests/select.spec.ts: Select <channel> reaches the same native combobox as UI5; phone name/name-ref/label/unnamed cases follow live label updates")
for (const [member, equivalent] of [
  ["accessibleName", "aria-label on inner ul role=tree"],
  ["accessibleNameRef", "aria-labelledby on inner ul role=tree"],
  ["accessibleDescription", "aria-description on inner ul role=tree"],
  ["accessibleDescriptionRef", "aria-describedby targets resolved to inner ul aria-description, tracking target changes"],
]) verify("Tree", member, equivalent, "tests/tree.spec.ts: Tree [RTL] <channel> reaches UI5's owning tree")
verify("TreeItem", "accessibleName", "aria-label prop composed with the native active hint in the owned treeitem aria-labelledby", "tests/tree.spec.ts: Tree [RTL] item name and popup channel retain the native active hint")
verify("TreeItem", "accessibilityAttributes", "aria-haspopup on the owned treeitem; positions remain owned as TreeItemBase.js:_accInfo specifies", "tests/tree.spec.ts: Tree [RTL] item name and popup channel retain the native active hint")
for (const component of ["TreeItem", "TreeItemCustom"]) verify(component, "accessibleRole", "role=treeitem owned on the row; UI5 TreeItemBase.js:_accInfo overrides inherited accessibleRole", "tests/tree.spec.ts: Tree [RTL] custom content cannot replace owned role, states, ids or tab stops (shared TreeNode owner)")
verified["TreeItemCustom.accessibleName"] = { equivalent: "aria-label composes with the native active hint on the shared TreeNode owner; dedicated custom-name pair still pending", status: "gap" }
verified["TreeItemCustom.accessibilityAttributes"] = { equivalent: "aria-haspopup reaches the shared TreeNode row; dedicated custom-popup pair still pending", status: "gap" }
const h8NativeProof = "tests/a11y-tree-customizations.spec.ts: H8 native names, relationships and text overrides reach their owning controls"
for (const [component, member, equivalent] of [
  ["SplitButton", "accessibleName", "aria-label augments the group’s name in its owned hidden label"],
  ["SplitButton", "accessibilityAttributes", "aria-haspopup and aria-keyshortcuts reach the group; arrowHasPopup and arrowExpanded reach its arrow"],
  ["NumericInput", "accessibleName", "aria-label on the native textbox"],
  ["NumericInput", "accessibleNameRef", "aria-labelledby on the native textbox"],
]) verified[`${component}.${member}`] = { equivalent, proof: h8NativeProof, status: "ok" }
const h1Source = "node_modules/@ui5/webcomponents-react/dist/components/AnalyticalTable"
const h1Proof = "tests/a11y-tree-customizations.spec.ts: AnalyticalTable protects custom cell semantics and preserves native grid naming"
const h1Members = [
  ["accessibleName", "aria-label on the inner grid", "index.js"],
  ["accessibleNameRef", "aria-labelledby on the inner grid", "index.js"],
  ["headerLabel", "column.headerLabel on the owned columnheader", "hooks/useA11y.js"],
  ["cellLabel", "column.cellLabel on the owned gridcell", "hooks/useA11y.js"],
]
const h1Texts = [
  ["wcr:FIXED_COLUMN", "fixedColumn", "pluginHooks/useStickyColumns.js"],
  ["wcr:FREEZE_COLUMN", "freezeColumn", "pluginHooks/useStickyColumns.js"],
  ["wcr:UNFREEZE_COLUMN", "unfreezeColumn", "pluginHooks/useStickyColumns.js"],
  ["wcr:MOVE_TO_CONTENT_F2", "moveToContent", "pluginHooks/useF2CellEdit.js"],
  ["wcr:INCLUDES_X", "includesContent", "pluginHooks/useF2CellEdit.js"],
  ["ARIA_LABEL_EMPTY_CELL", "emptyCell", "pluginHooks/useAnnounceEmptyCells.js"],
  ["wcr:SELECT_PRESS_SPACE", "selectRow", "index.js"],
  ["wcr:UNSELECT_PRESS_SPACE", "unselectRow", "index.js"],
  ["wcr:SELECT_ALL_PRESS_SPACE", "selectAll", "index.js"],
  ["wcr:UNSELECT_ALL_PRESS_SPACE", "unselectAll", "index.js"],
  ["wcr:EXPAND_PRESS_SPACE", "expandRow", "index.js"],
  ["wcr:COLLAPSE_PRESS_SPACE", "collapseRow", "index.js"],
]
const verifiedTexts = {
  "segmented-button.LIST_ITEM_SELECTED": { equivalent: "SegmentedButton.texts.selected", proof: "tests/segmented-button.spec.ts: selection announces assertively and deselection does not announce", status: "fixed in E4" },
  "segmented-button.SEGMENTEDBUTTON_ARIA_DESCRIBEDBY": { equivalent: "SegmentedButton.texts.itemDescription / SegmentedButtonItem.texts.itemDescription", proof: "tests/segmented-button.spec.ts: item description and description-ref reach the UI5 owning element", status: "fixed in E4" },
}
for (const [key, equivalent, proof] of [
  ["LIST_ROLE_DESCRIPTION", "listDescription", "List list-custom / list-types preserves UI5 descriptions and custom content semantics; List texts overrides keep owned selection, group and focus descriptions"],
  ["LIST_ROLE_LIST_GROUP_DESCRIPTION", "groupDescription", "List list-groups preserves UI5 descriptions and custom content semantics; List texts overrides keep owned selection, group and focus descriptions"],
  ["LIST_ITEM_SELECTED", "selected (legacy selectedText wins)", "List selection changes announce politely with the same selected/not-selected text; List texts overrides keep owned selection, group and focus descriptions"],
  ["LIST_ITEM_NOT_SELECTED", "notSelected (legacy notSelectedText wins)", "List selection changes announce politely with the same selected/not-selected text"],
  ["LIST_ITEM_ACTIVE", "active", "List list-a11y-standard-name / list-a11y-custom-name preserves UI5 descriptions and custom content semantics; List texts overrides keep owned selection, group and focus descriptions"],
  ["LISTITEMCUSTOM_TYPE_TEXT", "customItem", "List custom focus description matches UI5 content and controls and clears on blur (actual Chromium AX names and label targets)"],
  ["GROUP_HEADER_TEXT", "groupHeader", "List list-a11y-group-header-name preserves UI5 descriptions and custom content semantics"],
  ["ARIA_LABEL_LIST_MULTISELECTABLE", "multiSelectable", "list: roles, header label and selection announced on list items"],
  ["ARIA_LABEL_LIST_ITEM_CHECKBOX", "checkboxLabel", "List multiple selection control keeps its UI5 role, state, label and keyboard activation; List texts overrides keep owned selection, group and focus descriptions"],
  ["ARIA_LABEL_LIST_ITEM_RADIO_BUTTON", "radioLabel", "List single-start selection control keeps its UI5 role, state, label and keyboard activation"],
]) verifiedTexts[`list.${key}`] = { equivalent: `List.texts.${equivalent}`, proof: `tests/list.spec.ts: ${proof}`, status: "fixed in E4" }
for (const [key, equivalent] of [
  ["SELECT_ROLE_DESCRIPTION", "roleDescription"],
  ["SELECT_OPTIONS_IN_GROUPS", "optionsInGroups"],
  ["LIST_ITEM_POSITION", "itemPosition"],
]) verifiedTexts[`select.${key}`] = { equivalent: `Select.texts.${equivalent}`, proof: "tests/select.spec.ts: Select group summary and selection announcements preserve UI5 text and politeness; Select lets callers override role, group and position texts", status: "fixed in E4" }
for (const [key, equivalent, proof] of [
  ["TREE_ITEM_ARIA_LABEL", "treeItem", "Tree row label references retain only owned content through expansion"],
  ["LIST_ITEM_ACTIVE", "active", "Tree [RTL] item name and popup channel retain the native active hint"],
  ["LIST_ITEM_SELECTED", "selected", "Tree text overrides keep selection descriptions and polite announcements connected"],
  ["LIST_ITEM_NOT_SELECTED", "notSelected", "Tree text overrides keep selection descriptions and polite announcements connected"],
  ["TREE_ITEM_EXPAND_NODE", "expandText (legacy expandText wins)", "Tree text overrides keep selection descriptions and polite announcements connected"],
  ["TREE_ITEM_COLLAPSE_NODE", "collapseText (legacy collapseText wins)", "Tree text overrides keep selection descriptions and polite announcements connected"],
]) verifiedTexts[`tree.${key}`] = { equivalent: `Tree.texts.${equivalent}`, proof: `tests/tree.spec.ts: ${proof}`, status: "fixed in E4" }
for (const [key, equivalent] of [
  ["CALENDAR_HEADER_MONTH_PREVIOUS_BUTTON_SHORTCUT", "previousButtonShortcut"],
  ["CALENDAR_HEADER_MONTH_NEXT_BUTTON_SHORTCUT", "nextButtonShortcut"],
]) verifiedTexts[`calendar.${key}`] = { equivalent: `Calendar.texts.${equivalent}`, proof: "tests/calendar.spec.ts: Calendar header arrows preserve UI5 descriptions and localized shortcuts in every picker and direction", status: "fixed in E4" }
verifiedTexts["calendar.LIST_ITEM_SELECTED"] = { equivalent: "Calendar.texts.selected", proof: "tests/calendar.spec.ts: Calendar [ltr/rtl] [single/range/multiple] selection announces with native conditions and assertive politeness; Calendar selection text override reaches the assertive announcement", status: "fixed in E4" }
for (const [key, equivalent] of [["LIST_ITEM_POSITION", "itemPosition"], ["LIST_ITEM_GROUP_HEADER", "groupHeader"]]) verifiedTexts[`combobox.${key}`] = { equivalent: `ComboBox.texts.${equivalent}`, proof: "tests/combobox.spec.ts: ComboBox [ltr/rtl] keyboard announcements use displayed rows, group headers and additional text; ComboBox lets callers override group and displayed-position announcement texts", status: "fixed in E4" }
for (const [owner, key, equivalent] of [
  ["button", "BUTTON_BADGE_ONE_ITEM", "ButtonBadge.texts.oneItem via Button.badge"],
  ["button", "BUTTON_BADGE_MANY_ITEMS", "ButtonBadge.texts.manyItems via Button.badge"],
  ["split-button", "SPLIT_BUTTON_DESCRIPTION", "SplitButton.texts.description"],
  ["split-button", "SPLIT_BUTTON_KEYBOARD_HINT", "SplitButton.texts.keyboardHint"],
  ["split-button", "SPLIT_BUTTON_ARROW_BUTTON_TOOLTIP", "SplitButton.texts.arrowLabel"],
  ["numeric-input", "NUMBERINPUT_PATTERN_MISSMATCH", "NumericInput.texts.invalidFormat"],
  ["numeric-input", "NUMBERINPUT_RANGEUNDERFLOW", "NumericInput.texts.belowMinimum"],
  ["numeric-input", "NUMBERINPUT_RANGEOVERFLOW", "NumericInput.texts.aboveMaximum"],
]) verifiedTexts[`${owner}.${key}`] = { equivalent, proof: h8NativeProof, status: "ok" }
for (const key of ["NUMBERINPUT_DEC_ICON_TITLE", "NUMBERINPUT_INC_ICON_TITLE"]) {
  verifiedTexts[`numeric-input.${key}`] = {
    equivalent: "NumericInputTemplate guards both buttons with private _showStepButtons, which only StepInput enables.",
    proof: "NumericInput.js initializes _showStepButtons to false; StepInputTemplate.js explicitly enables it.",
    status: "ok",
  }
}

verifiedTexts["splitter-layout.PRESS_ARROW_KEYS_TO_MOVE"] = { equivalent: "SplitterLayout.texts.keyboardHint", status: "ok",
  proof: "tests/splitter-layout.spec.ts: SplitterLayout keyboard bounds and steps" }

const rows = [], sourceFiles = new Map()
for (const pkg of packages) {
  const manifestPath = `node_modules/${pkg}/dist/custom-elements.json`
  const manifest = JSON.parse(read(manifestPath))
  for (const module of manifest.modules) for (const declaration of module.declarations ?? []) {
    if (declaration.kind !== "class") continue
    const owner = sourceOwner(declaration.name)
    if (!owner) continue
    const file = `node_modules/${pkg}/${module.path}`
    sourceFiles.set(file, owner)
    const template = file.replace(/\.js$/, "Template.js")
    try { read(template); sourceFiles.set(template, owner) } catch {}
    for (const member of declaration.members ?? []) {
      if (!member.name.startsWith("accessib") || member.privacy === "private" || member.privacy === "protected") continue
      const source = read(`registry/ui/${owner}.tsx`)
      const native = { accessibleName: "aria-label", accessibleNameRef: "aria-labelledby", accessibleDescription: "aria-description", accessibleDescriptionRef: "aria-describedby", accessibleRole: "role" }[member.name]
      const declared = new RegExp(`\\b${member.name}\\??\\s*:`).test(source)
      const equivalent = declared ? `${member.name} (owning-element verification pending)` : native ? `${native} passthrough candidate (owning-element verification pending)` : `${member.name}: explicit mapping required`
      const checked = verified[`${declaration.name}.${member.name}`]
      rows.push({ component: declaration.name, owner, member: member.name, equivalent: checked?.equivalent ?? equivalent, status: checked?.status ?? "gap", proof: checked?.proof, source: `${file}`, description: member.description ?? "" })
    }
  }
}
// Helpers contain real focus-time accessibilityInfo channels even when no announce() call exists.
for (const [file, owner] of [
  ["node_modules/@ui5/webcomponents/dist/TableCustomAnnouncement.js", "table"],
  ["node_modules/@ui5/webcomponents/dist/CustomAnnouncement.js", "list,table"],
  ["node_modules/@ui5/webcomponents/dist/ListItemBase.js", "list"],
  ["node_modules/@ui5/webcomponents-react/dist/components/Splitter/index.js", "splitter-layout"],
]) sourceFiles.set(file, owner)
const textRows = [], announcements = []
for (const [file, owner] of sourceFiles) {
  const source = read(file), lines = source.split("\n")
  const keys = new Set([...source.matchAll(/getText\(\s*([A-Z][A-Z\d_]+)/g)].map((match) => match[1]))
  for (const key of keys) {
    const line = lines.findIndex((value) => value.includes(`getText(${key}`)) + 1
    textRows.push({ owner, key, source: `${file}:${line}`, status: "gap", equivalent: "Exact overridable text and behavior assertion require verification", ...verifiedTexts[`${owner}.${key}`] })
  }
  for (let index = 0; index < lines.length; index++) if (/\bannounce\(|\bapplyCustomAnnouncement\(|\bgetCustomAnnouncement\(/.test(lines[index])) {
    announcements.push({ owner, source: `${file}:${index + 1}`, native: lines[index].trim(), status: owner === "segmented-button" ? "fixed in E4" : "gap", ...(owner === "segmented-button" ? { equivalent: "assertive alert span in the nearest modal ancestor or document.body", proof: "tests/segmented-button.spec.ts: selection announces assertively and deselection does not announce" } : {}) })
    const row = announcements.at(-1)
    if (file.endsWith("/DayPicker.js") && lines[index].includes("announce(DayPicker")) Object.assign(row, { status: "fixed in E4", equivalent: "Calendar owned assertive alert: Single/Range activations and toggled-on Multiple days; silent range extensions/week/deselection", proof: "tests/calendar.spec.ts: Calendar [ltr/rtl] [single/range/multiple] selection announces with native conditions and assertive politeness" })
    if (file.endsWith("/ComboBox.js") && (lines[index].includes("announce(`${groupHeaderText}") || lines[index].includes("announce(`${currentItemAdditionalText}"))) Object.assign(row, { status: "fixed in E4", equivalent: "ComboBox owned polite alert: group header or additionalText plus displayed non-group position while open; additionalText alone while closed", proof: "tests/combobox.spec.ts: ComboBox [ltr/rtl] keyboard announcements use displayed rows, group headers and additional text" })
    if (file.endsWith("/List.js") && lines[index].includes("announce(selectedText")) Object.assign(row, { status: "fixed in E4", equivalent: "List/Tree owned polite alerts in the nearest modal ancestor or document.body (Tree inherits this native List selection channel)", proof: "tests/list.spec.ts: List selection changes announce politely with the same selected/not-selected text; tests/tree.spec.ts: Tree [RTL] custom content cannot replace owned role, states, ids or tab stops; Tree text overrides keep selection descriptions and polite announcements connected" })
    if (file.endsWith("/Select.js") && lines[index].includes("announce(text")) Object.assign(row, { status: "fixed in E4", equivalent: "Select's owned polite alert announces selected text; open state adds the same position text", proof: "tests/select.spec.ts: Select group summary and selection announcements preserve UI5 text and politeness" })
    if (file.endsWith("/ListItemCustom.js")) Object.assign(row, { equivalent: "ListItemCustom focus name/connected label targets verified for custom text + Fiori Button; other widget/state hooks still gap", proof: "tests/list.spec.ts: List custom focus description matches UI5 content and controls and clears on blur" })
  }
}
// Use exported component signatures, not broad implementation-line regexes.
for (const [member, equivalent, file] of h1Members) {
  rows.push({ component: "AnalyticalTable", owner: "analytical-table", member, equivalent, status: "ok", proof: h1Proof, source: `${h1Source}/${file}` })
}
for (const [key, field, file] of h1Texts) {
  textRows.push({ owner: "analytical-table", key, equivalent: `AnalyticalTable.texts.${field}`, status: "ok", source: `${h1Source}/${file}` })
}

// The allowed consumer spec owns the exact runtime proof map and source-backed
// nonfunctional classifications; unknown public points stay gap.
const consumerSpec = read("tests/a11y-tree-customizations.spec.ts")
const inlineMap = (name) => {
  const match = new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\}) as const`).exec(consumerSpec)
  if (!match) throw new Error(`Missing inline customization inventory ${name}`)
  return JSON.parse(match[1].replace(/,(\s*})$/, "$1"))
}
const customizationProofs = inlineMap("customizationProofs"), nonFunctional = inlineMap("nonFunctionalCustomizations"), excludedCustomizations = inlineMap("excludedCustomizationPoints")
const configuration = ts.readConfigFile("tsconfig.json", ts.sys.readFile)
const parsed = ts.parseJsonConfigFileContent(configuration.config, ts.sys, ".")
const program = ts.createProgram(parsed.fileNames, parsed.options), checker = program.getTypeChecker()
const custom = []
for (const file of program.getSourceFiles().filter((source) => /registry\/ui\/[^/]+\.tsx$/.test(source.fileName))) {
  const module = checker.getSymbolAtLocation(file)
  if (!module) continue
  for (const symbol of checker.getExportsOfModule(module)) {
    if (!/^[A-Z]/.test(symbol.name) || /Context$|StateProvider$/.test(symbol.name)) continue
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0]
    const parameter = declaration && checker.getTypeOfSymbolAtLocation(symbol, declaration).getCallSignatures()[0]?.parameters[0]
    if (!parameter) continue
    const type = checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration ?? declaration)
    for (const property of type.getProperties()) {
      const native = property.valueDeclaration ?? declaration
      const propType = checker.typeToString(checker.getTypeOfSymbolAtLocation(property, native))
      if (/^on[A-Z]/.test(property.name) || !(/ReactNode|ReactElement|ComponentType/.test(propType) || /^(className|.*ClassName|asChild)$/.test(property.name))) continue
      const point = `${symbol.name}.${property.name}`, proof = customizationProofs[point], reason = nonFunctional[point] ?? excludedCustomizations[point]
      const owner = path.basename(file.fileName, ".tsx")
      custom.push({ owner, point, source: `registry/ui/${owner}.tsx`, declaration: `${point}: ${propType}`, status: reason ? "ok" : proof ? "fixed in E4" : "gap", functional: !reason, proof: reason ?? (proof ? `tests/a11y-tree-customizations.spec.ts: ${proof}` : undefined) })
    }
  }
}
for (const point of ["DataTable.columns.header", "DataTable.columns.cell", "FilterDefinition.render"]) {
  const owner = point.startsWith("DataTable") ? "data-table" : "adapt-filters-dialog", proof = customizationProofs[point]
  custom.push({ owner, point, source: `registry/ui/${owner}.tsx`, declaration: point, status: proof ? "fixed in E4" : "gap", functional: true, proof: proof && `tests/a11y-tree-customizations.spec.ts: ${proof}` })
}

const live = owners.flatMap((file) => read(`registry/ui/${file}`).split("\n").flatMap((line, index) =>
  /aria-live=|role="(?:status|alert)"|\bannounce\(/.test(line)
    ? [{ owner: file.replace(/\.tsx$/, ""), source: `registry/ui/${file}:${index + 1}`, channel: line.trim() }] : []))
const markdown = (value) => String(value).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim()
const table = (headers, items) => `| ${headers.join(" | ")} |\n| ${headers.map(() => "---").join(" | ")} |\n${items.map((item) => `| ${item.map(markdown).join(" | ")} |`).join("\n")}\n`
for (const row of announcements) { row.parityOwner = [...new Set(row.owner.split(",").map(componentOwner))].join(","); row.inventoryStatus = ["ok", "fixed in E4"].includes(row.status) ? "ok" : `owner: ${row.parityOwner}` }
const counts = {}
for (const [category, items] of Object.entries({ accessibleMembers: rows, texts: textRows, announcements, customizations: custom })) for (const row of items) for (const owner of row.owner.split(",")) {
  const count = counts[owner] ??= { accessibleMembers: 0, texts: 0, announcements: 0, customizations: 0, gap: 0, unverified: 0 }
  if (!["ok", "fixed in E4"].includes(row.status)) { count[category]++; count.gap++; if (!row.proof) count.unverified++ }
}
const report = { counts, pinned: { webcomponents: JSON.parse(read("node_modules/@ui5/webcomponents/package.json")).version, fiori: JSON.parse(read("node_modules/@ui5/webcomponents-fiori/package.json")).version }, accessibleMembers: rows, texts: textRows, announcements, customizations: custom, liveRegions: live }
const output = process.argv.includes("--json") ? JSON.stringify(report, null, 2) : `# Accessibility audit — E4 retained-source inventory\n\nGenerated by \`node scripts/a11y-audit.mjs\` from pinned UI5 ${report.pinned.webcomponents}/${report.pinned.fiori}. E4 establishes the infrastructure and ratchets; remaining unverified member/text/channel rows belong to P1–P6. The named E4 repairs and functional customization points carry concrete proofs. A native passthrough candidate is not proof of correct placement, dynamic behavior or fixture coverage. Unverified rows below deliberately remain \`gap\` until individually verified; this generator never promotes a regex match to \`ok\`.\n\n## Accessible members (${rows.length})\n\n${table(["UI5 component.member", "Our equivalent", "Status", "Owning source", "Proof"], rows.map((row) => [`${row.component}.${row.member}`, `registry/ui/${row.owner}.tsx: ${row.equivalent}`, row.status, row.source, row.proof ?? "Unverified"]))}\n## Referenced UI5 i18n text keys (includes accessibility and visible strings) (${textRows.length})\n\n${table(["Owner", "UI5 key", "Equivalent / verification", "Status", "Source"], textRows.map((row) => [row.owner, row.key, row.equivalent, row.status, row.source]))}\n## Native announcement and focus-description channels (${announcements.length})\n\n${table(["Owner", "Native call", "Our equivalent", "Status", "Source", "Proof"], announcements.map((row) => [row.owner, row.native, row.equivalent ?? "Unverified", row.inventoryStatus, row.source, row.proof ?? "Unverified"]))}\n## React live regions (${live.length})\n\n${table(["Owner", "Current channel", "Source"], live.map((row) => [row.owner, row.channel, row.source]))}\n## Customization declarations (${custom.length})\n\nExported signatures are reconciled with the allowed consumer spec. Functional points carry an actual consumer proof; ignored inherited children/host flags and documented implementation helpers are explicitly identified by their owning source.\n\n${table(["Owner", "Declaration", "Status", "Source", "Proof / source classification"], custom.map((row) => [row.owner, row.declaration, row.status, row.source, row.proof ?? "Unverified"]))}\n`
if (process.argv.includes("--check-baseline")) {
  const baseline = JSON.parse(read("tests/a11y-audit-baseline.json"))
  const failures = []
  for (const [component, values] of Object.entries(counts)) for (const [channel, count] of Object.entries(values)) if (count > (baseline.components[component]?.[channel] ?? 0)) failures.push(`${component}.${channel}: ${count} > ${baseline.components[component]?.[channel] ?? 0}`)
  if (failures.length) throw new Error(`Accessibility audit ratchet increased:\n${failures.join("\n")}`)
  console.log("Accessibility audit ratchet: 0 increased counts")
} else if (process.argv.includes("--write-baseline")) {
  const file = "tests/a11y-audit-baseline.json"
  try { read(file); throw new Error("Audit baseline already exists; initial creation is E4-only") } catch (error) { if (error.code !== "ENOENT") throw error }
  writeFileSync(file, JSON.stringify({ version: 1, components: counts }, null, 2) + "\n")
  console.log(JSON.stringify(counts, null, 2))
} else if (process.argv.includes("--json")) process.stdout.write(output + "\n")
else { writeFileSync("docs/plan/a11y-audit.md", output); console.log(`${rows.length} accessible members, ${textRows.length} text keys, ${announcements.length} native channels, ${live.length} React live regions, ${custom.length} customization declarations; unverified rows remain gap`) }
