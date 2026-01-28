type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

function now() {
  return Date.now();
}

function isFresh(entry?: CacheEntry<unknown>) {
  return !!entry && entry.expiresAt > now();
}

export function makeCacheKey(parts: Array<string | number | boolean | null | undefined>) {
  return parts
    .filter((p) => p !== undefined && p !== null)
    .map((p) => String(p))
    .join('::');
}

export async function withCache<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const existing = cache.get(key);
  if (isFresh(existing)) {
    return existing!.value as T;
  }

  const value = await fetcher();
  cache.set(key, { value, expiresAt: now() + ttlMs });
  return value;
}


