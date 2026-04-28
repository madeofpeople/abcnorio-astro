export const prerender = false;

import fs from 'node:fs';

export function GET() {
  const pushing = fs.existsSync('/app/.push-in-progress');
  return new Response(JSON.stringify({ pushing }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
