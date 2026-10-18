const db = require('../db');
const { crawlWithBrowser } = require('./crawler');
const { extractAndFilterHtml, cleanTextNoise, computeContentHash, isChangeSignificant, extractNumericMetrics } = require('./noiseFilter');
const { computeTextDiff, generateChangeSummary, checkKeywordAlerts } = require('./differ');
const { dispatchAlerts } = require('./alerts');

/**
 * Question 4: "How to avoid hammering a site with requests?"
 * Per-domain queue and rate limiter enforcing polite crawl delays and concurrency limit of 1 per hostname
 */
class DomainRateLimiter {
  constructor(minDelayMs = 2000) {
    this.minDelayMs = minDelayMs;
    this.lastRequestTimes = new Map(); // hostname -> timestamp
    this.activeHostLocks = new Set(); // hostname in-flight
  }

  getHostname(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown-host';
    }
  }

  async acquireLock(url) {
    if (process.env.VERCEL) return; // Avoid delay in serverless functions
    const host = this.getHostname(url);
    // Wait until host is not busy
    while (this.activeHostLocks.has(host)) {
      await new Promise(r => setTimeout(r, 200));
    }

    // Check polite crawl delay
    const lastTime = this.lastRequestTimes.get(host) || 0;
    const now = Date.now();
    const elapsed = now - lastTime;
    if (elapsed < this.minDelayMs) {
      await new Promise(r => setTimeout(r, this.minDelayMs - elapsed));
    }

    this.activeHostLocks.add(host);
  }

  releaseLock(url) {
    const host = this.getHostname(url);
    this.lastRequestTimes.set(host, Date.now());
    this.activeHostLocks.delete(host);
  }
}

/**
 * Question 2: "If 200 users watch the same URL, is it fetched 200 times?"
 * Shared Fetch Deduplication & Coalescing Engine
 * Coalesces concurrent fetch requests for the exact same URL so only 1 browser instance crawls it.
 */
class FetchDeduplicator {
  constructor() {
    this.inFlightRequests = new Map(); // url -> Promise<CrawlResult>
  }

  async fetch(url, fetchFn) {
    if (this.inFlightRequests.has(url)) {
      console.log(`[FETCH COALESCING] Reusing in-flight crawl job for: ${url}`);
      return await this.inFlightRequests.get(url);
    }

    const promise = (async () => {
      try {
        return await fetchFn();
      } finally {
        this.inFlightRequests.delete(url);
      }
    })();

    this.inFlightRequests.set(url, promise);
    return await promise;
  }
}

class Scheduler {
  constructor() {
    this.rateLimiter = new DomainRateLimiter(process.env.VERCEL ? 0 : 1500);
    this.deduplicator = new FetchDeduplicator();
    this.isProcessingQueue = false;
    this.timer = null;
    this.maxRetries = process.env.VERCEL ? 1 : 2;
  }

