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

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Static directory for snapshot screenshots
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'data', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}
app.use('/api/screenshots', express.static(SCREENSHOTS_DIR));

// Serve production frontend bundle if built
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

// Setup Mock Web Server for testing
setupMockRoutes(app);


// -------------------------------------------------------------
// MONITOR API ENDPOINTS
// -------------------------------------------------------------

// List monitors
app.get('/api/monitors', (req, res) => {
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

// Get single monitor
app.get('/api/monitors/:id', (req, res) => {
  const monitor = db.getMonitor(req.params.id);
  if (!monitor) return res.status(404).json({ error: 'Monitor not found' });
  const snapshots = db.getSnapshots(monitor.id);
  const incidents = db.getIncidents(monitor.id);
  res.json({ monitor, snapshots, incidents });
});

// Create monitor
app.post('/api/monitors', (req, res) => {
  const { name, url, intervalMinutes, watchSelector, ignoreSelectors, sensitivity, noiseFilterActive, customRegex, keywordAlerts, numberTracking, alertEmail, alertWebhook } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const created = db.createMonitor({
    name: name || new URL(url).hostname,
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

  // Automatically queue first baseline check in background
  scheduler.runCheck(created.id).catch(err => {
    console.error(`Baseline check failed for ${created.name}:`, err);
  });

  res.status(201).json({ monitor: created });
});

// Update monitor
app.put('/api/monitors/:id', (req, res) => {
  const updated = db.updateMonitor(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Monitor not found' });
  res.json({ monitor: updated });
});

// Delete monitor
app.delete('/api/monitors/:id', (req, res) => {
  const success = db.deleteMonitor(req.params.id);
  res.json({ success });
});

// Trigger immediate check for a monitor
app.post('/api/monitors/:id/check', async (req, res) => {
  try {
    const result = await scheduler.runCheck(req.params.id);
    const updated = db.getMonitor(req.params.id);
    const snapshots = db.getSnapshots(req.params.id);
    res.json({ result, monitor: updated, latestSnapshot: snapshots[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger check for all monitors
app.post('/api/monitors/check-all', async (req, res) => {
  const monitors = db.getMonitors().filter(m => m.active);
  const results = [];
  for (const m of monitors) {
    try {
      const res = await scheduler.runCheck(m.id);
      results.push({ id: m.id, name: m.name, res });
    } catch (e) {
      results.push({ id: m.id, name: m.name, error: e.message });
    }
  }
  res.json({ message: `Triggered checks for ${monitors.length} monitors`, results });
});

// Get version timeline snapshots
app.get('/api/monitors/:id/snapshots', (req, res) => {
  const snapshots = db.getSnapshots(req.params.id);
  res.json({ snapshots });
});

// Get incidents (Outages, CAPTCHAs, Blocks)
app.get('/api/monitors/:id/incidents', (req, res) => {
  const incidents = db.getIncidents(req.params.id);
  res.json({ incidents });
});

// Bonus: Per-Page RSS Feed Generator
app.get('/api/monitors/:id/rss', (req, res) => {
  const monitor = db.getMonitor(req.params.id);
  if (!monitor) return res.status(404).send('Monitor not found');

  const snapshots = db.getSnapshots(monitor.id);
  
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
    <link>http://localhost:5173/?monitor=${monitor.id}&amp;snap=${s.id}</link>
    <pubDate>${new Date(s.timestamp).toUTCString()}</pubDate>
    <description><![CDATA[
      <p><strong>Change Summary:</strong> ${s.summary}</p>
      <p><strong>Diff:</strong> +${s.diffStats?.addedLines || 0} / -${s.diffStats?.removedLines || 0} lines (${s.diffStats?.changedPercent || 0}%)</p>
      <p><strong>Hash:</strong> ${s.contentHash}</p>
      ${s.screenshotUrl ? `<p><img src="http://localhost:3001${s.screenshotUrl}" alt="Snapshot Screenshot" style="max-width:500px;"/></p>` : ''}
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

// Compare any two snapshots (Requirement 6: Text diff, visual screenshot diff, side-by-side)
app.post('/api/diff/compare', async (req, res) => {
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
  if (snapA.screenshotUrl && snapB.screenshotUrl) {
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

// Inspect page to extract HTML & DOM structure for visual selector picker
app.post('/api/picker/inspect', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const result = await crawlWithBrowser(url, { timeoutMs: 15000 });
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

// Test Webhook delivery
app.post('/api/alerts/test-webhook', async (req, res) => {
  const { webhookUrl, monitorName = 'Test Target' } = req.body;
  if (!webhookUrl) return res.status(400).json({ error: 'webhookUrl is required' });

  const testPayload = {
    monitorId: 'test-mon',
    monitorName,
    pageUrl: 'https://example.com/test-product',
    summary: 'TEST ALERT: Price decreased from $99.00 to $79.00 (-20%).',
    diffStats: { addedLines: 2, removedLines: 2, changedPercent: 12 },
    diffLink: 'http://localhost:5173/?view=diff&test=true',
    timestamp: new Date().toISOString()
  };

  const success = await sendWebhookAlert(webhookUrl, testPayload);
  res.json({ success, message: success ? 'Webhook delivered successfully!' : 'Webhook delivery failed. Please check the URL format.' });
});

// Daily Digest summary
app.get('/api/digest', (req, res) => {
  const digest = generateDailyDigest();
  res.json({ digest });
});

// Alerts audit history
app.get('/api/alerts/history', (req, res) => {
  const alerts = db.getAlerts(50);
  res.json({ alerts });
});

// Start scheduler and listen
scheduler.start();

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Website Change Detector Backend running on port ${PORT}`);
  console.log(`📡 Mock E-commerce Store: http://localhost:${PORT}/mock/store`);
  console.log(`📡 Mock News Portal:     http://localhost:${PORT}/mock/news`);
  console.log(`📡 Mock Outage/Status:   http://localhost:${PORT}/mock/status`);
  console.log(`=======================================================`);
});
