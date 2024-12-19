import { StorageAdapter } from './storage_adapter'

/**
 * Adapter for managing data persistence using localStorage.
 * This adapter extends the base `StorageAdapter` class and provides
 * methods to interact with the localStorage API.
 */
export class LocalStorageAdapter extends StorageAdapter {
  private readonly storageKey: string

  /**
   * Creates an instance of LocalStorageAdapter.
   *
   * @param {string} [storageKey='cache-local-storage'] - The key used to store data in localStorage.
   */
  constructor (storageKey: string = 'cache-local-storage') {
    super()
    this.storageKey = storageKey
  }

  /**
   * Connects the adapter by initializing the localStorage space if it doesn't already exist.
   *
   * @returns {Promise<void>} A promise that resolves once the connection is ready.
   */
  async connect (): Promise<void> {
    if (localStorage.getItem(this.storageKey) == null) {
      localStorage.setItem(this.storageKey, JSON.stringify({}))
    }
    console.log(`Connected to localStorage with key: ${this.storageKey}`)
  }

  /**
   * Adds a key-value pair to the localStorage data.
   *
   * @param {string} key - The key associated with the value.
   * @param {unknown} value - The value to store.
   * @returns {Promise<void>} A promise that resolves once the data is stored.
   */
  async add (key: string, value: unknown): Promise<void> {
    const storageData = await this.getAll()
    storageData[key] = value
    this._setStorageData(storageData)
  }

  /**
   * Retrieves a value associated with a given key from localStorage.
   *
   * @param {string} key - The key to retrieve.
   * @returns {Promise<unknown | null>} A promise resolving to the value, or null if the key doesn't exist.
   */
  async get (key: string): Promise<unknown | null> {
    const storageData = await this.getAll()
    return storageData[key] !== undefined ? storageData[key] : null
  }

  /**
   * Retrieves all data stored in localStorage under the adapter's key.
   *
   * @returns {Promise<Record<string, unknown>>} A promise resolving to an object containing all stored data.
   */
  async getAll (): Promise<Record<string, unknown>> {
    const data = localStorage.getItem(this.storageKey)
    return data != null ? JSON.parse(data) : {}
  }

  /**
   * Deletes a specific key and its associated value from localStorage.
   *
   * @param {string} key - The key to delete.
   * @returns {Promise<void>} A promise that resolves once the key is deleted.
   */
  async delete (key: string): Promise<void> {
    const storageData = await this.getAll()
    if (key in storageData) {
      /* eslint-disable */
      delete storageData[key]
      /* eslint-enable */
      this._setStorageData(storageData)
    }
  }

  /**
   * Clears all data stored under the adapter's key in localStorage.
   *
   * @returns {Promise<void>} A promise that resolves once the data is cleared.
   */
  async clear (): Promise<void> {
    localStorage.removeItem(this.storageKey)
  }

  /**
   * Sets the data in localStorage under the adapter's key.
   *
   * @private
   * @param {Record<string, unknown>} data - The data to store.
   */
  private _setStorageData (data: Record<string, unknown>): void {
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }
}
