/**
 * Shared HTTP client for all outbound API calls.
 *
 * Usage:
 *   const { fetchJson } = require("../../utils/httpClient");
 *   const body = await fetchJson("https://api.example.com/data");
 *
 * - Default timeout: 9 seconds. Surfaces as a 504 error (not a crash).
 * - On non-OK responses, throws an Error with .status set.
 * - On network/timeout errors, throws an Error with status 504.
 */

const DEFAULT_TIMEOUT_MS = 9000;

/**
 * Fetch a URL and return the parsed JSON body.
 * @param {string} url
 * @param {object} [options]
 * @param {Record<string,string>} [options.headers]
 * @param {number} [options.timeoutMs]
 * @param {(body: object, response: Response) => void} [options.validate]
 *   Optional extra validation after a successful fetch (throws on bad data).
 * @returns {Promise<any>}
 */
async function fetchJson(url, { headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS, validate } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, { headers, signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      const e = new Error(`Request timed out: ${url}`);
      e.status = 504;
      throw e;
    }
    const e = new Error(err.message || "Network error");
    e.status = 502;
    throw e;
  }
  clearTimeout(timer);

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body?.message || body?.comment || body?.error || `HTTP ${response.status}`;
    const e = new Error(message);
    e.status = response.status;
    throw e;
  }

  if (validate) validate(body, response);

  return body;
}

module.exports = { fetchJson, DEFAULT_TIMEOUT_MS };
