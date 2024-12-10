import LRUCache from '../index';

describe('LRUCache Tests', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = LRUCache.getInstance<string>(3); // Reiniciamos el singleton con capacidad 3
    cache.clear(); // Aseguramos un estado limpio
  });

  test('should store and retrieve a value', () => {
    cache.put('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  test('should return undefined for a missing key', () => {
    expect(cache.get('missing')).toBeUndefined();
  });

  test('should evict least recently used item when capacity is exceeded', () => {
    cache.put('key1', 'value1');
    cache.put('key2', 'value2');
    cache.put('key3', 'value3');
    cache.put('key4', 'value4'); // Evict key1

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key4')).toBe('value4');
  });

  test('should update an existing key and move it to the head', () => {
    cache.put('key1', 'value1');
    cache.put('key2', 'value2');
    cache.put('key1', 'newValue1'); // Update key1

    expect(cache.get('key1')).toBe('newValue1');
    cache.put('key3', 'value3');
    cache.put('key4', 'value4'); // Evict key2

    expect(cache.get('key2')).toBeUndefined(); // key2 was evicted
  });

  test('should respect TTL and expire items', () => {
    jest.useFakeTimers();

    cache.put('key1', 'value1', 1000); // TTL 1 second
    jest.advanceTimersByTime(500); // Halfway, key1 should still be valid
    expect(cache.get('key1')).toBe('value1');

    jest.advanceTimersByTime(600); // Past TTL, key1 should expire
    expect(cache.get('key1')).toBeUndefined();

    jest.useRealTimers();
  });

  test('should clear all items', () => {
    cache.put('key1', 'value1');
    cache.put('key2', 'value2');
    cache.clear();

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBeUndefined();
  });

  test('should track hit and miss metrics correctly', () => {
    cache.put('key1', 'value1');
    cache.put('key2', 'value2');

    cache.get('key1'); // Hit
    cache.get('key2'); // Hit
    cache.get('key3'); // Miss

    cache.logMetrics();

    // Assuming logMetrics prints the metrics, we can mock console.log to verify
    const logSpy = jest.spyOn(console, 'log');
    cache.logMetrics();

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Hit rate: 0.6666')); // 2/3
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Miss rate: 0.3333')); // 1/3

    logSpy.mockRestore();
  });

  test('should debug cache structure correctly', () => {
    const debugSpy = jest.spyOn(console, 'log');

    cache.put('key1', 'value1');
    cache.put('key2', 'value2');
    cache.debugLRU();

    expect(debugSpy).toHaveBeenCalledWith('DEBUG LRU CACHE ⚡');
    expect(debugSpy).toHaveBeenCalledWith(expect.any(Number), expect.objectContaining({ key: 'key1', value: 'value1' }));
    expect(debugSpy).toHaveBeenCalledWith('Hash Table: ', expect.any(Map));

    debugSpy.mockRestore();
  });
});