  start() {
    if (this.timer || process.env.VERCEL) return;
    console.log('[SCHEDULER] Background monitor scheduler started.');
    // Check every 30 seconds for monitors due for checking
    this.timer = setInterval(() => {
      this.checkDueMonitors();
    }, 30000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async checkDueMonitors() {
    const monitors = db.getMonitors().filter(m => m.active);
    const now = Date.now();
    const results = [];

    for (const monitor of monitors) {
      const intervalMs = (monitor.intervalMinutes || 15) * 60 * 1000;
      const lastCheckTime = monitor.lastChecked ? new Date(monitor.lastChecked).getTime() : 0;
      if (now - lastCheckTime >= intervalMs || process.env.VERCEL) {
        try {
          const res = await this.runCheck(monitor.id);
          results.push({ id: monitor.id, name: monitor.name, res });
        } catch (err) {
          console.error(`Check failed for ${monitor.name}:`, err);
          results.push({ id: monitor.id, name: monitor.name, error: err.message });
        }
      }
    }
    return results;
  }

  /**
   * Run a single check for a monitor with retry logic, noise filtering, diffing, and alerts
   */
  async runCheck(monitorId) {
    const monitor = db.getMonitor(monitorId);
    if (!monitor) return { error: 'Monitor not found' };

    console.log(`[CRAWL] Starting check for "${monitor.name}" (${monitor.url})`);

    let crawlResult = null;
    let attempt = 0;
    let lastErr = null;
    const timeoutMs = process.env.VERCEL ? 8000 : 25000;

    // Retry loop with exponential backoff
    while (attempt <= this.maxRetries) {
      try {
        await this.rateLimiter.acquireLock(monitor.url);

        // Deduplicate fetch if another check for same URL is already running
        crawlResult = await this.deduplicator.fetch(monitor.url, async () => {
          return await crawlWithBrowser(monitor.url, { timeoutMs, monitorId: monitor.id });
        });

        this.rateLimiter.releaseLock(monitor.url);
        break; // Succeeded or handled
      } catch (err) {
        this.rateLimiter.releaseLock(monitor.url);
        lastErr = err;
        attempt++;
        if (attempt <= this.maxRetries) {
          const backoff = Math.pow(2, attempt) * 1000;
          console.warn(`[RETRY] Attempt ${attempt} failed for ${monitor.url}. Retrying in ${backoff}ms...`);
          await new Promise(r => setTimeout(r, backoff));
        }
      }
    }

    if (!crawlResult) {
      db.updateMonitor(monitorId, {
        status: 'ERROR',
        lastChecked: new Date().toISOString(),
        lastError: lastErr ? lastErr.message : 'Unknown crawler error'
      });
      return { success: false, error: 'Crawler failed' };
    }

    // 1. Check for Outage or CAPTCHA (Question 1)
    if (crawlResult.incident && crawlResult.incident.isIncident) {
      const inc = crawlResult.incident;
      console.warn(`[INCIDENT] ${inc.type} detected on ${monitor.name}: ${inc.message}`);
      
      db.addIncident({
        monitorId,
        type: inc.type,
        message: inc.message,
        httpStatus: crawlResult.status
      });

      db.updateMonitor(monitorId, {
        status: inc.type === 'CAPTCHA' || inc.type === 'BLOCKED' ? 'BLOCKED' : 'ERROR',
        lastChecked: new Date().toISOString(),
        lastError: inc.message
      });

      // Crucial: We DO NOT create a snapshot or trigger a content change alert on Outage/Captcha!
      return {
        success: false,
        incident: inc,
        status: inc.type
      };
    }

    // 2. Extract DOM & Filter Ignore Regions
    const { text: rawText } = extractAndFilterHtml(
      crawlResult.rawHtml,
      monitor.watchSelector,
      monitor.ignoreSelectors
    );

    // 3. Noise Filter (Timestamps, Counters, Random Tokens, User Custom Regex)
    const cleanedText = monitor.noiseFilterActive
      ? cleanTextNoise(rawText, {
          customRegex: monitor.customRegex,
          filterTimestamps: true,
          filterCounters: true
        })
      : rawText.trim();

    // 4. Compute Content Hash
    const contentHash = computeContentHash(cleanedText);
    const latestSnapshot = db.getLatestSnapshot(monitorId);

    const nowIso = new Date().toISOString();
    let changeDetected = false;
    let diffStats = { addedLines: 0, removedLines: 0, totalLines: 0, changedPercent: 0 };
    let summary = 'Initial baseline snapshot captured';
    let numericMetric = monitor.numberTracking ? extractNumericMetrics(cleanedText) : null;

    if (!latestSnapshot) {
      // First baseline snapshot
      changeDetected = true;
      const initialSnap = db.addSnapshot({
        monitorId,
        timestamp: nowIso,
        contentHash,
        textLength: cleanedText.length,
        textSnippet: cleanedText.slice(0, 300),
        rawText,
        filteredText: cleanedText,
        screenshotUrl: crawlResult.screenshotUrl,
        screenshotStoragePath: crawlResult.screenshotStoragePath || '',
        diffStats,
        summary: 'Initial baseline captured',
        numberValue: numericMetric
      });

      console.log(`[SCHEDULER] ✅ Saved baseline snapshot ${initialSnap.id} for "${monitor.name}" (Storage: ${initialSnap.screenshotStoragePath || 'none'}, URL: ${initialSnap.screenshotUrl || 'none'})`);

      db.updateMonitor(monitorId, {
        status: 'OK',
        lastChecked: nowIso,
        lastChanged: nowIso,
        lastError: null
      });

      return { success: true, changed: false, snapshot: initialSnap };
    }

    // Compare with latest snapshot
    if (latestSnapshot.contentHash !== contentHash) {
      // Content hash differs. Check if the difference is significant according to sensitivity setting!
      const isSignificant = isChangeSignificant(
        latestSnapshot.filteredText,
        cleanedText,
        monitor.sensitivity
      );

      if (isSignificant) {
        changeDetected = true;
        const diffResult = computeTextDiff(latestSnapshot.filteredText, cleanedText);
        diffStats = diffResult.stats;
        summary = generateChangeSummary(latestSnapshot.filteredText, cleanedText, diffStats);

        // Check for keyword alerts bonus
        const keywordAlerts = checkKeywordAlerts(latestSnapshot.filteredText, cleanedText, monitor.keywordAlerts);
        if (keywordAlerts.length > 0) {
          summary += ` [Keywords: ${keywordAlerts.map(k => k.keyword).join(', ')}]`;
        }

        // Store new snapshot (Requirement 3: "new snapshot is stored only when the content hash changes")
        const newSnapshot = db.addSnapshot({
          monitorId,
          timestamp: nowIso,
          contentHash,
          textLength: cleanedText.length,
          textSnippet: cleanedText.slice(0, 300),
          rawText,
          filteredText: cleanedText,
          screenshotUrl: crawlResult.screenshotUrl,
          screenshotStoragePath: crawlResult.screenshotStoragePath || '',
          diffStats,
          summary,
          numberValue: numericMetric
        });

        console.log(`[SCHEDULER] ✅ Saved changed snapshot ${newSnapshot.id} for "${monitor.name}" (Storage: ${newSnapshot.screenshotStoragePath || 'none'}, URL: ${newSnapshot.screenshotUrl || 'none'})`);

        // Dispatch alerts (Requirement 7)
        await dispatchAlerts(monitor, newSnapshot, diffStats);

        db.updateMonitor(monitorId, {
          status: 'CHANGED',
          lastChecked: nowIso,
          lastChanged: nowIso,
          lastError: null
        });

        return { success: true, changed: true, snapshot: newSnapshot, summary, diffStats };
      } else {
        console.log(`[NOISE SUPPRESSION] Diff detected for ${monitor.name} was below sensitivity threshold (${monitor.sensitivity}). Filtered as noise.`);
      }
    }

    // No meaningful change
    db.updateMonitor(monitorId, {
      status: 'OK',
      lastChecked: nowIso,
      lastError: null
    });

    return { success: true, changed: false, latestSnapshot };
  }
}

module.exports = new Scheduler();
