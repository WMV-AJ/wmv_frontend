#!/usr/bin/env node
// Checks that the pages search engines and AI assistants read are really
// readable: right status code, text in the HTML without JavaScript, valid
// JSON-LD, a canonical link, and a sitemap whose URLs resolve.
//
//   node scripts/seo-check.mjs                       # against production
//   node scripts/seo-check.mjs http://localhost:3055 # against a local build
//
// Exits 1 if any check fails.

const BASE = (process.argv[2] || 'https://wheresmyvibe.com').replace(/\/$/, '');
const CANONICAL_HOST = 'https://wheresmyvibe.com';
const CRAWLER_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const CITIES = ['dubai', 'bangalore', 'mumbai', 'delhi'];
const SITEMAP_SAMPLE = 12;

const failures = [];
let passed = 0;

function check(ok, label, detail = '') {
  if (ok) {
    passed += 1;
  } else {
    failures.push(`${label}${detail ? `: ${detail}` : ''}`);
    console.log(`  FAIL ${label}${detail ? ` (${detail})` : ''}`);
  }
}

async function get(path) {
  const response = await fetch(`${BASE}${path}`, { redirect: 'manual', headers: { 'user-agent': CRAWLER_UA } });
  const body = response.status >= 300 && response.status < 400 ? '' : await response.text();
  return { status: response.status, location: response.headers.get('location'), body };
}

/** Text a reader without JavaScript sees: the body with scripts, styles and tags removed. */
function visibleText(html) {
  const body = html.slice(Math.max(html.indexOf('<body'), 0));
  return body
    .replace(/<(script|style|template)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;|&#39;|&rsquo;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function jsonLdTypes(html, label) {
  const types = [];
  for (const match of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const parsed = JSON.parse(match[1]);
      for (const node of [parsed].flat()) {
        types.push(...(node['@graph'] ? node['@graph'].map((n) => n['@type']) : [node['@type']]));
      }
    } catch {
      check(false, `${label} JSON-LD parses`);
    }
  }
  return types;
}

/**
 * One indexable page: 200, no redirect, server text, canonical, expected JSON-LD.
 * Returns the HTML so callers can pull links out of it.
 */
async function checkPage(path, { minText, types = [], mustInclude = [] }) {
  const { status, location, body } = await get(path);
  check(status === 200, `${path} returns 200`, `got ${status}${location ? ` → ${location}` : ''}`);
  if (status !== 200) return '';
  const text = visibleText(body);
  check(text.length >= minText, `${path} has text in the HTML`, `${text.length} characters, need ${minText}`);
  check(/<link rel="canonical" href="[^"]+"/.test(body), `${path} has a canonical link`);
  const found = jsonLdTypes(body, path);
  for (const type of types) check(found.includes(type), `${path} has ${type} JSON-LD`, `found ${found.join(', ') || 'none'}`);
  for (const phrase of mustInclude) check(text.includes(phrase), `${path} text includes "${phrase}"`);
  return body;
}

async function checkStatus(path, expected) {
  const { status, location } = await get(path);
  check(status === expected, `${path} returns ${expected}`, `got ${status}${location ? ` → ${location}` : ''}`);
}

function isNoindex(html) {
  return /<meta name="robots" content="[^"]*noindex/.test(html);
}

async function checkCity(city) {
  console.log(`\n${city}`);
  const home = await checkPage(`/${city}`, { minText: 400 });
  const eventLink = new RegExp(`href="(/${city}/event/\\d+)"`);
  // A city with nothing on today still has upcoming events on its weekend page.
  const eventPath = home.match(eventLink)?.[1] ?? (await get(`/${city}/this-weekend`)).body.match(eventLink)?.[1];

  for (const kind of ['tonight', 'this-weekend', 'free-events']) {
    const html = await checkPage(`/${city}/${kind}`, { minText: 300, types: ['FAQPage'], mustInclude: ["Where's My Vibe"] });
    if (html && !isNoindex(html)) check(jsonLdTypes(html, kind).includes('ItemList'), `/${city}/${kind} has ItemList JSON-LD`);
  }

  const vibe = await checkPage(`/${city}/vibe/live`, { minText: 150, mustInclude: ["Where's My Vibe"] });
  if (vibe && !isNoindex(vibe)) {
    check(/href="\/[a-z]+\/event\/\d+"/.test(vibe), `/${city}/vibe/live lists events as links in the HTML`);
  }

  if (eventPath) {
    const html = await checkPage(eventPath, { minText: 150, types: ['Event'] });
    const name = html.match(/"@type":"Event","name":"([^"]+)"/)?.[1];
    if (name) check(visibleText(html).includes(name.replace(/\\u0026/g, '&')), `${eventPath} shows the event name in the HTML`, name);
  } else {
    console.log(`  note: no events listed for ${city} today or this weekend, so no event page was checked`);
  }

  await checkStatus(`/${city}/not-a-real-page`, 404);
  await checkStatus(`/${city}/event/999999999`, 404);
}

async function checkSitemap() {
  console.log('\nsitemap');
  const { status, body } = await get('/sitemap.xml');
  check(status === 200, '/sitemap.xml returns 200', `got ${status}`);
  const urls = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`  ${urls.length} URLs (${urls.filter((u) => u.includes('/event/')).length} events)`);
  check(urls.length > 100, 'sitemap lists more than 100 URLs', `${urls.length}`);
  check(urls.some((u) => u.includes('/event/')), 'sitemap includes event pages');
  check(urls.every((u) => u.startsWith(CANONICAL_HOST)), 'sitemap URLs use the canonical host');
  const step = Math.max(1, Math.floor(urls.length / SITEMAP_SAMPLE));
  for (const url of urls.filter((_, index) => index % step === 0).slice(0, SITEMAP_SAMPLE)) {
    await checkStatus(url.replace(CANONICAL_HOST, ''), 200);
  }
}

async function main() {
  console.log(`Checking ${BASE}`);

  console.log('\nsite-wide');
  await checkPage('/', { minText: 200, types: ['Organization', 'WebSite'] });
  await checkPage('/faq', { minText: 800, types: ['FAQPage'] });
  await checkPage('/how-it-works', { minText: 800 });
  await checkPage('/privacy', { minText: 800 });
  await checkPage('/data-deletion', { minText: 300 });
  await checkStatus('/not-a-city', 404);
  await checkStatus('/not-a-city/tonight', 404);
  await checkStatus('/robots.txt', 200);
  const llms = await get('/llms.txt');
  check(llms.status === 200 && llms.body.startsWith("# Where's My Vibe"), '/llms.txt is served as text', `status ${llms.status}`);
  const legacy = await get('/map');
  check(legacy.status === 307 && (legacy.location || '').endsWith('/dubai/map'), '/map still redirects to /dubai/map', `status ${legacy.status}`);

  for (const city of CITIES) await checkCity(city);
  await checkSitemap();

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(`seo-check could not run: ${error.message}`);
  process.exit(1);
});
