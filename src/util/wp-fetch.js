const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_PER_PAGE = 100;
const DEFAULT_PAGE_BATCH_SIZE = 5;

/**
 * Fetch JSON from a URL with a timeout.
 *
 * @param {string} url
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<any>}
 */
export async function fetchWpJson(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetch all paginated WP REST items, returning a flat array.
 *
 * @param {string} baseUrl  Base endpoint URL (query params allowed)
 * @param {{ perPage?: number, pageBatchSize?: number }} [options]
 * @returns {Promise<any[]>}
 */
export async function fetchAllWpItems(baseUrl, { perPage = DEFAULT_PER_PAGE, pageBatchSize = DEFAULT_PAGE_BATCH_SIZE } = {}) {
  const sep = baseUrl.includes('?') ? '&' : '?';
  const pageUrl = (page) => `${baseUrl}${sep}per_page=${perPage}&page=${page}`;

  const first = await fetchWpJson(pageUrl(1));
  if (!Array.isArray(first) || first.length === 0) return [];

  const items = [...first];
  if (first.length < perPage) return items;

  let nextPage = 2;
  let hasMore = true;

  while (hasMore) {
    const pageNums = Array.from({ length: pageBatchSize }, (_, i) => nextPage + i);
    const batches = await Promise.all(pageNums.map(p => fetchWpJson(pageUrl(p)).catch(() => [])));

    for (const batch of batches) {
      if (!Array.isArray(batch) || batch.length === 0) { hasMore = false; break; }
      items.push(...batch);
      if (batch.length < perPage) { hasMore = false; break; }
    }

    nextPage += pageBatchSize;
  }

  return items;
}
