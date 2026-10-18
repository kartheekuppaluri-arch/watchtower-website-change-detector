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
  // Support relative mock URLs or localhost URLs in deployed environments
  if (url.startsWith('/')) {
    const origin = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : (process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}`);
    return `${origin}${url}`;
  }
  if (process.env.VERCEL_URL && url.includes('localhost:3001')) {
    return url.replace('http://localhost:3001', `https://${process.env.VERCEL_URL}`);
  }
  return url;
}

function findExecutableInDir(dir, depth = 0) {
  if (depth > 5) return null;
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        const res = findExecutableInDir(full, depth + 1);
        if (res) return res;
      } else {
        const isExe = file === 'chrome' || file === 'chrome.exe' || file === 'chromium' || file === 'chromium.exe';
        if (isExe) return full;
      }
    }
  } catch (_) {}
  return null;
}

// Auto-detect browser executable across Render/Linux, Windows, and macOS
async function getBrowserExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }

  // On Windows: Check installed Chrome/Edge in Program Files first (guaranteed complete V8 snapshot & DLLs)
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

  // 1. Check Puppeteer's own executablePath resolution
  if (puppeteer && typeof puppeteer.executablePath === 'function') {
    try {
      const pPath = await Promise.resolve(puppeteer.executablePath());
      if (pPath && fs.existsSync(pPath)) {
        return pPath;
      }
    } catch (_) {}
  }

  // 2. Scan standard cache directories where Puppeteer installs Chromium (Render, Linux, Docker)
  const cacheRoots = [
    '/opt/render/project/src/.cache/puppeteer',
    '/opt/render/.cache/puppeteer',
    path.join(process.env.HOME || '', '.cache', 'puppeteer'),
    path.join(process.cwd(), '.cache', 'puppeteer'),
    path.join(process.env.USERPROFILE || '', '.cache', 'puppeteer')
  ];

  for (const root of cacheRoots) {
    try {
      if (root && fs.existsSync(root)) {
        const found = findExecutableInDir(root);
        if (found) return found;
      }
    } catch (_) {}
  }

  // 3. Scan system browser candidates on Linux / macOS
  const candidates = [
    // Linux / Render / Docker / Debian paths
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    // macOS paths
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  ];

  for (const candidate of candidates) {
    try {
      if (candidate && fs.existsSync(candidate)) {
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

/**
 * Crawl a page using headless browser (Puppeteer) with full SPA hydration and validated screenshot capture
 */
async function crawlWithBrowser(url, options = {}) {
  url = resolveUrl(url);
  const execPath = await getBrowserExecutablePath();
  if (!execPath) {
    console.log(`[CRAWLER] No headless browser binary detected in runtime; using Cheerio HTTP fetch for: ${url}`);
    return await crawlWithHttp(url, options);
  }

  try {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('[CRAWLER] Could not create screenshots dir, continuing:', e.message);
  }

  const timeoutMs = options.timeoutMs || 25000;
  let browser = null;

  try {
    browser = await puppeteer.launch({
      executablePath: execPath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--window-size=1280,800'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    });

    let responseStatus = 200;
    page.on('response', response => {
      if (response.url() === url || response.status() >= 400) {
        responseStatus = response.status();
      }
    });

    // 1. Navigate to page with dual event wait
    const response = await page.goto(url, {
      waitUntil: ['domcontentloaded', 'networkidle2'],
      timeout: timeoutMs
    });

    if (response) {
      responseStatus = response.status();
    }

    // 2. Wait for document and fonts to fully complete
    await page.evaluate(() => {
      return Promise.all([
        document.readyState === 'complete' ? Promise.resolve() : new Promise(r => window.addEventListener('load', r, { once: true })),
        document.fonts ? document.fonts.ready : Promise.resolve()
      ]);
    }).catch(() => {});

    // 3. If watchSelector is specified, wait for it to be rendered and visible in DOM
    if (options.watchSelector && options.watchSelector.trim()) {
      await page.waitForSelector(options.watchSelector.trim(), {
        visible: true,
        timeout: 6000
      }).catch(() => {});
    }

    // 4. Wait for SPA hydration / non-empty body content (Vite, React, Vue, Next.js)
    await page.waitForFunction(() => {
      const b = document.body;
      if (!b) return false;
      const t = b.innerText ? b.innerText.trim() : '';
      const root = document.getElementById('root') || document.getElementById('app') || document.querySelector('main');
      return t.length > 0 || (root && root.childElementCount > 0);
    }, { timeout: 6000 }).catch(() => {});

    // 5. Short stabilization pause for CSS animations/transitions to settle
    await new Promise(r => setTimeout(r, 400));

    const title = await page.title();
    const rawHtml = await page.content();

    // Check for Outage, CAPTCHA, or Bot Protection challenge BEFORE taking screenshot
    const incidentCheck = inspectForOutageOrCaptcha(responseStatus, rawHtml, title);

    // 6. Capture genuine screenshot buffer
    const screenshotBuffer = await page.screenshot({
      fullPage: false // standard 1280x800 viewport
    });

    // 7. Validate captured screenshot buffer before disk save and Supabase upload
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
    const screenshotFullPath = path.join(SCREENSHOTS_DIR, screenshotFilename);
    fs.writeFileSync(screenshotFullPath, screenshotBuffer);

    console.log(`[CRAWLER] Captured real screenshot for ${url}: ${screenshotFilename} (${screenshotBuffer.length} bytes, ${nonUniformRatio.toFixed(1)}% content pixels)`);

    const screenshotUrl = `/api/screenshots/${screenshotFilename}`;
    let screenshotStoragePath = '';

    // 8. Upload genuine screenshot bytes to Supabase Storage bucket
    const monitorId = options.monitorId || 'general';
    const remotePath = `monitors/${monitorId}/${screenshotFilename}`;
    try {
      const uploadRes = await uploadScreenshot(screenshotBuffer, remotePath);
      if (uploadRes?.success) {
        screenshotStoragePath = uploadRes.storagePath;
      }
    } catch (uploadErr) {
      console.warn('[CRAWLER] Supabase screenshot upload warning:', uploadErr.message);
    }

    await browser.close();
    browser = null;

    return {
      success: !incidentCheck.isIncident,
      status: responseStatus,
      title,
      rawHtml,
      screenshotUrl,
      screenshotFullPath,
      screenshotStoragePath,
      incident: incidentCheck
    };
  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
    return {
      success: false,
      status: 0,
      title: 'Error',
      rawHtml: '',
      screenshotUrl: '',
      screenshotFullPath: '',
      screenshotStoragePath: '',
      incident: {
        isIncident: true,
        type: err.name === 'TimeoutError' ? 'TIMEOUT' : 'OUTAGE',
        message: `Crawl failed: ${err.message}`
      }
    };
  }
}

/**
 * Fast HTTP fetch fallback if browser is not required or unavailable
 */
async function crawlWithHttp(url, options = {}) {
  try {
    const targetUrl = resolveUrl(url);
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      }
    });
    const rawHtml = await res.text();
    let title = '';
    try {
      const $ = cheerio.load(rawHtml);
      title = $('title').text() || '';
    } catch (_) {}

    const incidentCheck = inspectForOutageOrCaptcha(res.status, rawHtml, title);

    // When crawling via HTTP without a browser, we report empty screenshot paths truthfully
    // rather than inventing synthetic blank card placeholders.
    return {
      success: !incidentCheck.isIncident,
      status: res.status,
      title,
      rawHtml,
      screenshotUrl: '',
      screenshotFullPath: '',
      screenshotStoragePath: '',
      incident: incidentCheck
    };
  } catch (err) {
    return {
      success: false,
      status: 0,
      title: 'Error',
      rawHtml: '',
      screenshotUrl: '',
      screenshotFullPath: '',
      screenshotStoragePath: '',
      incident: {
        isIncident: true,
        type: 'OUTAGE',
        message: `HTTP Fetch failed: ${err.message}`
      }
    };
  }
}

module.exports = {
  crawlWithBrowser,
  crawlWithHttp,
  inspectForOutageOrCaptcha,
  getBrowserExecutablePath
};
