import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Root folder for persistent build-time WP API cache snapshots. */
const CACHE_ROOT = path.join(process.cwd(), '.cache', 'wp-api');
/** Default freshness window for cache entries (15 minutes). */
const DEFAULT_CACHE_TTL_MS = (() => {
  const mode = String(process.env.MODE || '').toLowerCase();
  const raw = Number(process.env.BUILD_CACHE_TTL_MS);
  if (Number.isFinite(raw) && raw >= 0) {
    return raw;
  }

  // Dev/staging frontends should reflect CMS changes immediately unless explicitly overridden.
  if (mode === 'development' || mode === 'staging') {
    return 0;
  }

  return 15 * 60 * 1000;
})();
/** Number of paginated requests executed concurrently per fetch batch. */
const DEFAULT_PAGE_BATCH_SIZE = 5;

/**
 * Build a deterministic cache file path from a request key.
 *
 * @param {string} url
 * @returns {string}
 */
function cacheFilePathForUrl(url) {
  const key = createHash('sha1').update(url).digest('hex');
  return path.join(CACHE_ROOT, `${key}.json`);
}

/**
 * Read cached payload data only.
 *
 * @param {string} url
 * @returns {Promise<any | null>}
 */
async function readSnapshot(url) {
  const record = await readSnapshotRecord(url);
  return record?.data ?? null;
}

/**
 * @typedef {Object} SnapshotRecord
 * @property {string | null} savedAt ISO timestamp when cache entry was saved.
 * @property {string} url Request key associated with this cache entry.
 * @property {any} data Cached payload.
 * @example
 * {
 *   "savedAt": "2026-04-24T15:30:00.000Z",
 *   "url": "https://example.com/wp-json/wp/v2/events?per_page=100&page=1",
 *   "data": [{ "id": 123, "slug": "sample-event" }]
 * }
 */

/**
 * Read full cache snapshot record, including metadata.
 * Backward compatible with legacy files that only stored raw payload.
 *
 * @param {string} url
 * @returns {Promise<SnapshotRecord | null>}
 */
async function readSnapshotRecord(url) {
  const filePath = cacheFilePathForUrl(url);

  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);

    if (parsed && typeof parsed === 'object' && 'savedAt' in parsed && 'data' in parsed) {
      return parsed;
    }

    return {
      savedAt: null,
      url,
      data: parsed,
    };
  } catch {
    return null;
  }
}

/**
 * Determine whether a cached snapshot is fresh under the provided TTL.
 *
 * @param {SnapshotRecord | null} snapshot
 * @param {number} cacheTtlMs
 * @returns {boolean}
 */
function isSnapshotFresh(snapshot, cacheTtlMs) {
  if (!snapshot?.savedAt || cacheTtlMs <= 0) {
    return false;
  }

  const savedAtMs = Date.parse(snapshot.savedAt);
  if (Number.isNaN(savedAtMs)) {
    return false;
  }

  return Date.now() - savedAtMs <= cacheTtlMs;
}

/**
 * Persist a cache snapshot for a request key.
 *
 * @param {string} url
 * @param {any} data
 * @returns {Promise<void>}
 */
async function writeSnapshot(url, data) {
  const filePath = cacheFilePathForUrl(url);
  await mkdir(CACHE_ROOT, { recursive: true });
  await writeFile(
    filePath,
    JSON.stringify({
      savedAt: new Date().toISOString(),
      url,
      data,
    })
  );
}

/**
 * Fetch JSON with timeout handling.
 *
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<any>}
 */
