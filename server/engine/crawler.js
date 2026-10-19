let puppeteer = null;
try {
  puppeteer = require('puppeteer');
} catch (_) {
  try {
    puppeteer = require('puppeteer-core');
  } catch (e) {
    console.warn('[CRAWLER] Neither puppeteer nor puppeteer-core found:', e.message);
  }
}

const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PNG } = require('pngjs');
const { uploadScreenshot } = require('./storage');

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = process.env.DATA_DIR || process.env.PERSISTENT_DATA_DIR || (isVercel ? path.join('/tmp', 'data') : path.join(__dirname, '..', '..', 'data'));
const SCREENSHOTS_DIR = path.join(DATA_DIR, 'screenshots');

function resolveUrl(url) {
  if (!url) return '';
  const port = process.env.PORT || 3001;
  const localOrigin = `http://localhost:${port}`;

  // Support relative mock URLs or localhost URLs in deployed environments
  if (url.startsWith('/')) {
    const origin = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : (process.env.BACKEND_URL || localOrigin);
    return `${origin}${url}`;
  }

  if (process.env.VERCEL_URL && (url.includes('localhost:3001') || url.includes(`localhost:${port}`))) {
    return url.replace(/http:\/\/localhost:(?:3001|\d+)/, `https://${process.env.VERCEL_URL}`);
  }

  // If running on non-3001 port (e.g. Render PORT=10000), rewrite localhost:3001 to active port
  if (url.includes('localhost:3001') && String(port) !== '3001') {
    return url.replace('http://localhost:3001', localOrigin);
  }

  return url;
}

function findExecutableInDir(dir, depth = 0, maxDepth = 8) {
  if (!dir || depth > maxDepth) return null;
  try {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        const res = findExecutableInDir(full, depth + 1, maxDepth);
        if (res) return res;
      } else {
        const isExe = file === 'chrome' || file === 'chrome.exe' || file === 'chromium' || file === 'chromium.exe';
        if (isExe) {
          if (process.platform !== 'win32') {
            try { fs.chmodSync(full, 0o755); } catch (_) {}
          }
          return full;
        }
      }
    }
  } catch (_) {}
  return null;
}

// Auto-detect browser executable across Render/Linux, Windows, and macOS
async function getBrowserExecutablePath() {
  // 1. Explicit environment variable: PUPPETEER_EXECUTABLE_PATH
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    const customPath = process.env.PUPPETEER_EXECUTABLE_PATH.trim();
    if (fs.existsSync(customPath)) {
      if (process.platform !== 'win32') {
        try { fs.chmodSync(customPath, 0o755); } catch (_) {}
      }
      console.log(`[CRAWLER] Using PUPPETEER_EXECUTABLE_PATH: ${customPath}`);
      return customPath;
    }
    console.warn(`[CRAWLER] Configured PUPPETEER_EXECUTABLE_PATH does not exist: ${customPath}`);
  }

  // 2. Explicit environment variable: CHROME_BIN
  if (process.env.CHROME_BIN) {
    const customBin = process.env.CHROME_BIN.trim();
    if (fs.existsSync(customBin)) {
      if (process.platform !== 'win32') {
        try { fs.chmodSync(customBin, 0o755); } catch (_) {}
      }
      console.log(`[CRAWLER] Using CHROME_BIN: ${customBin}`);
      return customBin;
    }
    console.warn(`[CRAWLER] Configured CHROME_BIN does not exist: ${customBin}`);
  }

  // 3. On Windows: Check installed Chrome/Edge in Program Files first (guaranteed complete V8 snapshot & DLLs)
  if (process.platform === 'win32') {
    const winCandidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
    ];
    for (const p of winCandidates) {
      try {
        if (p && fs.existsSync(p)) return p;
      } catch (_) {}
    }
  }

  // 4. Check Puppeteer's own executablePath resolution (reads puppeteer.config.cjs in project workspace)
  if (puppeteer && typeof puppeteer.executablePath === 'function') {
    try {
      const pPath = await Promise.resolve(puppeteer.executablePath());
      if (pPath && fs.existsSync(pPath)) {
        if (process.platform !== 'win32') {
          try { fs.chmodSync(pPath, 0o755); } catch (_) {}
        }
        console.log(`[CRAWLER] Puppeteer resolved executablePath: ${pPath}`);
        return pPath;
      }
    } catch (_) {}
  }

  // 5. Scan standard cache directories where Puppeteer installs Chromium (Render, Linux, Docker, Workspace)
  const cacheRoots = [
    path.join(process.cwd(), '.cache', 'puppeteer'),
    path.join(__dirname, '..', '..', '.cache', 'puppeteer'),
    '/opt/render/project/src/.cache/puppeteer',
    '/opt/render/.cache/puppeteer',
    path.join(process.env.HOME || '', '.cache', 'puppeteer'),
    path.join(process.env.USERPROFILE || '', '.cache', 'puppeteer')
  ];

  for (const root of cacheRoots) {
    try {
      if (root && fs.existsSync(root)) {
        const found = findExecutableInDir(root, 0, 8);
        if (found) {
          if (process.platform !== 'win32') {
            try { fs.chmodSync(found, 0o755); } catch (_) {}
          }
          console.log(`[CRAWLER] Discovered browser executable in cache root (${root}): ${found}`);
          return found;
        }
      }
    } catch (_) {}
  }

  // 6. Scan system browser candidates on Linux / macOS
  const candidates = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  ];

  for (const candidate of candidates) {
    try {
      if (candidate && fs.existsSync(candidate)) {
        console.log(`[CRAWLER] Using system browser binary: ${candidate}`);
        return candidate;
      }
    } catch (_) {}
  }

  return null;
}

