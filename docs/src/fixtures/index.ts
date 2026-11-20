// Collects every docs/src/fixtures/<component>.tsx. Adding a component = adding its two fixture files.
import type { FixtureSet } from "../fixture-types"

const modules = import.meta.glob<{ default: FixtureSet }>(["./*.tsx", "!./*.wcr.tsx", "!./*.cases.tsx"], { eager: true })

export const fixtureSets: FixtureSet[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.name.localeCompare(b.name))