async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`Request failed ${response.status} for ${url}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @typedef {Object} FetchJsonWithBuildCacheOptions
 * @property {any} [defaultValue=null] Fallback when fetch and cache are unavailable.
 * @property {number} [timeoutMs=12000] Network timeout in milliseconds.
 * @property {number} [cacheTtlMs=DEFAULT_CACHE_TTL_MS] Freshness window in milliseconds.
 * @property {string} [cacheKey] Optional cache identity override when URL should remain
 * unchanged but cache invalidation should follow a different key (for example post modified time).
 */

/**
 * Fetch JSON with persistent file cache.
 * Fresh cache returns immediately; stale/missing cache triggers network fetch.
 * On network failure, stale cache is still used for resilience.
 *
 * If `cacheKey` is provided, cache reads/writes use that key while network requests
 * still use `url`.
 *
 * @param {string} url
 * @param {FetchJsonWithBuildCacheOptions} [options={}]
 * @returns {Promise<any>}
 */
export async function fetchJsonWithBuildCache(url, options = {}) {
  const {
    defaultValue = null,
    timeoutMs = 12000,
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    cacheKey,
  } = options;

  const snapshotKey = cacheKey || url;

  const cachedSnapshot = await readSnapshotRecord(snapshotKey);
  if (isSnapshotFresh(cachedSnapshot, cacheTtlMs)) {
    return cachedSnapshot.data;
  }

  try {
    const data = await fetchJson(url, timeoutMs);
    await writeSnapshot(snapshotKey, data);
    return data;
  } catch (error) {
    if (cachedSnapshot !== null) {
      console.warn(`[build-cache] Using cached response for ${snapshotKey}`);
      return cachedSnapshot.data;
    }

    console.warn(`[build-cache] No cache for ${snapshotKey}; using default value`);
    return defaultValue;
  }
}

/**
 * @typedef {Object} FetchAllWpItemsWithBuildCacheOptions
 * @property {number} [perPage=100] WP REST page size.
 * @property {any[]} [defaultValue=[]] Fallback value when page fetch fails without cache.
 * @property {number} [cacheTtlMs=DEFAULT_CACHE_TTL_MS] Freshness window in milliseconds.
 * @property {number} [pageBatchSize=DEFAULT_PAGE_BATCH_SIZE] Number of pages fetched concurrently.
 */

/**
 * Fetch all paginated WP REST items with cache support.
 * Uses a cached aggregate list key plus per-page cache keys and parallel page batches.
 *
 * @param {string} baseUrl
 * @param {FetchAllWpItemsWithBuildCacheOptions} [options={}]
 * @returns {Promise<any[]>}
 */
export async function fetchAllWpItemsWithBuildCache(baseUrl, options = {}) {
  const {
    perPage = 100,
    defaultValue = [],
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    pageBatchSize = DEFAULT_PAGE_BATCH_SIZE,
  } = options;

  const listCacheUrl = `${baseUrl}::all::per_page=${perPage}`;
  const listSnapshot = await readSnapshotRecord(listCacheUrl);
  if (isSnapshotFresh(listSnapshot, cacheTtlMs)) {
    return listSnapshot.data;
  }

  const separator = baseUrl.includes('?') ? '&' : '?';
  const buildPageUrl = (page) => `${baseUrl}${separator}per_page=${perPage}&page=${page}`;

  const firstBatch = await fetchJsonWithBuildCache(buildPageUrl(1), {
    defaultValue,
    cacheTtlMs,
  });

  if (!Array.isArray(firstBatch) || firstBatch.length === 0) {
    await writeSnapshot(listCacheUrl, []);
    return [];
  }

  const items = [...firstBatch];
  if (firstBatch.length < perPage) {
    await writeSnapshot(listCacheUrl, items);
    return items;
  }

  let nextPage = 2;
  let hasMorePages = true;

  while (hasMorePages) {
    const currentPageNumbers = Array.from({ length: pageBatchSize }, (_, index) => nextPage + index);
    const pageResults = await Promise.all(
      currentPageNumbers.map((page) =>
        fetchJsonWithBuildCache(buildPageUrl(page), {
          defaultValue,
          cacheTtlMs,
        })
      )
    );

    for (const batch of pageResults) {
      if (!Array.isArray(batch) || batch.length === 0) {
        hasMorePages = false;
        break;
      }

      items.push(...batch);

      if (batch.length < perPage) {
        hasMorePages = false;
        break;
      }
    }

    nextPage += pageBatchSize;
  }

  await writeSnapshot(listCacheUrl, items);
  return items;
}