/**
 * Detects whether page response is an outage or CAPTCHA challenge
 * Answers Core Question 1: "Is a site outage or CAPTCHA a change?"
 */
function inspectForOutageOrCaptcha(status, html, pageTitle = '') {
  const lowerHtml = (html || '').toLowerCase();
  const lowerTitle = (pageTitle || '').toLowerCase();

  // 1. HTTP Outage codes
  if (status >= 500 && status <= 599) {
    return {
      isIncident: true,
      type: 'OUTAGE',
      message: `HTTP ${status} Server Outage detected (${pageTitle || 'Service Unavailable'})`
    };
  }

  // 1b. Browser Network Error & Interstitial Outage pages (ERR_CONNECTION_REFUSED, etc.)
  if (
    lowerHtml.includes('err_connection_refused') ||
    lowerHtml.includes('err_name_not_resolved') ||
    lowerHtml.includes('err_connection_timed_out') ||
    lowerHtml.includes('err_connection_reset') ||
    lowerHtml.includes('err_ssl_protocol_error') ||
    lowerHtml.includes('this site can’t be reached') ||
    lowerHtml.includes('this site can\'t be reached') ||
    lowerHtml.includes('server ip address could not be found') ||
    lowerTitle.includes('site can’t be reached') ||
    lowerTitle.includes('site can\'t be reached') ||
    lowerTitle.includes('chromewebdata')
  ) {
    return {
      isIncident: true,
      type: 'OUTAGE',
      message: 'Website unreachable or connection refused (Network Error)'
    };
  }

  // 2. Cloudflare / Bot Management Challenge
  if (
    lowerHtml.includes('cf-browser-verification') ||
    lowerHtml.includes('checking your browser before accessing') ||
    lowerHtml.includes('just a moment...') ||
    lowerTitle.includes('just a moment...') ||
    lowerHtml.includes('turnstile') ||
    lowerHtml.includes('challenges.cloudflare.com')
  ) {
    return {
      isIncident: true,
      type: 'CAPTCHA',
      message: 'Cloudflare / Turnstile bot challenge screen encountered'
    };
  }

  // 3. Google reCAPTCHA / hCaptcha challenge
  if (
    (lowerHtml.includes('g-recaptcha') || lowerHtml.includes('h-captcha')) &&
    (status === 403 || lowerHtml.includes('complete the security check') || lowerHtml.includes('unusual traffic'))
  ) {
    return {
      isIncident: true,
      type: 'CAPTCHA',
      message: 'CAPTCHA verification challenge detected'
    };
  }

  // 4. Access Denied / 403 Forbidden
  if (status === 403 || lowerTitle.includes('403 forbidden') || lowerTitle.includes('access denied')) {
    return {
      isIncident: true,
      type: 'BLOCKED',
      message: 'HTTP 403 Access Denied or WAF block'
    };
  }

  return { isIncident: false };
}

