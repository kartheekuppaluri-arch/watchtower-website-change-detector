const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./db');
const scheduler = require('./engine/scheduler');
const { crawlWithBrowser, crawlWithHttp } = require('./engine/crawler');
const { computeTextDiff, computeVisualScreenshotDiff, generateChangeSummary, generateAiChangeSummary } = require('./engine/differ');
const { sendWebhookAlert, sendEmailAlert, generateDailyDigest } = require('./engine/alerts');
const { getSignedUrl } = require('./engine/storage');
const { setupMockRoutes } = require('./mockServer');

const app = express();
const PORT = process.env.PORT || 3001;
const isVercel = Boolean(process.env.VERCEL);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Static directory for snapshot screenshots (supports persistent disk if mounted)
const DATA_DIR = process.env.DATA_DIR || process.env.PERSISTENT_DATA_DIR || (isVercel ? path.join('/tmp', 'data') : path.join(__dirname, '..', 'data'));
const SCREENSHOTS_DIR = path.join(DATA_DIR, 'screenshots');

try {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[SERVER] Could not create screenshots directory, continuing:', e.message);
}

// Serve screenshots with permissive CORS so cross-origin frontends (e.g. Vercel) can render images safely
app.use('/api/screenshots', (req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.set('Cache-Control', 'public, max-age=86400');
  next();
}, express.static(SCREENSHOTS_DIR));

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
  const backendBase = `${protocol}://${host}`;
  const frontendBase = process.env.FRONTEND_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://watchtower-website-change-detector.vercel.app');
  
  const rssItems = snapshots.length === 0 
    ? `  <item>
    <title>${escapeXml(`${monitor.name} - Monitor Initialized`)}</title>
    <link>${escapeXml(`${frontendBase}/?monitor=${monitor.id}`)}</link>
    <guid isPermaLink="false">${escapeXml(`${monitor.id}-init`)}</guid>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <description><![CDATA[<p>Monitor configured. Waiting for scheduled crawl or manual check to capture initial baseline snapshot.</p>]]></description>
  </item>`
    : snapshots.map((s, idx) => {
        const isBaseline = idx === (snapshots.length - 1);
        const versionNum = snapshots.length - idx;
        const itemTitle = isBaseline 
          ? `v${versionNum} [Baseline]: Initial baseline recorded`
          : `v${versionNum} [Change Detected]: ${s.summary || 'Content updated'}`;
        const itemLink = `${frontendBase}/?monitor=${monitor.id}&amp;snap=${s.id}&amp;view=diff`;
        const screenshotImg = s.screenshotUrl
          ? (s.screenshotUrl.startsWith('http') || s.screenshotUrl.startsWith('data:') 
              ? s.screenshotUrl 
              : `${backendBase}${s.screenshotUrl}`)
          : null;

        return `  <item>
    <title>${escapeXml(itemTitle)}</title>
    <link>${escapeXml(itemLink)}</link>
    <guid isPermaLink="false">${escapeXml(`${monitor.id}-${s.id}`)}</guid>
    <pubDate>${new Date(s.timestamp).toUTCString()}</pubDate>
    <description><![CDATA[
      <p><strong>${isBaseline ? 'Baseline Details:' : 'Change Summary:'}</strong> ${escapeXml(s.summary || (isBaseline ? 'Initial snapshot captured' : 'Content updated'))}</p>
      ${!isBaseline ? `<p><strong>Diff Statistics:</strong> +${s.diffStats?.addedLines || 0} / -${s.diffStats?.removedLines || 0} lines (${s.diffStats?.changedPercent || 0}% change)</p>` : ''}
      <p><strong>Content Hash:</strong> <code>${escapeXml(s.contentHash)}</code></p>
      ${screenshotImg ? `<p><img src="${escapeXml(screenshotImg)}" alt="Snapshot Preview" style="max-width:550px; border-radius:6px;"/></p>` : ''}
      <p><a href="${escapeXml(itemLink)}">View interactive diff &amp; slider on WatchTower</a></p>
    ]]></description>
  </item>`;
      }).join('\n');

  const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(monitor.name)} - WatchTower Timeline</title>
  <link>${escapeXml(`${frontendBase}/?monitor=${monitor.id}`)}</link>
  <description>Automated timeline of detected changes for ${escapeXml(monitor.url)}</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <generator>WatchTower Website Change Detector</generator>
  <atom:link href="${escapeXml(`${backendBase}/api/monitors/${monitor.id}/rss`)}" rel="self" type="application/rss+xml" />
