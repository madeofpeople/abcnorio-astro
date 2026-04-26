import { REST_PATH } from "@util/paths.js";
import { POSTS_PER_PAGE } from "@consts";

export async function getEvents(filters = {}, { page = 1, perPage = POSTS_PER_PAGE } = {}) {
    const params = new URLSearchParams(
        Object.fromEntries(
            Object.entries({ ...filters, page, per_page: perPage, _embed: 'wp:featuredmedia' })
                .filter(([, v]) => v !== '' && v != null)
        )
    );
    const url = `${REST_PATH}events${params.size ? '?' + params : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
        // WP returns 400 when the requested page is out of bounds for a filtered result set.
        // Retry page 1 so filtering/pagination changes do not hard-fail the listing.
        if (response.status === 400 && page > 1) {
            return getEvents(filters, { page: 1, perPage });
        }
        throw new Error(`Failed to fetch events: ${response.status}`);
    }
    const events = await response.json();
    const total = parseInt(response.headers.get('X-WP-Total') ?? '0', 10);
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') ?? '1', 10);
    return { events, total, totalPages };
}
