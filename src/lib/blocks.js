import { BLOCKS_PATH } from '@util/paths.js';
import { fetchWpJson } from '@util/wp-fetch.js';

/**
 * Fetch blocks for a post by ID.
 * Called only from content loaders (build time) and dev-mode live fetches.
 *
 * @param {number|string} postId
 * @returns {Promise<any[]>}
 */
export async function fetchPostBlocks(postId) {
  if (!postId) return [];
  try {
    const payload = await fetchWpJson(`${BLOCKS_PATH}posts/${postId}/blocks`);
    return payload?.blocks || [];
  } catch {
    return [];
  }
}