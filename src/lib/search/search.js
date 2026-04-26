import { SEARCH_API } from '@util/paths.js';
export async function getSearchResults( query='') {
    const url = `${SEARCH_API}?q=${encodeURIComponent(query)?}&order=desc`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
    }
    return response.json();
}
