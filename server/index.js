const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const scheduler = require('./engine/scheduler');
const { crawlWithBrowser } = require('./engine/crawler');
const { computeTextDiff, computeVisualScreenshotDiff, generateChangeSummary } = require('./engine/differ');
const { sendWebhookAlert, generateDailyDigest } = require('./engine/alerts');
const { setupMockRoutes } = require('./mockServer');

const app = express();
const PORT = process.env.PORT || 3001;
const isVercel = Boolean(process.env.VERCEL);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Static directory for snapshot screenshots (safe on Vercel)
const SCREENSHOTS_DIR = isVercel
  ? path.join('/tmp', 'screenshots')
  : path.join(__dirname, '..', 'data', 'screenshots');

try {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[SERVER] Could not create screenshots directory, continuing:', e.message);
}

app.use('/api/screenshots', express.static(SCREENSHOTS_DIR));

// Serve production frontend bundle if built (for local standalone run)
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR) && !isVercel) {
  app.use(express.static(DIST_DIR));
}

// Normalize URL if Vercel serverless rewrite sets function destination path
app.use((req, res, next) => {
  const matched = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-original-url'];
  if (matched && (req.url === '/api' || req.url === '/api/' || req.url === '/api/index' || req.url === '/api/index.js' || req.url === '/')) {
    req.url = matched;
  }
  next();
});

// Setup Mock Web Server routes (/mock/store, /mock/news, /mock/status, etc.)
setupMockRoutes(app);

// -------------------------------------------------------------
// API ROUTER (Handles both /api/* and /* fallbacks on Vercel)
// -------------------------------------------------------------
const apiRouter = express.Router();

// Root API Health
apiRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'WatchTower Website Change Detector API',
    version: '1.0.0',
    platform: isVercel ? 'Vercel Serverless' : 'Node.js Standalone'
  });
});

