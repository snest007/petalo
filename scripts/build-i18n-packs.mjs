// Optional SAP translations. No timestamps; sorted language IDs, keys and deterministic source fallbacks.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs'
import { audit, defaults, properties } from './i18n-audit.mjs'
const keys = [...new Set(audit.flatMap(group => group.rows.filter(row => row.source === 'wcr' || row.status === 'ok' || row.status === 'fixed in E5').map(row => row.key)))].sort()
const source = 'node_modules/@ui5/webcomponents/dist/generated/assets/i18n'
const wcrSource = 'node_modules/@ui5/webcomponents-react/dist/assets/i18n'
const languageMap = { iw: 'he', sh: 'sr-Latn', cnr: 'sr-ME', no: 'nb', zh_CN: 'zh-CN', zh_TW: 'zh-TW', pt: 'pt-BR' }
mkdirSync('registry/i18n', { recursive: true })
const items = []
for (const file of readdirSync(source).filter(file => /^messagebundle_.*\.json$/.test(file) && !/en_US_sap/.test(file)).sort()) {
  const lang = file.slice('messagebundle_'.length, -5), tag = languageMap[lang] ?? lang.replaceAll('_', '-')
  const table = { ...defaults }
  for (const pkg of ['sap.m', 'sap.ui.mdc', 'sap.ui.core', 'sap.ui.layout', 'sap.ui.fl']) {
    const path = `node_modules/@openui5/${pkg}/src/${pkg.replaceAll('.', '/')}/messagebundle_${lang}.properties`
    if (existsSync(path)) Object.assign(table, properties(readFileSync(path, 'utf8')))
  }
  for (const pkg of ['webcomponents', 'webcomponents-fiori']) {
    const path = `node_modules/@ui5/${pkg}/dist/generated/assets/i18n/messagebundle_${lang}.json`
    if (existsSync(path)) Object.assign(table, JSON.parse(readFileSync(path, 'utf8')))
  }
  const wcrPath = `${wcrSource}/${file}`
  if (existsSync(wcrPath)) {
    const translated = JSON.parse(readFileSync(wcrPath, 'utf8'))
    for (const [key, value] of Object.entries(translated)) table[`wcr:${key}`] = value
  }
  const pack = Object.fromEntries(keys.map(key => [key, table[key] ?? defaults[key] ?? key]))
  const json = JSON.stringify(pack, null, 2) + '\n'
  writeFileSync(`registry/i18n/${tag}.json`, json)
  writeFileSync(`registry/i18n/${tag}.ts`, `// SAP SE UI5 translations; Apache-2.0. See NOTICE. Generated; do not edit.\nimport type { FioriTexts } from "@/lib/fiori-locale"\n\nconst texts = ${json.trim()} satisfies FioriTexts\nexport default texts\nexport { texts }\n`)
  items.push({ name: `i18n-${tag}`, type: 'registry:lib', title: `SAP translations (${tag})`, description: 'Optional SAP UI5 language pack for FioriLocaleProvider.', registryDependencies: ['@petalo/locale'], files: [{ path: `registry/i18n/${tag}.ts`, type: 'registry:lib', target: `lib/fiori-i18n/${tag}.ts` }] })
}
writeFileSync('registry/i18n/registry-items.json', JSON.stringify(items, null, 2) + '\n')
console.log(`i18n packs: ${items.length} languages, ${keys.length} audited keys per pack`)
