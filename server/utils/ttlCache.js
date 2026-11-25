function createTtlCache({ ttlMs = 10 * 60 * 1000, maxEntries = 100 } = {}) {
  const values = new Map();
  const pending = new Map();

  async function get(key, load, { forceRefresh = false } = {}) {
    if (pending.has(key)) return pending.get(key);
    const previous = values.get(key);
    if (!forceRefresh && previous?.expiresAt > Date.now()) return previous.value;

    const request = Promise.resolve().then(load).then((value) => {
      values.delete(key);
      values.set(key, { value, expiresAt: Date.now() + ttlMs });
      if (values.size > maxEntries) values.delete(values.keys().next().value);
      return value;
    }).finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  }

  return { get };
}

module.exports = { createTtlCache };
