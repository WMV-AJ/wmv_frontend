#!/usr/bin/env node
// Tells IndexNow (Bing, and the search engines that share its feed) which
// pages exist or changed, so they are crawled without waiting to be found.
// The key below is public by design: IndexNow checks that the same value is
// served at https://wheresmyvibe.com/<key>.txt.
//
//   node scripts/indexnow.mjs            # submit every URL in the sitemap
//   node scripts/indexnow.mjs --dry-run  # show what would be sent

const HOST = 'wheresmyvibe.com';
const KEY = 'bd803d5cec517690d2032e2341709293';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const BATCH_SIZE = 5000;

async function sitemapUrls() {
  const response = await fetch(`https://${HOST}/sitemap.xml`);
  if (!response.ok) throw new Error(`sitemap returned ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const urls = await sitemapUrls();
  console.log(`${urls.length} URLs in the sitemap`);
  if (dryRun) {
    console.log(urls.slice(0, 5).join('\n'));
    return;
  }
  for (let start = 0; start < urls.length; start += BATCH_SIZE) {
    const urlList = urls.slice(start, start + BATCH_SIZE);
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList }),
    });
    // 200 and 202 both mean accepted; 202 means the key is still being checked.
    console.log(`submitted ${urlList.length} URLs: HTTP ${response.status}`);
    if (response.status !== 200 && response.status !== 202) {
      throw new Error(`IndexNow rejected the batch: ${await response.text()}`);
    }
  }
}

main().catch((error) => {
  console.error(`indexnow failed: ${error.message}`);
  process.exit(1);
});
