export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, url }) => {
    const q = url.searchParams.get('q')?.trim() ?? '';

    if (q.length < 2) {
        return new Response(JSON.stringify({ results: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const host = request.headers.get('host') ?? '';
    const isDev = host.startsWith('dev.') || host.startsWith('localhost');
    const cmsBase = isDev ? import.meta.env.DEV_CMS : import.meta.env.STAGING_CMS;
    const searchPath = isDev ? import.meta.env.DEV_SEARCH_API : import.meta.env.STAGING_SEARCH_API;

    try {
        const res = await fetch(`${cmsBase}${searchPath}?q=${encodeURIComponent(q)}`);
        if (!res.ok) {
            return new Response(JSON.stringify({ results: {} }), {
                status: 502,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const data = await res.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch {
        return new Response(JSON.stringify({ results: {} }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
