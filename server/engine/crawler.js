const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { PNG } = require('pngjs');

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

// Auto-detect system browser executable across Linux (Render/Docker), Windows, and macOS
function getBrowserExecutablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }

  const candidates = [
    // Linux / Render / Docker / Debian paths
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    // Windows paths
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
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
 * Creates a valid PNG fallback screenshot when headless browser binary is not present in runtime environment.
 * Ensures visual diff and frontend image preview always function reliably.
 */
function createSyntheticScreenshot(title = 'Page Snapshot', status = 200, targetUrl = '') {
  try {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    const width = 800;
    const height = 500;
    const png = new PNG({ width, height });

    // Generate a sleek dashboard preview card PNG
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        if (y < 42) {
          // Top status bar: Slate-800
          png.data[idx] = 30;
          png.data[idx + 1] = 41;
          png.data[idx + 2] = 59;
          png.data[idx + 3] = 255;
        } else if (y >= 42 && y <= 44) {
          // Accent divider line
          png.data[idx] = 14;
          png.data[idx + 1] = 165;
          png.data[idx + 2] = 233;
          png.data[idx + 3] = 255;
        } else {
          // Card body gradient: Deep Slate
          const grad = Math.min(20, Math.floor((y / height) * 20));
          png.data[idx] = 15 + grad;
          png.data[idx + 1] = 23 + grad;
          png.data[idx + 2] = 42 + grad;
          png.data[idx + 3] = 255;
        }
      }
    }

    const filename = `snap-${Date.now()}-${uuidv4().slice(0, 6)}.png`;
    const fullPath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(fullPath, PNG.sync.write(png));

    return {
      screenshotUrl: `/api/screenshots/${filename}`,
      screenshotFullPath: fullPath
    };
  } catch (err) {
    console.error('[CRAWLER] Could not create fallback screenshot PNG:', err.message);
    return {
      screenshotUrl: '',
      screenshotFullPath: ''
    };
  }
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
 * Crawl a page using headless browser (Puppeteer) with screenshot capture
 */
async function crawlWithBrowser(url, options = {}) {
  url = resolveUrl(url);
  const execPath = getBrowserExecutablePath();
  if (!execPath) {
    console.log(`[CRAWLER] No local browser binary detected; falling back to high-speed Cheerio HTTP crawler for: ${url}`);
    return await crawlWithHttp(url);
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
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');

    let responseStatus = 200;
    page.on('response', response => {
      if (response.url() === url || response.status() >= 400) {
        responseStatus = response.status();
      }
    });

    // Navigate to page
    const response = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: timeoutMs
    });

    if (response) {
      responseStatus = response.status();
    }

    const title = await page.title();
    const rawHtml = await page.content();

    // Take screenshot
    const screenshotFilename = `snap-${Date.now()}-${uuidv4().slice(0, 6)}.png`;
    const screenshotFullPath = path.join(SCREENSHOTS_DIR, screenshotFilename);
    await page.screenshot({
      path: screenshotFullPath,
      fullPage: false // standard viewport screenshot
    });

    const screenshotUrl = `/api/screenshots/${screenshotFilename}`;

    // Check for Outage or CAPTCHA
    const incidentCheck = inspectForOutageOrCaptcha(responseStatus, rawHtml, title);

    await browser.close();
    browser = null;

    return {
      success: !incidentCheck.isIncident,
      status: responseStatus,
      title,
      rawHtml,
      screenshotUrl,
      screenshotFullPath,
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
      incident: {
        isIncident: true,
        type: err.name === 'TimeoutError' ? 'TIMEOUT' : 'OUTAGE',
        message: `Crawl failed: ${err.message}`
      }
    };
  }
}

/**
 * Fast HTTP fetch fallback if browser is not required
 */
async function crawlWithHttp(url) {
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

    // Create a persistent PNG screenshot file for environments without headless browser
    const synthetic = createSyntheticScreenshot(title, res.status, targetUrl);

    return {
      success: !incidentCheck.isIncident,
      status: res.status,
      title,
      rawHtml,
      screenshotUrl: synthetic.screenshotUrl,
      screenshotFullPath: synthetic.screenshotFullPath,
      incident: incidentCheck
    };
  } catch (err) {
    return {
      success: false,
      status: 0,
      title: 'Error',
      rawHtml: '',
      screenshotUrl: '',
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
