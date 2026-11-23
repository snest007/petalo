export declare const isBookkeeping: (file: string) => boolean
export declare const isInventory: (file: string) => boolean
export declare const inventorySpecs: string[]
export declare function ownedComponent(file: string): string | undefined
export declare function classifyChanges(changed: string[], added: string[], exists: (path: string) => boolean): {
  bookkeepingOnly: boolean
  names: Set<string>
  specs: Set<string>
  storySpecs: Set<string>
  shared: string[]
  inventory: string[]
  newComponents: string[]
}
