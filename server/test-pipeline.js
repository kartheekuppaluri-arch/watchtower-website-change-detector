const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { PNG } = require('pngjs');

async function runPipelineTests() {
  console.log('🔬 Starting WatchTower Screenshot & Diff Pipeline Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const { 
    getBrowserExecutablePath, 
    crawlWithBrowser, 
    crawlWithHttp, 
    inspectForOutageOrCaptcha 
  } = require('./engine/crawler');
  const puppeteer = require('puppeteer');

  // =========================================================================
  // TEST A: Browser Discovery & Launch Lifecycle
  // =========================================================================
  try {
    console.log('--- Test A: Browser Discovery ---');
    const execPath = await getBrowserExecutablePath();
    assert.ok(execPath, 'Browser executable path must resolve');
    assert.ok(fs.existsSync(execPath), `Resolved executable must exist on disk: ${execPath}`);
    console.log(`  ✓ Executable resolved & verified: ${execPath}`);

    // Launch Chrome, open a page, and close cleanly
    const browser = await puppeteer.launch({
      executablePath: execPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    assert.ok(browser, 'Browser must launch successfully');

    const page = await browser.newPage();
    assert.ok(page, 'Browser must open a new page');
    await page.close();
    await browser.close();
    console.log('  ✓ Browser launched, created page, and closed cleanly without hanging');
    passed++;
  } catch (err) {
    console.error('  ❌ Test A failed:', err.message);
    failed++;
  }

  // Start internal test server for mock endpoints
  const app = require('./index');
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  process.env.PORT = String(port);
  process.env.BACKEND_URL = `http://localhost:${port}`;

  // =========================================================================
  // TEST B: Real Web Screenshot (https://example.com)
  // =========================================================================
  try {
    console.log('\n--- Test B: Real External Web Screenshot (https://example.com) ---');
    const crawlRes = await crawlWithBrowser('https://example.com', { timeoutMs: 25000, monitorId: 'test-external' });
    assert.strictEqual(crawlRes.success, true, 'External crawl must succeed');
    assert.ok(crawlRes.rawHtml.includes('Example Domain'), 'Raw HTML must contain Example Domain');
    assert.ok(crawlRes.screenshotFullPath, 'Must provide screenshotFullPath');
    assert.ok(fs.existsSync(crawlRes.screenshotFullPath), 'Screenshot file must exist');

    const fileBuffer = fs.readFileSync(crawlRes.screenshotFullPath);
    assert.ok(fileBuffer.length > 5000, `Buffer must be > 5KB (got ${fileBuffer.length} bytes)`);

    // Verify PNG header and dimensions (1280x800)
    const png = PNG.sync.read(fileBuffer);
    assert.strictEqual(png.width, 1280, `Width must be 1280 (got ${png.width})`);
    assert.strictEqual(png.height, 800, `Height must be 800 (got ${png.height})`);

    // Verify real content pixels (not uniform blue or empty blank canvas)
    let nonUniform = 0;
    const r0 = png.data[0], g0 = png.data[1], b0 = png.data[2];
    for (let i = 0; i < png.data.length; i += 4) {
      if (Math.abs(png.data[i] - r0) > 10 || Math.abs(png.data[i+1] - g0) > 10 || Math.abs(png.data[i+2] - b0) > 10) {
        nonUniform++;
      }
    }
    const ratio = (nonUniform / (png.width * png.height)) * 100;
    assert.ok(ratio > 0.5, `Content pixel ratio must be > 0.5% (got ${ratio.toFixed(2)}%)`);

    console.log(`  ✓ Real screenshot verified: 1280x800 PNG, ${fileBuffer.length} bytes, ${ratio.toFixed(1)}% content pixels`);
    passed++;
  } catch (err) {
    console.error('  ❌ Test B failed:', err.message);
    failed++;
  }

  // =========================================================================
  // TEST C: Internal Mock Page Capture (/mock/store)
  // =========================================================================
  try {
    console.log('\n--- Test C: Internal Mock Page Capture ---');
    const mockRes = await crawlWithBrowser(`http://localhost:${port}/mock/store`, {
      timeoutMs: 15000,
      monitorId: 'monitor-store-demo',
      watchSelector: '#product-details'
    });
    assert.strictEqual(mockRes.success, true, 'Internal mock crawl must succeed');
    assert.ok(mockRes.rawHtml.includes('TechGadget'), 'HTML must include product details');
    assert.ok(fs.existsSync(mockRes.screenshotFullPath), 'Screenshot file must exist');
    const stat = fs.statSync(mockRes.screenshotFullPath);
    assert.ok(stat.size > 10000, `Mock store screenshot must be substantial (got ${stat.size} bytes)`);

    console.log(`  ✓ Mock store rendered and captured successfully (${stat.size} bytes)`);
    passed++;
  } catch (err) {
    console.error('  ❌ Test C failed:', err.message);
    failed++;
  }

  // =========================================================================
  // TEST D: Storage Reference Persistence & Retrieval
  // =========================================================================
  try {
    console.log('\n--- Test D: Storage & API Retrieval ---');
    const db = require('./db');
    const storagePath = `monitors/monitor-store-demo/snap-pipeline-test-${Date.now()}.png`;
    const snap = db.addSnapshot({
      monitorId: 'monitor-store-demo',
      timestamp: new Date().toISOString(),
      contentHash: 'hash-pipeline-test',
      textLength: 120,
      textSnippet: 'Test product details',
      filteredText: 'Test product details',
      screenshotUrl: '/api/screenshots/test.png',
      screenshotStoragePath: storagePath,
      summary: 'Pipeline verification snapshot',
      numberValue: 49.99
    });

    assert.strictEqual(snap.screenshotStoragePath, storagePath, 'Snapshot must persist screenshotStoragePath');

    // Retrieve via API endpoint
    const snapRes = await fetch(`${process.env.BACKEND_URL}/api/screenshots/signed/${snap.id}`);
    assert.strictEqual(snapRes.status, 200, 'API endpoint /api/screenshots/signed/:id must return HTTP 200');
    const snapJson = await snapRes.json();
    assert.ok(snapJson.storagePath || snapJson.signedUrl, 'Must return storagePath or signedUrl');
    assert.strictEqual(snapJson.storagePath, storagePath, 'Returned storagePath must match persisted path');

    console.log(`  ✓ Snapshot storage reference persisted and successfully queried via REST API`);
    passed++;
  } catch (err) {
    console.error('  ❌ Test D failed:', err.message);
    failed++;
  }

  // =========================================================================
  // TEST E: Regression & Fault Tolerance
  // =========================================================================
  try {
    console.log('\n--- Test E: Regression & Fault Tolerance ---');
    // E1: Incident detection
    const outage = inspectForOutageOrCaptcha(503, '<html>Service Unavailable</html>', '503 Service Unavailable');
    assert.strictEqual(outage.isIncident, true);
    assert.strictEqual(outage.type, 'OUTAGE');

    const captcha = inspectForOutageOrCaptcha(403, '<html>Just a moment... cf-browser-verification</html>', 'Just a moment...');
    assert.strictEqual(captcha.isIncident, true);
    assert.strictEqual(captcha.type, 'CAPTCHA');

    // E2: Noise filtering
    const { cleanTextNoise } = require('./engine/noiseFilter');
    const noisyText = 'Updated: 10:45:22 AM - Live Viewers: 42 - TechGadget Headphones $49.99';
    const cleaned = cleanTextNoise(noisyText, { filterTimestamps: true, filterCounters: true });
    assert.ok(!cleaned.includes('10:45:22 AM'), 'Timestamps should be removed');

    // E3: RSS Feed generation
    const rssRes = await fetch(`${process.env.BACKEND_URL}/api/monitors/monitor-store-demo/rss`);
    assert.strictEqual(rssRes.status, 200, 'RSS endpoint must return HTTP 200');
    const rssXml = await rssRes.text();
    assert.ok(rssXml.includes('<rss version="2.0"'), 'Response must be valid RSS 2.0 XML');
    assert.ok(rssXml.includes('<channel>'), 'Must have channel');

    console.log('  ✓ Incident detection, noise filtering, and RSS XML feeds functioning normally');
    passed++;
  } catch (err) {
    console.error('  ❌ Test E failed:', err.message);
    failed++;
  }

  // =========================================================================
  // TEST F: In-Flight Check Deduplication & Concurrency Protection
  // =========================================================================
  try {
    console.log('\n--- Test F: In-Flight Check Deduplication ---');
    const scheduler = require('./engine/scheduler');

    // Launch two simultaneous checks for the exact same monitor
    const [res1, res2] = await Promise.all([
      scheduler.runCheck('monitor-store-demo'),
      scheduler.runCheck('monitor-store-demo')
    ]);

    assert.ok(res1, 'Result 1 must exist');
    assert.ok(res2, 'Result 2 must exist');
    assert.strictEqual(scheduler.activeMonitorChecks.has('monitor-store-demo'), false, 'Active check map must be cleaned up in finally block');

    console.log('  ✓ Simultaneous checks safely deduplicated and resolved without resource collisions');
    passed++;
  } catch (err) {
    console.error('  ❌ Test F failed:', err.message);
    failed++;
  }

  // =========================================================================
  // TEST G: Crawler Failure Handling & Resource Cleanup
  // =========================================================================
  try {
    console.log('\n--- Test G: Crawler Failure Handling & Cleanup ---');
    const { browserLimiter } = require('./engine/crawler');

    // Crawl a guaranteed unreachable local port with a fast timeout
    const failRes = await crawlWithBrowser('http://127.0.0.1:59999/unreachable-test', {
      timeoutMs: 3000,
      monitorId: 'test-fail-cleanup'
    });

    assert.strictEqual(failRes.success, false, 'Failed crawl must report success=false');
    assert.ok(failRes.incident, 'Failed crawl must return incident metadata');
    assert.strictEqual(failRes.incident.isIncident, true, 'isIncident must be true');
    assert.strictEqual(browserLimiter.running, 0, 'Browser concurrency limiter must be fully released (running = 0)');
    assert.strictEqual(browserLimiter.queue.length, 0, 'Limiter queue must be empty');

    console.log('  ✓ Unreachable URL returned structured incident and released browser concurrency lock');
    passed++;
  } catch (err) {
    console.error('  ❌ Test G failed:', err.message);
    failed++;
  }

  // =========================================================================
  // TEST H: Visual Picker /api/picker/inspect Endpoint
  // =========================================================================
  try {
    console.log('\n--- Test H: Visual Region Picker /api/picker/inspect ---');
    const inspectRes = await fetch(`${process.env.BACKEND_URL}/api/picker/inspect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `http://localhost:${port}/mock/store` })
    });

    assert.strictEqual(inspectRes.status, 200, 'Picker inspection endpoint must return HTTP 200');
    const inspectData = await inspectRes.json();
    assert.strictEqual(inspectData.success, true, 'Inspection must succeed');
    assert.ok(inspectData.html, 'Must return HTML for interactive DOM picking');
    assert.ok(inspectData.html.includes('product-details'), 'HTML must contain target selectors');
    assert.ok(inspectData.screenshotUrl, 'Must return screenshot URL for visual preview');

    console.log(`  ✓ Visual picker successfully retrieved live DOM and screenshot URL`);
    passed++;
  } catch (err) {
    console.error('  ❌ Test H failed:', err.message);
    failed++;
  }

  console.log(`\n====================================================`);
  console.log(`🏁 Pipeline Suite Result: ${passed} PASSED, ${failed} FAILED`);
  console.log(`====================================================\n`);

  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

runPipelineTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
