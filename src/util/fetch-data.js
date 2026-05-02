import { fetchWpJson } from './wp-fetch.js';
import { fetchPostBlocks } from '../lib/blocks.js';

export const isLiveDevMode = ['development', 'staging'].includes(
  String(process.env.MODE || '').toLowerCase()
);

/**
 * Branches between a live REST fetch (dev/staging) and the content store (build).
 * Use for collection listing pages.
 *
 * @param {() => Promise<any[]>} liveLoader  - fetches directly from WP REST
 * @param {() => Promise<any[]>} staticLoader - reads from Astro content store
 */
export async function fetchData(liveLoader, staticLoader) {
  return isLiveDevMode ? liveLoader() : staticLoader();
}

/**
 * Fetches a single WP post by slug URL and merges blocks, in dev/staging only.
 * In build mode calls fallback (if function) or returns it directly.
 *
 * @param {string}          url      - full WP REST URL with slug param
 * @param {any|(() => any)} fallback - value or async getter for build mode
 */
export async function fetchWpPost(url, fallback = null) {
  const staticValue = typeof fallback === 'function' ? await fallback() : fallback;
  if (!isLiveDevMode) return staticValue;
  const posts = await fetchWpJson(url).catch(() => []);
  if (!Array.isArray(posts) || !posts[0]) return staticValue;
  const post = posts[0];
  const blocks = await fetchPostBlocks(post.id);
  return { ...post, blocks };
}
