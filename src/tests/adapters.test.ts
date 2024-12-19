/**
 * @jest-environment jsdom
 */
import { LRUCache } from '../index'
import { LocalStorageAdapter } from '../index'

describe('LRUCache with LocalStorageAdapter', () => {
  let cache: LRUCache<string>
  let localStorageAdapter: LocalStorageAdapter
  const storeName = 'cache-local-storage'

  beforeEach(() => {
    localStorage.clear()

    localStorageAdapter = new LocalStorageAdapter(storeName)
    cache = LRUCache.getInstance<string>(3, localStorageAdapter)
  })

  test('should localStorage work correctly on jsdom', () => {
    localStorage.setItem('testKey', 'testValue')
    const value = localStorage.getItem('testKey')
    expect(value).toBe('testValue')
  })

  test('should add and get elements correctly', async () => {
    cache.put('key1', 'value1')
    cache.put('key2', 'value2')
    const value1 = cache.get('key1')
    const value2 = cache.get('key2')

    expect(value1).toBe('value1')
    expect(value2).toBe('value2')
  })

  test('should evict elements correctly', async () => {
    cache.put('key1', 'value1')
    cache.put('key2', 'value2')
    cache.put('key3', 'value3')

    cache.put('key4', 'value4')

    expect(cache.get('key1')).toBeUndefined()
    expect(cache.get('key2')).toBe('value2')
    expect(cache.get('key3')).toBe('value3')
    expect(cache.get('key4')).toBe('value4')
  })

  test('should handle ttl correctly', async () => {
    cache.put('key1', 'value1', 100) // TTL de 100ms

    expect(cache.get('key1')).toBe('value1')

    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(cache.get('key1')).toBeUndefined()
  })

  test('should persist elements in localStorage', async () => {
    await cache.put('key1', 'value1')

    const storedData = JSON.parse(localStorage.getItem(storeName) || '{}')
    expect(storedData).not.toBeNull()
    expect(storedData.key1).toEqual('value1')
  })

  test('should clean cache correctly', () => {
    cache.put('key1', 'value1')
    cache.put('key2', 'value2')

    cache.clear()

    expect(cache.get('key1')).toBeUndefined()
    expect(cache.get('key2')).toBeUndefined()
    expect(localStorage.getItem(storeName)).toBeNull()
  })
})
