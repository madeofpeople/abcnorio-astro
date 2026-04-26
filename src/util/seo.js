export function buildPostSeo({ post, siteUrl, pathname }) {
  const stripTags = (value = '') => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  return {
    title: post?.title?.rendered,
    description: stripTags(post?.excerpt?.rendered || post?.content?.rendered || ''),
    canonical: `${siteUrl}${pathname}`,
    ogImage: post?.jetpack_featured_media_url || post?.yoast_head_json?.og_image?.[0]?.url,
  };
}