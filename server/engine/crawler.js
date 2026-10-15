const puppeteer = require('puppeteer-core');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const isVercel = Boolean(process.env.VERCEL);
const SCREENSHOTS_DIR = isVercel
  ? path.join('/tmp', 'screenshots')
  : path.join(__dirname, '..', '..', 'data', 'screenshots');

function resolveUrl(url) {
  if (!url) return '';
  // Support relative mock URLs or localhost URLs in deployed environments
  if (url.startsWith('/')) {
    const origin = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : `http://localhost:${process.env.PORT || 3001}`;
    return `${origin}${url}`;
  }
  if (process.env.VERCEL_URL && url.includes('localhost:3001')) {
    return url.replace('http://localhost:3001', `https://${process.env.VERCEL_URL}`);
  }
  return url;
}

// Auto-detect system browser executable (Chrome or Edge on Windows)
function getBrowserExecutablePath() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const chromeLocal = path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe');

  if (fs.existsSync(chromePath)) return chromePath;
  if (fs.existsSync(edgePath)) return edgePath;
  if (fs.existsSync(chromeLocal)) return chromeLocal;
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

    // Create a lightweight SVG visual preview data URL for environments without browser screenshots
    const encodedTitle = encodeURIComponent(title || targetUrl);
    const screenshotUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500"><rect width="800" height="500" fill="%230f172a"/><text x="400" y="220" fill="%2338bdf8" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle">DOM Text Snapshot</text><text x="400" y="260" fill="%2394a3b8" font-family="sans-serif" font-size="16" text-anchor="middle">${encodedTitle.slice(0, 50)}</text><text x="400" y="300" fill="%2334d399" font-family="sans-serif" font-size="14" text-anchor="middle">HTTP Status: ${res.status} OK</text></svg>`;

    return {
      success: !incidentCheck.isIncident,
      status: res.status,
      title,
      rawHtml,
      screenshotUrl,
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
