const CACHE_TTL = 5 * 60 * 1000;
const requestCache = new Map();

export function getCachedRequest(key, url) {
  const now = Date.now();
  const cached = requestCache.get(key);

  if (cached && cached.expiresAt > now) {
    cached.consumers += 1;
    return { promise: cached.promise, release: () => releaseRequest(key, cached) };
  }

  if (cached) requestCache.delete(key);

  const controller = new AbortController();
  const entry = {
    controller,
    consumers: 1,
    expiresAt: now + CACHE_TTL,
    settled: false,
    promise: null,
  };

  entry.promise = fetch(url, { signal: controller.signal })
    .then(async (response) => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Request failed");
      entry.expiresAt = Date.now() + CACHE_TTL;
      return body;
    })
    .then((body) => {
      entry.settled = true;
      return body;
    })
    .catch((error) => {
      entry.settled = true;
      if (requestCache.get(key) === entry) requestCache.delete(key);
      throw error;
    });

  requestCache.set(key, entry);
  return { promise: entry.promise, release: () => releaseRequest(key, entry) };
}

function releaseRequest(key, entry) {
  if (entry.consumers > 0) entry.consumers -= 1;

  if (!entry.settled && entry.consumers === 0) {
    entry.controller.abort();
    if (requestCache.get(key) === entry) requestCache.delete(key);
  }
}

/**
 * Remove a cache entry so the next getCachedRequest call fetches fresh data.
 * Safe to call even if the key is not in the cache.
 */
export function invalidateCachedRequest(key) {
  const entry = requestCache.get(key);
  if (!entry) return;
  if (!entry.settled) entry.controller.abort();
  requestCache.delete(key);
}
