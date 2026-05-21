#!/usr/bin/env node
/**
 * Copy .next/static + public into .next/standalone after `next build`.
 *
 * Next.js standalone build mode (output: 'standalone' in next.config.js)
 * writes a minimal server bundle to .next/standalone/ but does NOT copy
 * static assets there — that's a documented manual step. Without this
 * script, the standalone server returns 404 for every /_next/static/* URL
 * referenced in the freshly-built HTML, breaking every deploy.
 *
 * Wired as a post-step in package.json: `"build": "next build && npm run sync-standalone"`.
 * Idempotent — safe to run any number of times. No-ops if standalone dir
 * doesn't exist (i.e. when output mode is not 'standalone').
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const standalone = path.join(root, '.next/standalone');

if (!fs.existsSync(standalone)) {
  console.log('[sync-standalone] no .next/standalone dir; output mode is not "standalone", skipping');
  process.exit(0);
}

const tasks = [
  { from: path.join(root, '.next/static'), to: path.join(standalone, '.next/static') },
  { from: path.join(root, 'public'),       to: path.join(standalone, 'public') },
];

for (const { from, to } of tasks) {
  if (!fs.existsSync(from)) {
    console.log(`[sync-standalone] source missing: ${from} — skipping`);
    continue;
  }
  fs.cpSync(from, to, { recursive: true, force: true });
  console.log(`[sync-standalone] ${from} → ${to}`);
}

console.log('[sync-standalone] done');
