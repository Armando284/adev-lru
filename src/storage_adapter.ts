export abstract class StorageAdapter {
  abstract connect (): Promise<void>
  abstract add (key: string, value: unknown): Promise<void>
  abstract get (key: string): Promise<unknown | null>
  abstract getAll (): Promise<Record<string, unknown>>
  abstract delete (key: string): Promise<void>
  abstract clear (): Promise<void>
}
