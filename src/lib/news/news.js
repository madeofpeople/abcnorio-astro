import { REST_PATH } from "@util/paths.js";
import { POSTS_PER_PAGE } from "@consts";

// Map UI param names to WP REST API taxonomy rest_base param names.
const TAXONOMY_PARAM_MAP = {
    collective_association: 'collective-associations',
};

export async function getNewsItems(filters = {}, { page = 1, perPage = POSTS_PER_PAGE } = {}) {
    const mapped = Object.fromEntries(
        Object.entries(filters).map(([k, v]) => [TAXONOMY_PARAM_MAP[k] ?? k, v])
    );
    const params = new URLSearchParams(
        Object.fromEntries(
            Object.entries({ ...mapped, page, per_page: perPage, _embed: 'wp:featuredmedia' })
                .filter(([, v]) => v !== '' && v != null)
        )
    );
    const url = `${REST_PATH}news_items${params.size ? '?' + params : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
        if (response.status === 400 && page > 1) {
            return getNewsItems(filters, { page: 1, perPage });
        }
        throw new Error(`Failed to fetch news items: ${response.status}`);
    }
    const items = await response.json();
    const total = parseInt(response.headers.get('X-WP-Total') ?? '0', 10);
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') ?? '1', 10);
    return { items, total, totalPages };
}
