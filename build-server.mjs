/**
 * Build trigger server — runs alongside the Astro dev server inside the astro container.
 * Listens on PORT 3034 (internal Docker network only, not exposed to host).
 *
 * POST /trigger  { target: 'dev' | 'staging' | 'production' }
 *   Authorization: Bearer <ASTRO_BUILD_TRIGGER_SECRET>
 *   → 202 { status: 'started', target }
 *   → 409 if a build is already running
 *
 * GET  /status
 *   Authorization: Bearer <ASTRO_BUILD_TRIGGER_SECRET>
 *   → 200 { status: 'idle'|'running'|'done'|'failed', target, started, finished, exitCode }
 */

import http from 'node:http';
import { spawn } from 'node:child_process';

const PORT = 3034;
const SECRET = process.env.ASTRO_BUILD_TRIGGER_SECRET;

if (!SECRET) {
  console.warn('[build-server] WARNING: ASTRO_BUILD_TRIGGER_SECRET is not set — all requests will be rejected.');
}

/** @type {{ status: 'idle'|'running'|'done'|'failed', target: string|null, started: number|null, finished: number|null, exitCode: number|null }} */
let state = {
  status: 'idle',
  target: null,
  started: null,
  finished: null,
  exitCode: null,
};

const COMMANDS = {
  dev:        { cmd: 'bash', args: ['./deploy-to-dev.sh'] },
  staging:    { cmd: 'bash', args: ['./deploy-to-staging.sh'] },
  production: { cmd: 'bash', args: ['./deploy-to-production.sh'] },
};

function runBuild(target) {
  const { cmd, args } = COMMANDS[target];
  state = { status: 'running', target, started: Date.now(), finished: null, exitCode: null };

  const proc = spawn(cmd, args, {
    cwd: '/app',
    env: process.env,
    stdio: 'inherit',
  });

  proc.on('close', (code) => {
    state = {
      ...state,
      status: code === 0 ? 'done' : 'failed',
      finished: Date.now(),
      exitCode: code,
    };
    console.log(`[build-server] build ${state.status} (target=${target}, exit=${code})`);
  });
}

const server = http.createServer((req, res) => {
  const auth = req.headers['authorization'] || '';
  if (!SECRET || auth !== `Bearer ${SECRET}`) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'unauthorized' }));
    return;
  }

  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200);
    res.end(JSON.stringify(state));
    return;
  }

  if (req.method === 'POST' && req.url === '/trigger') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      let target;
      try {
        ({ target } = JSON.parse(body));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'invalid json' }));
        return;
      }

      if (!COMMANDS[target]) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'invalid target', valid: Object.keys(COMMANDS) }));
        return;
      }

      if (state.status === 'running') {
        res.writeHead(409);
        res.end(JSON.stringify({ error: 'build already running', state }));
        return;
      }

      runBuild(target);
      res.writeHead(202);
      res.end(JSON.stringify({ status: 'started', target }));
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[build-server] listening on :${PORT}`);
});
