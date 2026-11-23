export declare const isBookkeeping: (file: string) => boolean
export declare const isInventory: (file: string) => boolean
export declare const inventorySpecs: string[]
export declare function ownedComponent(file: string): string | undefined
export declare function componentFixtureFiles(name: string): string[]
export declare function componentVisualSpecs(name: string, exists: (path: string) => boolean, interactionSource: string): string[]
export declare function registrationOwnerProblems(components: string[], fixtures?: { id: string; file: string }[]): string[]
export declare function auditFailure(script: string, result: import("node:child_process").SpawnSyncReturns<string>): string | undefined
export declare function classifyChanges(changed: string[], added: string[], exists: (path: string) => boolean): {
  bookkeepingOnly: boolean
  names: Set<string>
  specs: Set<string>
  storySpecs: Set<string>
  shared: string[]
  inventory: string[]
  newComponents: string[]
}
