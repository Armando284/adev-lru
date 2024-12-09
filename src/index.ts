import { LinkedNode } from "./interfaces";
import { isLocalhost } from "./utils";

export default class LRUCache<T> {
  private static instance: LRUCache<any>;
  private readonly capacity: number;
  private readonly hash: Map<string, LinkedNode<T>>;
  private head?: LinkedNode<T>;
  private tail?: LinkedNode<T>;

  private hitCount: number;
  private missCount: number;
  private evictionCount: number;

  private constructor(capacity: number) {
    this.capacity = capacity;
    this.hash = new Map();
    this.head = this.tail = undefined;

    if (isLocalhost()) {
      (window as any).debugLRU = this.debugLRU.bind(this);
    }

    this.hitCount = this.missCount = this.evictionCount = 0;
  }

  public static getInstance<T>(capacity: number = 10): LRUCache<T> {
    if (!LRUCache.instance) {
      LRUCache.instance = new LRUCache<T>(capacity);
    }
    return LRUCache.instance;
  }

  public put(key: string, value: T, ttl: number = 60_000): LRUCache<T> {
    const now = Date.now()
    let node = this.hash.get(key);
    if (node) {
      this.evict(node);
    }

    node = this.prepend(key, value, now + ttl);
    this.hash.set(key, node);
    if (this.hash.size > this.capacity) {
      const tailNode = this.pop();
      if (tailNode) {
        this.hash.delete(tailNode.key);
        this.evictionCount++;
      }
    }

    return this;
  }

  public get(key: string): T | undefined {
    const node = this.hash.get(key);
    if (!node) {
      this.missCount++;
      return undefined;
    }

    this.evict(node);

    const now = Date.now()
    if (node.ttl < now) {
      this.missCount++;
      return undefined
    }

    this.prepend(node.key, node.value, node.ttl);
    this.hitCount++;
    return node.value;
  }

  public clear(): void {
    this.hash.clear()
    this.head = this.tail = undefined
  }

  private prepend(key: string, value: T, ttl: number): LinkedNode<T> {
    const node: LinkedNode<T> = { key, value, ttl };
    this.hash.set(key, node);

    if (!this.head) {
      this.head = this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }

    return node;
  }

  private pop(): LinkedNode<T> | undefined {
    const node = this.tail;
    if (!node) return;

    if (this.tail && this.tail.prev) {
      this.tail.prev.next = undefined;
      this.tail = this.tail.prev;
    } else {
      this.head = this.tail = undefined;
    }

    node.prev = undefined;
    return node;
  }

  private evict(node: LinkedNode<T>): void {
    if (node.prev !== undefined) node.prev.next = node.next;
    if (node.next !== undefined) node.next.prev = node.prev;
    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;
    node.next = node.prev = undefined
    this.hash.delete(node.key)
  }

  private getHitRate(): number {
    const totalRequests = this.hitCount + this.missCount;
    return totalRequests === 0 ? 0 : this.hitCount / totalRequests;
  }

  private getMissRate(): number {
    const totalRequests = this.hitCount + this.missCount;
    return totalRequests === 0 ? 0 : this.missCount / totalRequests;
  }

  private getEvictionRate(): number {
    const totalRequests = this.hitCount + this.missCount;
    return totalRequests === 0 ? 0 : this.evictionCount / totalRequests;
  }

  public clearMetrics(): void {
    this.hitCount = this.missCount = this.evictionCount = 0
  }

  public logMetrics(): void {
    console.log(`Hit rate: ${this.getHitRate()}`);
    console.log(`Miss rate: ${this.getMissRate()}`);
    console.log(`Eviction rate: ${this.getEvictionRate()}`);
  }

  public debugLRU(): void {
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