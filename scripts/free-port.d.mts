export function reservePort(variable: string, explicit: string | undefined, base: number): Promise<{ port: number; release(): void }>