// Vercel Cron endpoint
apiRouter.get('/cron', async (req, res) => {
  try {
    const results = await scheduler.checkDueMonitors();
    res.json({ success: true, count: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List monitors
apiRouter.get('/monitors', (req, res) => {
  const monitors = db.getMonitors();
  const enhanced = monitors.map(m => {
    const snapshots = db.getSnapshots(m.id);
    const incidents = db.getIncidents(m.id);
    const latestSnapshot = snapshots[0] || null;
    return {
      ...m,
      snapshotCount: snapshots.length,
      incidentCount: incidents.length,
      latestSnapshot
    };
  });
  res.json({ monitors: enhanced });
});

// Trigger check for all monitors (supports both POST and GET for cron)
const handleCheckAll = async (req, res) => {
  try {
    const monitors = db.getMonitors().filter(m => m.active);
    const results = [];
    for (const m of monitors) {
      try {
        const checkRes = await scheduler.runCheck(m.id);
        results.push({ id: m.id, name: m.name, result: checkRes });
      } catch (e) {
        results.push({ id: m.id, name: m.name, error: e.message });
      }
    }
    res.json({ message: `Triggered checks for ${monitors.length} monitors`, count: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
apiRouter.post('/monitors/check-all', handleCheckAll);
apiRouter.get('/monitors/check-all', handleCheckAll);

// Get single monitor
apiRouter.get('/monitors/:id', (req, res) => {
  const monitor = db.getMonitor(req.params.id);
  if (!monitor) return res.status(404).json({ error: 'Monitor not found' });
  const snapshots = db.getSnapshots(monitor.id);
  const incidents = db.getIncidents(monitor.id);
  res.json({ monitor, snapshots, incidents });
});

// Create monitor
apiRouter.post('/monitors', (req, res) => {
  const { name, url, intervalMinutes, watchSelector, ignoreSelectors, sensitivity, noiseFilterActive, customRegex, keywordAlerts, numberTracking, alertEmail, alertWebhook } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const created = db.createMonitor({
    name: name || new URL(url.startsWith('http') ? url : `https://${url}`).hostname,
    url,
    intervalMinutes: Number(intervalMinutes) || 15,
    watchSelector,
    ignoreSelectors,
    sensitivity,
    noiseFilterActive,
    customRegex,
    keywordAlerts,
    numberTracking,
    alertEmail,
    alertWebhook
  });

  // Execute first baseline check
  scheduler.runCheck(created.id).catch(err => {
    console.error(`Baseline check note for ${created.name}:`, err.message);
  });

  res.status(201).json({ monitor: created });
});

// Update monitor
apiRouter.put('/monitors/:id', (req, res) => {
  const updated = db.updateMonitor(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Monitor not found' });
  res.json({ monitor: updated });
});

// Delete monitor
apiRouter.delete('/monitors/:id', (req, res) => {
  const success = db.deleteMonitor(req.params.id);
  res.json({ success });
});

// Trigger immediate check for a monitor
apiRouter.post('/monitors/:id/check', async (req, res) => {
  try {
    const result = await scheduler.runCheck(req.params.id);
    const updated = db.getMonitor(req.params.id);
    const snapshots = db.getSnapshots(req.params.id);
    res.json({ result, monitor: updated, latestSnapshot: snapshots[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get version timeline snapshots
apiRouter.get('/monitors/:id/snapshots', (req, res) => {
  const snapshots = db.getSnapshots(req.params.id);
  res.json({ snapshots });
});

// Get incidents (Outages, CAPTCHAs, Blocks)
apiRouter.get('/monitors/:id/incidents', (req, res) => {
  const incidents = db.getIncidents(req.params.id);
  res.json({ incidents });
});

// Per-Page RSS Feed Generator
apiRouter.get('/monitors/:id/rss', (req, res) => {
  const monitor = db.getMonitor(req.params.id);
  if (!monitor) return res.status(404).send('Monitor not found');

  const snapshots = db.getSnapshots(monitor.id);
  const host = req.get('host') || 'localhost:3001';
  const protocol = req.protocol || 'http';
  const siteUrl = `${protocol}://${host}`;
  
  const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>${escapeXml(monitor.name)} - Website Change Detector</title>
  <link>${escapeXml(monitor.url)}</link>
  <description>Automated timeline of detected changes for ${escapeXml(monitor.url)}</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${snapshots.map((s, idx) => `
  <item>
    <title>Version ${snapshots.length - idx}: ${escapeXml(s.summary || 'Content Updated')}</title>
    <link>${siteUrl}/?monitor=${monitor.id}&amp;snap=${s.id}</link>
    <pubDate>${new Date(s.timestamp).toUTCString()}</pubDate>
    <description><![CDATA[
      <p><strong>Change Summary:</strong> ${s.summary}</p>
      <p><strong>Diff:</strong> +${s.diffStats?.addedLines || 0} / -${s.diffStats?.removedLines || 0} lines (${s.diffStats?.changedPercent || 0}%)</p>
      <p><strong>Hash:</strong> ${s.contentHash}</p>
      ${s.screenshotUrl && !s.screenshotUrl.startsWith('data:') ? `<p><img src="${siteUrl}${s.screenshotUrl}" alt="Snapshot Screenshot" style="max-width:500px;"/></p>` : ''}
    ]]></description>
  </item>`).join('\n')}
</channel>
</rss>`;

  res.set('Content-Type', 'application/xml');
  res.send(rssXml);
});

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// -------------------------------------------------------------
// DIFF & COMPARISON API
// -------------------------------------------------------------
apiRouter.post('/diff/compare', async (req, res) => {
  const { snapshotIdA, snapshotIdB } = req.body;
  if (!snapshotIdA || !snapshotIdB) {
    return res.status(400).json({ error: 'snapshotIdA and snapshotIdB are required' });
  }

  const snapA = db.getSnapshot(snapshotIdA);
  const snapB = db.getSnapshot(snapshotIdB);

  if (!snapA || !snapB) {
    return res.status(404).json({ error: 'One or both snapshots could not be found' });
  }

  // 1. Text Diff
  const textDiffResult = computeTextDiff(snapA.filteredText, snapB.filteredText);

  // 2. Visual Screenshot Diff
  let visualDiffResult = { hasDiff: false, diffPercentage: 0, diffImageUrl: null };
  if (snapA.screenshotUrl && snapB.screenshotUrl && !snapA.screenshotUrl.startsWith('data:') && !snapB.screenshotUrl.startsWith('data:')) {
    visualDiffResult = await computeVisualScreenshotDiff(snapA.screenshotUrl, snapB.screenshotUrl);
  }

  // 3. AI / NLP One-Line Summary
  const summary = generateChangeSummary(snapA.filteredText, snapB.filteredText, textDiffResult.stats);

  res.json({
    snapA,
    snapB,
    textDiff: textDiffResult,
    visualDiff: visualDiffResult,
    summary
  });
});

// -------------------------------------------------------------
// VISUAL REGION PICKER API
// -------------------------------------------------------------
apiRouter.post('/picker/inspect', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const result = await crawlWithBrowser(url, { timeoutMs: isVercel ? 8000 : 15000 });
    res.json({
      success: result.success,
      status: result.status,
      title: result.title,
      html: result.rawHtml,
      screenshotUrl: result.screenshotUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// ALERTS & NOTIFICATIONS API
// -------------------------------------------------------------
apiRouter.post('/alerts/test-webhook', async (req, res) => {
  const { webhookUrl, monitorName = 'Test Target' } = req.body;
  if (!webhookUrl) return res.status(400).json({ error: 'webhookUrl is required' });

  const host = req.get('host') || 'localhost:3001';
  const protocol = req.protocol || 'http';

  const testPayload = {
    monitorId: 'test-mon',
    monitorName,
    pageUrl: 'https://example.com/test-product',
    summary: 'TEST ALERT: Price decreased from $99.00 to $79.00 (-20%).',
    diffStats: { addedLines: 2, removedLines: 2, changedPercent: 12 },
    diffLink: `${protocol}://${host}/?view=diff&test=true`,
    timestamp: new Date().toISOString()
  };

  const success = await sendWebhookAlert(webhookUrl, testPayload);
  res.json({ success, message: success ? 'Webhook delivered successfully!' : 'Webhook delivery failed. Please check the URL format.' });
});

apiRouter.get('/digest', (req, res) => {
  const digest = generateDailyDigest();
  res.json({ digest });
});

apiRouter.get('/alerts/history', (req, res) => {
  const alerts = db.getAlerts(50);
  res.json({ alerts });
});

// Mount the API router at BOTH /api and / (ensures zero 404s on Vercel)
app.use('/api', apiRouter);
app.use(apiRouter);

// Fallback 404 for unhandled API and Mock calls
app.use(['/api', '/api/*', '/mock', '/mock/*'], (req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl || req.url}`,
    code: 'NOT_FOUND'
  });
});

// Global JSON error handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR'
  });
});

// Start scheduler only if not on Vercel
if (!isVercel) {
  scheduler.start();
  if (require.main === module || process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Website Change Detector Backend running on port ${PORT}`);
      console.log(`📡 Mock E-commerce Store: http://localhost:${PORT}/mock/store`);
      console.log(`📡 Mock News Portal:     http://localhost:${PORT}/mock/news`);
      console.log(`📡 Mock Outage/Status:   http://localhost:${PORT}/mock/status`);
      console.log(`=======================================================`);
    });
  }
}

module.exports = app;
