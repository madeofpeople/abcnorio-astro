const MAX_ENTRIES = 200;
const runtimeCache = new Map();

/**
 * Small in-process TTL cache for SSR helpers.
 *
 * This is process-local and intentionally minimal.
 */
export async function getOrSetRuntimeCache(key, ttlMs, loader) {
  const now = Date.now();
  const cached = runtimeCache.get(key);

  if (cached?.value !== undefined && cached.expiresAt > now) {
    return cached.value;
  }

  if (cached?.pending) {
    return cached.pending;
  }

  const pending = (async () => {
    try {
      const value = await loader();
      if (runtimeCache.size >= MAX_ENTRIES) {
        runtimeCache.delete(runtimeCache.keys().next().value);
      }
      runtimeCache.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      });

      return value;
    } catch (error) {
      runtimeCache.delete(key);
      throw error;
    }
  })();

  runtimeCache.set(key, {
    pending,
    expiresAt: now + ttlMs,
  });

  return pending;
}
