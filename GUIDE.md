# Build Your Own LRU Cache in TypeScript

This guide provides a step-by-step process to build an **LRU (Least Recently Used) Cache** in TypeScript. It explains the logic and implementation of each part to ensure a deep understanding.

---

## What Is an LRU Cache?

An **LRU Cache** is a data structure that holds a fixed number of key-value pairs, removing the least recently used item when the cache exceeds its capacity. It’s widely used in systems where memory or storage needs to be optimized, such as:

- Web browser caching
- Database query results
- Content delivery networks (CDNs)

---

## Overview of Data Structures Used

1. **Hash Map**: For O(1) access to cache items by their keys.
2. **Doubly Linked List**: To efficiently track the order of usage and manage cache eviction.

By combining these two, we achieve an efficient cache where insertions, deletions, and lookups operate in O(1) time.

---

## Step-by-Step Implementation

### 1. Setting Up

First, create your project directory and initialize it with TypeScript and Jest for testing. Follow the setup described earlier.

---

### 2. Designing the `LinkedNode` Interface

This interface represents the building blocks of the linked list. Each node stores:
- `key` (string): The identifier for a cached item.
- `value` (generic type `T`): The stored data.
- `ttl` (number): Time-to-live for expiration.
- `next` and `prev` (optional references): To navigate the linked list.

#### Code:
```typescript
export interface LinkedNode<T> {
  key: string;
  value: T;
  ttl: number;
  next?: LinkedNode<T>;
  prev?: LinkedNode<T>;
}
```

---

### 3. Implementing the `LRUCache` Class

The `LRUCache` class combines a hash map and a doubly linked list to manage cached items efficiently.

#### 3.1 Constructor

The constructor initializes:
- The maximum `capacity` of the cache.
- A `hash` map for quick key-based lookups.
- References to the `head` and `tail` of the linked list for tracking usage order.

#### Code:
```typescript
private constructor(capacity: number) {
  this.capacity = capacity;
  this.hash = new Map();
}
```

---

#### 3.2 Singleton Design Pattern (Optional)

Using a singleton ensures that only one instance of the cache exists.

#### Code:
```typescript
public static getInstance<T>(capacity: number = 10): LRUCache<T> {
  if (!LRUCache.instance) {
    LRUCache.instance = new LRUCache<T>(capacity);
  }
  return LRUCache.instance;
}
```

---

#### 3.3 The `put` Method

The `put` method:
1. Checks if the key already exists. If so, it removes the old node.
2. Creates a new node and adds it to the front of the list (most recently used).
3. Removes the least recently used item if the cache exceeds capacity.

**Why Evict?**  
Eviction ensures the cache never exceeds its fixed size, preserving performance and memory efficiency.

#### Code:
```typescript
public put(key: string, value: T, ttl: number = 60000): void {
  const now = Date.now();
  if (this.hash.has(key)) {
    this.evict(this.hash.get(key)!);
  }

  const node: LinkedNode<T> = { key, value, ttl: now + ttl };
  this.hash.set(key, node);

  if (!this.head) {
    this.head = this.tail = node;
  } else {
    node.next = this.head;
    this.head.prev = node;
    this.head = node;
  }

  if (this.hash.size > this.capacity) {
    const removed = this.tail!;
    this.hash.delete(removed.key);
    if (removed.prev) {
      removed.prev.next = undefined;
      this.tail = removed.prev;
    } else {
      this.head = this.tail = undefined;
    }
  }
}
```

---

#### 3.4 The `get` Method

The `get` method retrieves a value by its key:
1. Checks if the key exists or if the entry has expired (TTL).
2. Moves the accessed node to the front of the list to mark it as recently used.

**Why Reorder?**  
Reordering ensures that the accessed node is considered "most recently used," maintaining the correct eviction order.

#### Code:
```typescript
public get(key: string): T | undefined {
  const now = Date.now();
  const node = this.hash.get(key);

  if (!node || node.ttl < now) {
    this.hash.delete(key);
    return undefined;
  }

  this.evict(node);
  this.prepend(node);
  return node.value;
}
```

---

#### 3.5 Helper Methods

1. **`evict`**  
   Removes a node from the linked list.

2. **`prepend`**  
   Adds a node to the front of the linked list.

**Why Separate Eviction and Prepend?**  
This modularity simplifies code reuse and debugging.

#### Code:
```typescript
private evict(node: LinkedNode<T>): void {
  if (node.prev) node.prev.next = node.next;
  if (node.next) node.next.prev = node.prev;
  if (node === this.head) this.head = node.next;
  if (node === this.tail) this.tail = node.prev;
  node.prev = node.next = undefined;
}

private prepend(node: LinkedNode<T>): void {
  node.next = this.head;
  if (this.head) this.head.prev = node;
  this.head = node;
  if (!this.tail) this.tail = node;
}
```

---

### 4. Writing Unit Tests

Test your cache implementation with edge cases, TTLs, and eviction. Example test cases:
```typescript
import LRUCache from "../src/LRUCache";

describe("LRUCache", () => {
  it("should store and retrieve values", () => {
    const cache = LRUCache.getInstance<number>(3);
    cache.put("a", 1);
    expect(cache.get("a")).toBe(1);
  });

  it("should evict least recently used items", () => {
    const cache = LRUCache.getInstance<number>(2);
    cache.put("a", 1);
    cache.put("b", 2);
    cache.put("c", 3); // 'a' should be evicted
    expect(cache.get("a")).toBeUndefined();
  });
});
```

---

### 5. Running and Building the Project

1. Compile the TypeScript code:
   ```bash
   npx tsc
   ```

2. Run the tests:
   ```bash
   npx jest
   ```

3. Build for production:
   ```bash
   npx tsc --declaration
   ```

---

## What’s Next?

You now have a fully functional LRU Cache! Expand its capabilities by:
- Adding a `delete` method for manual eviction.
- Making the TTL configurable per cache instance.
- Optimizing for multi-threaded environments.