// Global concurrency limiter for browser crawls to prevent CPU/RAM exhaustion on Render
class BrowserConcurrencyLimiter {
  constructor(maxConcurrent = 1) {
    this.maxConcurrent = maxConcurrent;
    this.running = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return;
    }
    await new Promise(resolve => this.queue.push(resolve));
    this.running++;
  }

  release() {
    this.running = Math.max(0, this.running - 1);
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next();
    }
  }
}

const browserLimiter = new BrowserConcurrencyLimiter(1);

/**
 * Crawl a page using headless browser (Puppeteer) with full SPA hydration and validated screenshot capture
 */
async function crawlWithBrowser(url, options = {}) {
  url = resolveUrl(url);
  const monitorId = options.monitorId || 'general';
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs || 25000;
  const deadline = startTime + timeoutMs;
  const getTimeLeft = () => Math.max(0, deadline - Date.now());

  const diagnostics = {
    targetUrl: url.replace(/([?&](?:api_key|token|auth|key|secret|password)=)[^&]+/gi, '$1***'),
    crawlMode: 'browser',
    timings: {
      launchMs: 0,
      navigationMs: 0,
      renderStabilizationMs: 0,
      screenshotCaptureMs: 0,
      screenshotUploadMs: 0,
      totalDurationMs: 0
    },
    timedOutStage: null,
    fallbackAttempted: false,
    fallbackSucceeded: false
  };

  let execPath = await getBrowserExecutablePath();
  if (!execPath) {
    if (process.platform === 'linux' && !process.env.VERCEL) {
      console.log(`[CRAWLER] Browser binary not found at runtime. Attempting emergency workspace install...`);
      try {
        const { execSync } = require('child_process');
        const workspaceCache = path.join(process.cwd(), '.cache', 'puppeteer');
        if (!fs.existsSync(workspaceCache)) {
          fs.mkdirSync(workspaceCache, { recursive: true });
        }
        execSync('npx puppeteer browsers install chrome', {
          stdio: 'inherit',
          env: { ...process.env, PUPPETEER_CACHE_DIR: workspaceCache },
          timeout: 60000
        });
        execPath = await getBrowserExecutablePath();
      } catch (runtimeInstallErr) {
        console.error(`[CRAWLER] Runtime browser install attempt failed: ${runtimeInstallErr.message}`);
      }
    }
  }

  if (!execPath) {
    console.error(`[CRAWLER ERROR] No headless browser binary detected at runtime for: ${diagnostics.targetUrl}`);
    if (options.allowHttpFallback !== false) {
      console.log(`[CRAWLER] Executable missing; falling back to Cheerio HTTP crawl for: ${diagnostics.targetUrl}`);
      diagnostics.fallbackAttempted = true;
      const httpRes = await crawlWithHttp(url, options);
      diagnostics.fallbackSucceeded = Boolean(httpRes?.success);
      diagnostics.crawlMode = 'http_fallback';
      diagnostics.timings.totalDurationMs = Date.now() - startTime;
      return { ...httpRes, crawlMode: 'http_fallback', diagnostics };
    }
    return {
      success: false,
      status: 0,
      title: 'Browser Unavailable',
      rawHtml: '',
      screenshotUrl: '',
      screenshotFullPath: '',
      screenshotStoragePath: '',
      crawlMode: 'browser',
      diagnostics,
      incident: {
        isIncident: true,
        type: 'BROWSER_UNAVAILABLE',
        message: 'No headless Chrome executable found in runtime. Build command must install Chrome into workspace .cache/puppeteer.'
      }
    };
  }

  console.log(`[CRAWLER] Launching headless Chrome for: ${diagnostics.targetUrl} (monitor: ${monitorId}, budget: ${timeoutMs}ms)`);

  try {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('[CRAWLER] Could not create screenshots dir, continuing:', e.message);
  }

  let browser = null;
  let page = null;

  await browserLimiter.acquire();

  try {
    const tLaunchStart = Date.now();
    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1280,800',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-component-update',
      '--disable-domain-reliability',
      '--disable-sync',
      '--mute-audio',
      ...(process.platform !== 'win32' ? ['--single-process'] : [])
    ];

    browser = await puppeteer.launch({
      executablePath: execPath,
      headless: true,
      protocolTimeout: 60000,
      defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
      args: launchArgs
    });

    page = await browser.newPage();
    diagnostics.timings.launchMs = Date.now() - tLaunchStart;

    // Suppress unhandled page runtime errors so third-party scripts cannot crash the crawler
    page.on('error', () => {});
    page.on('pageerror', () => {});

    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    }).catch(() => {});

    let responseStatus = 200;
    // Track HTTP response status strictly from the main document navigation
    page.on('response', response => {
      try {
        const req = response.request();
        if (req && typeof req.isNavigationRequest === 'function' && req.isNavigationRequest()) {
          const frame = req.frame();
          if (!frame || frame === page.mainFrame()) {
            responseStatus = response.status();
          }
        }
      } catch (_) {}
    });

    // 1. Navigate to page with dynamically bounded timeout
    const tNavStart = Date.now();
    // Reserve at least 6s for render stabilization, screenshot, and storage upload
    const navTimeout = Math.min(15000, Math.max(3000, getTimeLeft() - 6000));
    let navSucceeded = false;
    let navError = null;

    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: navTimeout
      });
      if (response) {
        responseStatus = response.status();
      }
      navSucceeded = true;
    } catch (gotoErr) {
      navError = gotoErr;
      const isTimeout = gotoErr.name === 'TimeoutError' || gotoErr.message.includes('timed out');
      if (isTimeout) {
        diagnostics.timedOutStage = 'navigation';
      }
      console.warn(`[CRAWLER] Navigation note for ${diagnostics.targetUrl} (${isTimeout ? 'timed out after ' + navTimeout + 'ms' : gotoErr.message}). Inspecting DOM for recovered content...`);
    }
    diagnostics.timings.navigationMs = Date.now() - tNavStart;

    // 2. Recover or verify page content
    let rawHtml = '';
    let title = '';
    try {
      rawHtml = await page.content();
      title = await page.title();
    } catch (_) {}

    // If navigation threw but we received significant HTML, treat as salvaged navigation
    // ONLY if it is not an internal browser network error (e.g. ERR_CONNECTION_REFUSED)
    const isFatalNetError = navError && (
      navError.message.includes('net::ERR_') ||
      navError.message.includes('ERR_CONNECTION_') ||
      navError.message.includes('ERR_NAME_NOT_RESOLVED')
    );

    if (!navSucceeded) {
      if (!isFatalNetError && rawHtml && rawHtml.length > 500 && (rawHtml.includes('<body') || rawHtml.includes('<div') || rawHtml.includes('<html'))) {
        console.log(`[CRAWLER] ✅ Successfully salvaged ${rawHtml.length} bytes of rendered DOM for ${diagnostics.targetUrl} despite navigation event timeout.`);
        diagnostics.timedOutStage = 'navigation_recovered';
      } else {
        // Real navigation failure or unreachable destination
        throw navError || new Error('Navigation failed and no DOM content could be retrieved');
      }
    }

    // 3. Render and font stabilization with bounded time
    const tRenderStart = Date.now();
    const renderTimeBudget = Math.min(2500, Math.max(200, getTimeLeft() - 4000));
    if (renderTimeBudget > 400) {
      await Promise.race([
        page.evaluate(() => {
          return Promise.all([
            document.readyState === 'complete' ? Promise.resolve() : new Promise(r => window.addEventListener('load', r, { once: true })),
            document.fonts ? document.fonts.ready : Promise.resolve()
          ]);
        }),
        new Promise(r => setTimeout(r, renderTimeBudget))
      ]).catch(() => {});
    }

    // 4. If watchSelector is specified, wait for it with bounded timeout
    const selectorBudget = Math.min(2500, Math.max(0, getTimeLeft() - 3500));
    if (options.watchSelector && options.watchSelector.trim() && selectorBudget > 300) {
      await page.waitForSelector(options.watchSelector.trim(), {
        visible: true,
        timeout: selectorBudget
      }).catch(() => {});
    }

    // 5. Wait for SPA hydration / non-empty body content with remaining budget
    const hydrationBudget = Math.min(2000, Math.max(0, getTimeLeft() - 3000));
    if (hydrationBudget > 300) {
      await page.waitForFunction(() => {
        const b = document.body;
        if (!b) return false;
        const t = b.innerText ? b.innerText.trim() : '';
        const root = document.getElementById('root') || document.getElementById('app') || document.querySelector('main');
        return t.length > 0 || (root && root.childElementCount > 0);
      }, { timeout: hydrationBudget }).catch(() => {});
    }

    // Short stabilization pause for layout settling if time permits
    if (getTimeLeft() > 2500) {
      await new Promise(r => setTimeout(r, 150));
    }
    diagnostics.timings.renderStabilizationMs = Date.now() - tRenderStart;

    // Refresh final DOM and title after stabilization
    try {
      rawHtml = await page.content();
      title = await page.title();
    } catch (_) {}

    // Check for Outage, CAPTCHA, or Bot Protection challenge BEFORE taking screenshot
    const incidentCheck = inspectForOutageOrCaptcha(responseStatus, rawHtml, title);

    // 6. Capture screenshot with bounded timeout
    const tShotStart = Date.now();
    const shotBudget = Math.min(6000, Math.max(1500, getTimeLeft() - 2000));
    let screenshotBuffer = null;

    try {
      screenshotBuffer = await Promise.race([
        page.screenshot({ fullPage: false }),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Screenshot capture timed out after ${shotBudget}ms`)), shotBudget))
      ]);
    } catch (shotErr) {
      console.warn(`[CRAWLER] Screenshot capture warning for ${diagnostics.targetUrl}:`, shotErr.message);
      if (!diagnostics.timedOutStage && shotErr.message.includes('timed out')) {
        diagnostics.timedOutStage = 'screenshot_capture';
      }
    }
    diagnostics.timings.screenshotCaptureMs = Date.now() - tShotStart;

    let screenshotUrl = '';
    let screenshotFullPath = '';
    let screenshotStoragePath = '';

    if (screenshotBuffer) {
      // Validate screenshot buffer pixels
      let nonUniformPixels = 0;
      let nonUniformRatio = 0;
      try {
        const png = PNG.sync.read(screenshotBuffer);
        const totalPixels = png.width * png.height;
        const r0 = png.data[0];
        const g0 = png.data[1];
        const b0 = png.data[2];
        for (let i = 0; i < png.data.length; i += 4) {
          if (Math.abs(png.data[i] - r0) > 10 || Math.abs(png.data[i+1] - g0) > 10 || Math.abs(png.data[i+2] - b0) > 10) {
            nonUniformPixels++;
          }
        }
        nonUniformRatio = (nonUniformPixels / totalPixels) * 100;
      } catch (pngErr) {
        console.warn('[CRAWLER] PNG validation warning:', pngErr.message);
      }

      const screenshotFilename = `snap-${Date.now()}-${uuidv4().slice(0, 6)}.png`;
      screenshotFullPath = path.join(SCREENSHOTS_DIR, screenshotFilename);
      fs.writeFileSync(screenshotFullPath, screenshotBuffer);

      console.log(`[CRAWLER] Captured real screenshot for ${diagnostics.targetUrl}: ${screenshotFilename} (${screenshotBuffer.length} bytes, ${nonUniformRatio.toFixed(1)}% content pixels)`);
      screenshotUrl = `/api/screenshots/${screenshotFilename}`;

      // 7. Upload screenshot to Supabase Storage with bounded budget
      const tUploadStart = Date.now();
      const uploadBudget = Math.min(8000, Math.max(1500, getTimeLeft()));
      const remotePath = `monitors/${monitorId}/${screenshotFilename}`;

      try {
        const uploadRes = await Promise.race([
          uploadScreenshot(screenshotBuffer, remotePath),
          new Promise(resolve => setTimeout(() => resolve({ success: false, error: `Upload timed out after ${uploadBudget}ms` }), uploadBudget))
        ]);
        if (uploadRes?.success) {
          screenshotStoragePath = uploadRes.storagePath;
          console.log(`[CRAWLER] Supabase Storage upload succeeded: ${screenshotStoragePath}`);
        } else {
          console.log(`[CRAWLER] Supabase Storage upload note: ${uploadRes?.error || 'Local storage used'}`);
        }
      } catch (uploadErr) {
        console.warn('[CRAWLER] Supabase screenshot upload exception:', uploadErr.message);
      }
      diagnostics.timings.screenshotUploadMs = Date.now() - tUploadStart;
    }

    diagnostics.timings.totalDurationMs = Date.now() - startTime;
    console.log(`[CRAWLER] Completed browser crawl for ${diagnostics.targetUrl} in ${diagnostics.timings.totalDurationMs}ms (nav: ${diagnostics.timings.navigationMs}ms, render: ${diagnostics.timings.renderStabilizationMs}ms, shot: ${diagnostics.timings.screenshotCaptureMs}ms)`);

    return {
      success: !incidentCheck.isIncident,
      status: responseStatus,
      title,
      rawHtml,
      screenshotUrl,
      screenshotFullPath,
      screenshotStoragePath,
      crawlMode: 'browser',
      diagnostics,
      incident: incidentCheck
    };
  } catch (err) {
    diagnostics.timings.totalDurationMs = Date.now() - startTime;
    const isTimeout = err.name === 'TimeoutError' || err.message.includes('timed out');
    if (!diagnostics.timedOutStage && isTimeout) {
      diagnostics.timedOutStage = 'navigation';
    }

    console.error(`[CRAWLER ERROR] Exception during browser crawl for ${diagnostics.targetUrl} (stage: ${diagnostics.timedOutStage || 'execution'}):`, err.message);

    // Fallback to HTTP + Cheerio if permitted and browser failed
    if (options.allowHttpFallback !== false) {
      console.log(`[CRAWLER] Attempting Cheerio HTTP fallback for: ${diagnostics.targetUrl}...`);
      diagnostics.fallbackAttempted = true;
      try {
        const httpRes = await crawlWithHttp(url, options);
        diagnostics.fallbackSucceeded = Boolean(httpRes?.success && httpRes?.rawHtml);
        diagnostics.timings.totalDurationMs = Date.now() - startTime;
        if (httpRes?.success) {
          console.log(`[CRAWLER] ✅ Cheerio HTTP fallback succeeded for: ${diagnostics.targetUrl}`);
          return {
            ...httpRes,
            crawlMode: 'http_fallback',
            diagnostics
          };
        }
      } catch (fallbackErr) {
        console.error(`[CRAWLER] Cheerio HTTP fallback also failed: ${fallbackErr.message}`);
      }
    }

    return {
      success: false,
      status: 0,
      title: 'Error',
      rawHtml: '',
      screenshotUrl: '',
      screenshotFullPath: '',
      screenshotStoragePath: '',
      crawlMode: 'browser',
      diagnostics,
      incident: {
        isIncident: true,
        type: isTimeout ? 'TIMEOUT' : 'OUTAGE',
        message: `Crawl failed at ${diagnostics.timedOutStage || 'stage'}: ${err.message}`
      }
    };
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (pageCloseErr) {
        console.warn('[CRAWLER] Error closing page:', pageCloseErr.message);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.warn('[CRAWLER] Error closing browser:', closeErr.message);
      }
    }
    browserLimiter.release();
  }
}

/**
 * Fast HTTP fetch fallback if browser is not required or unavailable
 */
async function crawlWithHttp(url, options = {}) {
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs || 10000;
  const targetUrl = resolveUrl(url);
  const cleanUrl = targetUrl.replace(/([?&](?:api_key|token|auth|key|secret|password)=)[^&]+/gi, '$1***');

  const diagnostics = {
    targetUrl: cleanUrl,
    crawlMode: 'http',
    timings: {
      totalDurationMs: 0
    },
    timedOutStage: null
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    clearTimeout(timer);

    const rawHtml = await res.text();
    let title = '';
    try {
      const $ = cheerio.load(rawHtml);
      title = $('title').text() || '';
    } catch (_) {}

    const incidentCheck = inspectForOutageOrCaptcha(res.status, rawHtml, title);
    diagnostics.timings.totalDurationMs = Date.now() - startTime;

    return {
      success: !incidentCheck.isIncident,
      status: res.status,
      title,
      rawHtml,
      screenshotUrl: '',
      screenshotFullPath: '',
      screenshotStoragePath: '',
      crawlMode: 'http',
      diagnostics,
      incident: incidentCheck
    };
  } catch (err) {
    diagnostics.timings.totalDurationMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError' || err.message.includes('abort') || err.message.includes('timeout');
    if (isTimeout) {
      diagnostics.timedOutStage = 'http_fetch';
    }

    return {
      success: false,
      status: 0,
      title: 'Error',
      rawHtml: '',
      screenshotUrl: '',
      screenshotFullPath: '',
      screenshotStoragePath: '',
      crawlMode: 'http',
      diagnostics,
      incident: {
        isIncident: true,
        type: isTimeout ? 'TIMEOUT' : 'OUTAGE',
        message: `HTTP Fetch failed: ${err.message}`
      }
    };
  }
}

module.exports = {
  crawlWithBrowser,
  crawlWithHttp,
  inspectForOutageOrCaptcha,
  getBrowserExecutablePath,
  browserLimiter
};
