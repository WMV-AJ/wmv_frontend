// Video thumbnail extractor — the "make videos load fast" backbone.
//
// GET /api/video-thumb?src=<encoded GCS video url>
//
// Extracts one frame (t=0.5s) with ffmpeg, scales to 480w JPEG (~15-30KB),
// caches it on disk, and serves it with long cache headers. Card tiles can
// then render a tiny instant image instead of pulling video bytes from GCS
// (a single tile mp4 is 500KB+; its thumb is ~20KB — a 25× reduction, and
// the video itself now loads only when it actually plays).
//
// Safety: src is allow-listed to our own GCS media bucket (no SSRF), and the
// cache key is a hash of the URL (no path traversal). Concurrent requests
// for the same video share one ffmpeg run.
import { NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ALLOWED_PREFIX = 'https://storage.googleapis.com/wmv-ig-images/';

// Some media rows still carry raw Instagram CDN URLs (not yet mirrored to
// GCS). Allow those hosts too — still an explicit allow-list, no open proxy.
function isAllowedMediaUrl(url: string): boolean {
  if (url.startsWith(ALLOWED_PREFIX)) return true;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    return u.hostname.endsWith('.cdninstagram.com') || u.hostname.endsWith('.fbcdn.net');
  } catch {
    return false;
  }
}
const CACHE_DIR = path.join(os.tmpdir(), 'wmv-video-thumbs');
const FFMPEG_TIMEOUT_MS = 15_000;

// In-flight dedup: many tiles can request the same video's thumb at once.
const inFlight = new Map<string, Promise<Buffer | null>>();

// Negative cache: a video ffmpeg can't decode shouldn't re-run a 15s
// extraction attempt on every tile render. Retry after 10 minutes.
const failedAt = new Map<string, number>();
const FAIL_TTL_MS = 10 * 60_000;

async function extractFrame(src: string, outPath: string): Promise<Buffer | null> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const tmpPath = `${outPath}.tmp-${process.pid}-${Math.random().toString(36).slice(2)}.jpg`;

  const ok = await new Promise<boolean>((resolve) => {
    const proc = spawn(
      'ffmpeg',
      [
        '-hide_banner', '-loglevel', 'error',
        '-ss', '0.5',
        '-i', src,
        '-frames:v', '1',
        '-vf', 'scale=480:-2',
        '-q:v', '5',
        '-y', tmpPath,
      ],
      { stdio: ['ignore', 'ignore', 'ignore'] },
    );
    const timer = setTimeout(() => { proc.kill('SIGKILL'); resolve(false); }, FFMPEG_TIMEOUT_MS);
    proc.on('error', () => { clearTimeout(timer); resolve(false); });
    proc.on('close', (code) => { clearTimeout(timer); resolve(code === 0); });
  });

  if (!ok) {
    await fs.unlink(tmpPath).catch(() => {});
    return null;
  }

  try {
    const buf = await fs.readFile(tmpPath);
    if (buf.length < 100) throw new Error('empty frame');
    // Atomic-ish publish so concurrent readers never see a partial file.
    await fs.rename(tmpPath, outPath);
    return buf;
  } catch {
    await fs.unlink(tmpPath).catch(() => {});
    return null;
  }
}

// Extraction failed (ffmpeg missing, undecodable video). Never serve the
// branded placeholder as if it were a real thumbnail — that read as a
// "random default thumbnail" on every video. Prefer the caller-provided
// sibling image; otherwise 404 and let the client's onError decide.
function failureResponse(fallback: string | null) {
  if (fallback && isAllowedMediaUrl(fallback)) {
    return NextResponse.redirect(fallback, {
      status: 302,
      // Short-lived, never immutable: once ffmpeg is available the real
      // frame should replace this within minutes, not after a cached week.
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  }
  return new NextResponse(null, {
    status: 404,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get('src') || '';
  // Same allow-list as src (SSRF guard applies to the fallback too).
  const fallback = (searchParams.get('fallback') || '').split('#')[0] || null;

  // Strip any media-fragment before validating/fetching.
  const cleanSrc = src.split('#')[0];
  if (!isAllowedMediaUrl(cleanSrc)) {
    return NextResponse.json({ error: 'src not allowed' }, { status: 400 });
  }

  const key = createHash('sha1').update(cleanSrc).digest('hex');
  const cachePath = path.join(CACHE_DIR, `${key}.jpg`);

  const headers = {
    'Content-Type': 'image/jpeg',
    // Thumbs are immutable per URL; let browsers + nginx hold them for a week.
    'Cache-Control': 'public, max-age=604800, immutable',
  };

  // Disk cache hit
  try {
    const cached = await fs.readFile(cachePath);
    return new NextResponse(new Uint8Array(cached), { headers });
  } catch { /* miss */ }

  // Recently failed → fallback immediately, no ffmpeg re-run.
  const lastFail = failedAt.get(key);
  if (lastFail && Date.now() - lastFail < FAIL_TTL_MS) {
    return failureResponse(fallback);
  }

  // Extract (deduped)
  let job = inFlight.get(key);
  if (!job) {
    job = extractFrame(cleanSrc, cachePath).finally(() => inFlight.delete(key));
    inFlight.set(key, job);
  }
  const frame = await job;

  if (frame) {
    failedAt.delete(key);
    return new NextResponse(new Uint8Array(frame), { headers });
  }

  failedAt.set(key, Date.now());
  return failureResponse(fallback);
}
