import { LRUCache } from '../index'

describe('LRUCache Tests', () => {
  let cache: LRUCache<string>

  beforeEach(() => {
    cache = LRUCache.getInstance<string>(3)
    cache.clear()
  })

  test('should store and retrieve a value', () => {
    cache.put('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
  })

  test('should return undefined for a missing key', () => {
    expect(cache.get('missing')).toBeUndefined()
  })

  test('should evict least recently used item when capacity is exceeded', () => {
    cache.put('key1', 'value1')
    cache.put('key2', 'value2')
    cache.put('key3', 'value3')
    cache.put('key4', 'value4')

    expect(cache.get('key1')).toBeUndefined()
    expect(cache.get('key2')).toBe('value2')
    expect(cache.get('key4')).toBe('value4')
  })

  test('should update an existing key and move it to the head', () => {
    cache.put('key1', 'value1')
    cache.put('key2', 'value2')
    cache.put('key1', 'newValue1')

    expect(cache.get('key1')).toBe('newValue1')
    cache.put('key3', 'value3')
    cache.put('key4', 'value4')

    expect(cache.get('key2')).toBeUndefined()
  })

  test('should respect TTL and expire items', () => {
    jest.useFakeTimers()

    cache.put('key1', 'value1', 1000)
    jest.advanceTimersByTime(500)
    expect(cache.get('key1')).toBe('value1')

    jest.advanceTimersByTime(600)
    expect(cache.get('key1')).toBeUndefined()

    jest.useRealTimers()
  })

  test('should clear all items', () => {
    cache.put('key1', 'value1')
    cache.put('key2', 'value2')
    cache.clear()

    expect(cache.get('key1')).toBeUndefined()
    expect(cache.get('key2')).toBeUndefined()
  })

  test('should track hit and miss metrics correctly', () => {
    cache.put('key1', 'value1')
    cache.put('key2', 'value2')

    cache.get('key1') // Hit
    cache.get('key2') // Hit
    cache.get('key3') // Miss

    cache.logMetrics()

    // Assuming logMetrics prints the metrics, we can mock console.log to verify
    const logSpy = jest.spyOn(console, 'log')
    cache.logMetrics()

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Hit rate: 0.6666')) // 2/3
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Miss rate: 0.3333')) // 1/3

    logSpy.mockRestore()
  })

  test('should debug cache structure correctly', () => {
    const debugSpy = jest.spyOn(console, 'log')

    cache.put('key1', 'value1')
    cache.put('key2', 'value2')
    cache.debugLRU()

    expect(debugSpy).toHaveBeenCalledWith('DEBUG LRU CACHE ⚡')
    expect(debugSpy).toHaveBeenCalledWith(expect.any(Number), expect.objectContaining({ key: 'key1', value: 'value1' }))
    expect(debugSpy).toHaveBeenCalledWith('Hash Table: ', expect.any(Map))

    debugSpy.mockRestore()
  })

  test('getOption should return Option.some when the key exists and is not expired', () => {
    const key = 'testKey'
    const value = 'testValue'

    const ttl = Date.now() + 1000
    cache.put(key, value, ttl)

    const result = cache.getOption(key)

    expect(result.isSome()).toBe(true)
    expect(result.getOrElse('defaultValue')).toBe(value)
  })

  test('getOption should return Option.none when the key does not exist or is expired', () => {
    const key = 'missingKey'

    let result = cache.getOption(key)
    expect(result.isNone()).toBe(true)

    const expiredKey = 'expiredKey'
    const expiredValue = 'expiredValue'
    const ttl = -1000
    cache.put(expiredKey, expiredValue, ttl)

    result = cache.getOption(expiredKey)

    expect(result.isNone()).toBe(true)
  })
})