${rssItems}
</channel>
</rss>`;

  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
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

  // Generate fresh signed URLs for screenshots if stored in private Supabase bucket
  const enrichedSnapA = { ...snapA };
  const enrichedSnapB = { ...snapB };

  if (snapA.screenshotStoragePath) {
    const signedA = await getSignedUrl(snapA.screenshotStoragePath, 3600);
    if (signedA?.success && signedA?.signedUrl) {
      enrichedSnapA.screenshotSignedUrl = signedA.signedUrl;
    }
  }

  if (snapB.screenshotStoragePath) {
    const signedB = await getSignedUrl(snapB.screenshotStoragePath, 3600);
    if (signedB?.success && signedB?.signedUrl) {
      enrichedSnapB.screenshotSignedUrl = signedB.signedUrl;
    }
  }

  // 1. Text Diff
  const textDiffResult = computeTextDiff(snapA.filteredText, snapB.filteredText);

  // 2. Visual Screenshot Diff (supports Supabase Storage and local fallback)
  let visualDiffResult = { hasDiff: false, diffPercentage: 0, diffImageUrl: null, diffSignedUrl: null };
  const hasA = Boolean(snapA.screenshotStoragePath || (snapA.screenshotUrl && !snapA.screenshotUrl.startsWith('data:')));
  const hasB = Boolean(snapB.screenshotStoragePath || (snapB.screenshotUrl && !snapB.screenshotUrl.startsWith('data:')));

  if (hasA && hasB) {
    visualDiffResult = await computeVisualScreenshotDiff(
      snapA.screenshotUrl, 
      snapB.screenshotUrl,
      snapA.screenshotStoragePath,
      snapB.screenshotStoragePath
    );
  }

  // 3. AI / NLP One-Line Summary (Gemini with rule-based fallback)
  const fallbackSummary = generateChangeSummary(snapA.filteredText, snapB.filteredText, textDiffResult.stats);
  let summary = fallbackSummary;
  let summarySource = 'fallback';

  if (snapB.summary && snapB.summarySource && snapA.id !== snapB.id) {
    summary = snapB.summary;
    summarySource = snapB.summarySource;
  } else if (snapA.filteredText !== snapB.filteredText) {
    try {
      const aiResult = await generateAiChangeSummary({
        oldText: snapA.filteredText,
        newText: snapB.filteredText,
        diffStats: textDiffResult.stats,
        fallbackSummary
      });
      summary = aiResult.summary || fallbackSummary;
      summarySource = aiResult.summarySource || 'fallback';
    } catch (_) {}
  }

  res.json({
    snapA: enrichedSnapA,
    snapB: enrichedSnapB,
    textDiff: textDiffResult,
    visualDiff: visualDiffResult,
    summary,
    summarySource
  });
});

// Endpoint to generate or refresh a signed screenshot URL
apiRouter.get('/screenshots/signed/:snapshotId', async (req, res) => {
  const snapshot = db.getSnapshot(req.params.snapshotId);
  if (!snapshot) return res.status(404).json({ error: 'Snapshot not found' });

  if (snapshot.screenshotStoragePath) {
    const signed = await getSignedUrl(snapshot.screenshotStoragePath, 3600);
    if (signed?.success && signed?.signedUrl) {
      return res.json({ success: true, signedUrl: signed.signedUrl, storagePath: snapshot.screenshotStoragePath });
    }
  }

  // Fallback to local server URL
  const host = req.get('host') || 'localhost:3001';
  const protocol = req.protocol || 'http';
  const localUrl = snapshot.screenshotUrl ? `${protocol}://${host}${snapshot.screenshotUrl}` : null;
  res.json({ success: Boolean(localUrl), signedUrl: localUrl, storagePath: snapshot.screenshotStoragePath || null, fallback: true });
});

