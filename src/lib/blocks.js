import { BLOCKS_PATH } from '@util/paths.js';
import { fetchJsonWithBuildCache } from '@util/build-cache.js';

/**
 * @typedef {Object} PostBlocksPayload
 * @property {any[]} [blocks]
 */

/**
 * Fetch blocks for a post and cache by post modified timestamp when available.
 * This keeps the existing plugin endpoint while avoiding unnecessary re-fetches.
 *
 * @param {number|string} postId
 * @param {string} [postModified]
 * @returns {Promise<any[]>}
 */
export async function fetchPostBlocksCachedByPostModified(postId, postModified) {
  if (!postId) {
    return [];
  }

  const requestUrl = `${BLOCKS_PATH}posts/${postId}/blocks`;
  const cacheKey = postModified
    ? `${requestUrl}::post_modified=${postModified}`
    : requestUrl;

  /** @type {PostBlocksPayload} */
  const payload = await fetchJsonWithBuildCache(requestUrl, {
    defaultValue: { blocks: [] },
    cacheKey,
  });

  return payload?.blocks || [];
}

/**
 * Backward-compatible wrapper for callers that only have post ID.
 *
 * @param {number|string} postId
 * @returns {Promise<any[]>}
 */
export async function fetchPostBlocks(postId) {
  return fetchPostBlocksCachedByPostModified(postId);
}