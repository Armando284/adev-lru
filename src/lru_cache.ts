import { LinkedNode } from './interfaces'
import { Option } from 'adev-monads'

/**
 * @template T
 * @description Implements an LRU (Least Recently Used) Cache with TTL (Time-to-Live) support.
 * Allows for efficient storage and retrieval of key-value pairs.
 */
export class LRUCache<T> {
  private static instance: LRUCache<any>
  private readonly capacity: number
  private readonly hash: Map<string, LinkedNode<T>>
  private head?: LinkedNode<T>
  private tail?: LinkedNode<T>

  private hitCount: number
  private missCount: number
  private evictionCount: number

  private constructor (capacity: number) {
    this.capacity = capacity
    this.hash = new Map()
    this.head = this.tail = undefined;

    (globalThis as any).debugLRU = this.debugLRU.bind(this)

    this.hitCount = this.missCount = this.evictionCount = 0
  }

  /**
   * Creates or retrieves the singleton instance of the LRU cache.
   * @template T
   * @param {number} [capacity=10] - Maximum capacity of the cache.
   * @returns {LRUCache<T>} The singleton instance of the cache.
   */
  public static getInstance<T>(capacity: number = 10): LRUCache<T> {
    if (LRUCache.instance == null) {
      LRUCache.instance = new LRUCache<T>(capacity)
    }
    return LRUCache.instance
  }

  /**
   * Inserts or updates an item in the cache.
   * If the key already exists, it updates its value and moves it to the head.
   * If the cache exceeds capacity, the least recently used item is evicted.
   * @param {string} key - The key associated with the value.
   * @param {T} value - The value to store in the cache.
   * @param {number} [ttl=60000] - Time-to-Live in milliseconds for the item.
   * @returns {LRUCache<T>} The current cache instance for chaining.
   */
  public put (key: string, value: T, ttl: number = 60_000): LRUCache<T> {
    const now = Date.now()
    let node = this.hash.get(key)
    if (node != null) {
      this.evict(node)
    }

    node = this.prepend(key, value, now + ttl)
    this.hash.set(key, node)
    if (this.hash.size > this.capacity) {
      const tailNode = this.pop()
      if (tailNode != null) {
        this.hash.delete(tailNode.key)
        this.evictionCount++
      }
    }

    return this
  }

  /**
   * Retrieves an item from the cache by key.
   * If the item has expired, it returns undefined and counts as a miss.
   * @param {string} key - The key to search for.
   * @returns {T | undefined} The value associated with the key, or undefined if not found or expired.
   */
  public get (key: string): T | undefined {
    const node = this.hash.get(key)
    const now = Date.now()
    if (node == null || node.ttl < now) {
      this.missCount++
      return undefined
    }

    this.evict(node)

    this.prepend(node.key, node.value, node.ttl)
    this.hitCount++
    return node.value
  }

  /**
 * Retrieves an item from the cache by key, wrapped in an Option monad.
 * If the item has expired, it returns an Option.None and counts as a miss.
 *
 * This method provides a functional approach to handle the absence of values,
 * allowing the caller to use methods like `map`, `filter`, and `getOrElse`
 * to safely work with the result.
 *
 * @param {string} key - The key to search for.
 * @returns {Option<T>} An Option.Some containing the value if found and valid,
 *                      or Option.None if not found or expired.
 */
  public getOption (key: string): Option<T> {
    const node = this.hash.get(key)
    const now = Date.now()
    if (node == null || node.ttl < now) {
      this.missCount++
      return Option.none()
    }

    this.evict(node)

    this.prepend(node.key, node.value, node.ttl)
    this.hitCount++
    return Option.some(node.value)
  }

  /**
   * Clears all items from the cache.
   */
  public clear (): void {
    this.hash.clear()
    this.head = this.tail = undefined
    this.clearMetrics()
  }

  private prepend (key: string, value: T, ttl: number): LinkedNode<T> {
    const node: LinkedNode<T> = { key, value, ttl }
    this.hash.set(key, node)

    if (this.head == null) {
      this.head = this.tail = node
    } else {
      node.next = this.head
      this.head.prev = node
      this.head = node
    }

    return node
  }

  private pop (): LinkedNode<T> | undefined {
    const node = this.tail
    if (node == null) return

    if (this.tail?.prev != null) {
      this.tail.prev.next = undefined
      this.tail = this.tail.prev
    } else {
      this.head = this.tail = undefined
    }

    node.prev = undefined
    return node
  }

  private evict (node: LinkedNode<T>): void {
    if (node.prev !== undefined) node.prev.next = node.next
    if (node.next !== undefined) node.next.prev = node.prev
    if (node === this.head) this.head = node.next
    if (node === this.tail) this.tail = node.prev
    node.next = node.prev = undefined
    this.hash.delete(node.key)
  }

  private getHitRate (): number {
    const totalRequests = this.hitCount + this.missCount
    return totalRequests === 0 ? 0 : this.hitCount / totalRequests
  }

  private getMissRate (): number {
    const totalRequests = this.hitCount + this.missCount
    return totalRequests === 0 ? 0 : this.missCount / totalRequests
  }

  private getEvictionRate (): number {
    const totalRequests = this.hitCount + this.missCount
    return totalRequests === 0 ? 0 : this.evictionCount / totalRequests
  }

  /**
   * Resets cache performance metrics.
   */
  public clearMetrics (): void {
    this.hitCount = this.missCount = this.evictionCount = 0
  }

  /**
   * Logs cache performance metrics to the console.
   * Includes hit rate, miss rate, and eviction rate.
   */
  public logMetrics (): void {
    console.log(`Hit rate: ${this.getHitRate()}`)
    console.log(`Miss rate: ${this.getMissRate()}`)
    console.log(`Eviction rate: ${this.getEvictionRate()}`)
  }

  /**
   * Logs debugging information about the cache to the console.
   * Includes the current state of the linked list and the hash map.
   */
  public debugLRU (): void {
    console.log('DEBUG LRU CACHE ⚡')
    let node: LinkedNode<T> | undefined = this.head
    for (let i = 0; node !== undefined && i < this.capacity; i++) {
      console.log(i, node)
      node = node.next
    }
    console.log('Hash Table: ', this.hash)
    this.logMetrics()
    console.log('Done!')
  }
}
