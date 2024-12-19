import { StorageAdapter } from './storage_adapter'

/**
 * Adapter for managing data persistence using IndexedDB.
 * This adapter extends the `StorageAdapter` class and provides
 * methods to interact with IndexedDB for storing and retrieving data.
 */
export class IndexedDBAdapter extends StorageAdapter {
  private readonly dbName: string
  private readonly storeName: string
  private db: IDBDatabase | null = null

  /**
   * Creates an instance of IndexedDBAdapter.
   *
   * @param {string} [dbName='cacheDB'] - The name of the database.
   * @param {string} [storeName='cacheStore'] - The name of the object store.
   */
  constructor(dbName: string = 'cacheDB', storeName: string = 'cacheStore') {
    super()
    this.dbName = dbName
    this.storeName = storeName
  }

  /**
   * Connects the adapter by initializing the database and object store if they do not exist.
   *
   * @returns {Promise<void>} A promise that resolves once the connection is ready.
   */
  async connect(): Promise<void> {
    return await new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' })
        }
      }

      request.onsuccess = (event: Event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Adds a key-value pair to the object store.
   *
   * @param {string} key - The key associated with the value.
   * @param {unknown} value - The value to store.
   * @returns {Promise<void>} A promise that resolves once the data is stored.
   */
  async add(key: string, value: unknown): Promise<void> {
    await this._withTransaction('readwrite', (store) => store.put({ key, value }))
  }

  /**
   * Retrieves a value associated with a given key from the object store.
   *
   * @param {string} key - The key to retrieve.
   * @returns {Promise<unknown | null>} A promise resolving to the value, or null if the key doesn't exist.
   */
  async get(key: string): Promise<unknown | null> {
    return await this._withTransaction<unknown | null>('readonly', async (store) => {
      const request = store.get(key)
      return await this._promisifyRequest(request).then((result) =>
        result ? (result as { key: string, value: unknown }).value : null
      )
    })
  }

  /**
   * Retrieves all key-value pairs from the object store.
   *
   * @returns {Promise<Record<string, unknown>>} A promise resolving to an object containing all stored data.
   */
  async getAll(): Promise<Record<string, unknown>> {
    return await this._withTransaction<Record<string, unknown>>('readonly', async (store) => {
      const request = store.getAll()
      return await this._promisifyRequest(request).then((results) => {
        const data: Record<string, unknown> = {}
        for (const item of results as Array<{ key: string, value: unknown }>) {
          data[item.key] = item.value
        }
        return data
      })
    })
  }

  /**
   * Deletes a specific key and its associated value from the object store.
   *
   * @param {string} key - The key to delete.
   * @returns {Promise<void>} A promise that resolves once the key is deleted.
   */
  async delete(key: string): Promise<void> {
    await this._withTransaction('readwrite', (store) => store.delete(key))
  }

  /**
   * Clears all data from the object store.
   *
   * @returns {Promise<void>} A promise that resolves once the data is cleared.
   */
  async clear(): Promise<void> {
    await this._withTransaction('readwrite', (store) => store.clear())
  }

  /**
   * Handles transactions for interacting with the object store.
   *
   * @private
   * @template T
   * @param {IDBTransactionMode} mode - The transaction mode (e.g., 'readonly', 'readwrite').
   * @param {(store: IDBObjectStore) => IDBRequest | Promise<T>} callback - A callback function to perform operations within the transaction.
   * @returns {Promise<T>} A promise resolving to the result of the transaction.
   */
  private async _withTransaction<T>(
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => IDBRequest | Promise<T>
  ): Promise<T> {
    if (this.db == null) throw new Error('IndexedDB is not connected')
    const transaction = this.db.transaction([this.storeName], mode)
    const store = transaction.objectStore(this.storeName)
    const result = callback(store)
    return result instanceof IDBRequest ? await this._promisifyRequest(result) : await result
  }

  /**
   * Converts an IndexedDB request into a Promise.
   *
   * @private
   * @template T
   * @param {IDBRequest} request - The IndexedDB request to promisify.
   * @returns {Promise<T>} A promise resolving to the request result.
   */
  private async _promisifyRequest<T>(request: IDBRequest): Promise<T> {
    return await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T)
      request.onerror = () => reject(request.error)
    })
  }
}