// -------------------------------------------------------------
// VISUAL REGION PICKER API
// -------------------------------------------------------------
apiRouter.post('/picker/inspect', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    let result = await crawlWithBrowser(url, { 
      timeoutMs: isVercel ? 8000 : 15000,
      allowHttpFallback: true 
    });

    if (!result?.success || !result?.rawHtml) {
      console.log(`[PICKER] Browser crawl incomplete, attempting HTTP fetch fallback for ${url}...`);
      const httpResult = await crawlWithHttp(url);
      if (httpResult?.rawHtml) {
        result = { 
          ...httpResult, 
          screenshotUrl: result?.screenshotUrl || '',
          screenshotStoragePath: result?.screenshotStoragePath || ''
        };
      }
    }

    let signedUrl = null;
    if (result?.screenshotStoragePath) {
      try {
        const signed = await getSignedUrl(result.screenshotStoragePath, 3600);
        if (signed?.success && signed?.signedUrl) signedUrl = signed.signedUrl;
      } catch (_) {}
    }

    res.json({
      success: Boolean(result?.rawHtml),
      status: result?.status || 200,
      title: result?.title || '',
      html: result?.rawHtml || '',
      screenshotUrl: signedUrl || result?.screenshotUrl || '',
      error: result?.incident?.message || null
    });
  } catch (err) {
    console.error('[PICKER ERROR]', err.message);
    try {
      const httpResult = await crawlWithHttp(url);
      return res.json({
        success: Boolean(httpResult?.rawHtml),
        status: httpResult?.status || 200,
        title: httpResult?.title || '',
        html: httpResult?.rawHtml || '',
        screenshotUrl: '',
        fallback: true
      });
    } catch (fallbackErr) {
      res.status(500).json({ error: err.message });
    }
  }
});

// -------------------------------------------------------------
// ALERTS & NOTIFICATIONS API
// -------------------------------------------------------------
apiRouter.post('/alerts/test-webhook', async (req, res) => {
  const { webhookUrl, monitorName = 'Test Monitor' } = req.body;
  if (!webhookUrl) return res.status(400).json({ error: 'webhookUrl is required' });

  const frontendBase = process.env.FRONTEND_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://watchtower-website-change-detector.vercel.app');

  const testPayload = {
    monitorId: 'test-mon',
    monitorName,
    pageUrl: 'https://example.com/test-product',
    summary: 'TEST ALERT: Price decreased from $99.00 to $79.00 (-20%). Stock status changed to In Stock.',
    diffStats: { addedLines: 2, removedLines: 2, changedPercent: 12 },
    diffLink: `${frontendBase}/?view=diff&test=true`,
    timestamp: new Date().toISOString()
  };

  const result = await sendWebhookAlert(webhookUrl, testPayload);
  const success = Boolean(result?.success);
  res.json({
    success,
    message: success
      ? `✅ Webhook delivered successfully! (HTTP ${result.status || 200})`
      : `❌ Webhook failed: ${result?.error || 'Unknown error. Check the URL and try again.'}`,
    details: result
  });
});

apiRouter.post('/alerts/test-email', async (req, res) => {
  const { email, monitorName = 'Test Monitor' } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const frontendBase = process.env.FRONTEND_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://watchtower-website-change-detector.vercel.app');

  const testPayload = {
    monitorName,
    pageUrl: 'https://example.com/test-product',
    summary: 'TEST EMAIL: Price decreased from $99.00 to $79.00 (-20%). Stock status changed to In Stock.',
    diffStats: { addedLines: 2, removedLines: 2, changedPercent: 12 },
    diffLink: `${frontendBase}/?view=diff&test=true`,
    timestamp: new Date().toISOString()
  };

  const result = await sendEmailAlert(email, testPayload);
  const success = Boolean(result?.success);
  res.json({
    success,
    message: success
      ? `✅ Email delivered via ${result.provider}! Check inbox for ${email}.`
      : result?.unconfigured
        ? `⚠️ Email unconfigured: ${result.error}`
        : `❌ Email failed: ${result?.error || 'Unknown error'}`,
    details: result
  });
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

// Start server and scheduler only if run directly and not on Vercel
if (!isVercel && require.main === module) {
  scheduler.start();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 Website Change Detector Backend running on port ${PORT}`);
    console.log(`📡 Mock E-commerce Store: http://localhost:${PORT}/mock/store`);
    console.log(`📡 Mock News Portal:     http://localhost:${PORT}/mock/news`);
    console.log(`📡 Mock Outage/Status:   http://localhost:${PORT}/mock/status`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
