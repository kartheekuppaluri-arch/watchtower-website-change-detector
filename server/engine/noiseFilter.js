const cheerio = require('cheerio');
const crypto = require('crypto');

// Standard noise regular expressions
const TIMESTAMP_REGEXES = [
  /\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/gi,
  /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/gi,
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
  /\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b/g,
  /\b\d+\s+(?:seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago\b/gi,
  /\b(?:just now|updated moments ago|live|right now)\b/gi
];

const COUNTER_AND_TOKEN_REGEXES = [
  /\b\d+\s+(?:people viewing|views|viewers|readers|likes|shares|visitors|watching)\b/gi,
  /\b(?:CSRF|csrf|token|session|nonce|sid|uuid|tracking)[_a-z0-9]*[:=]\s*[a-z0-9\-_]{6,}\b/gi,
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi // standard UUIDs
];

/**
 * Filter HTML using watch and ignore CSS selectors
 */
function extractAndFilterHtml(rawHtml, watchSelector, ignoreSelectors = []) {
  if (!rawHtml) return { targetHtml: '', text: '' };
  
  const $ = cheerio.load(rawHtml);

  // 1. Remove unwanted tags by default (scripts, styles, noscript, iframes)
  $('script, style, noscript, iframe, link[rel="stylesheet"]').remove();

  // 2. Remove specified ignore selectors (banners, live clocks, counters)
  if (Array.isArray(ignoreSelectors)) {
    for (const selector of ignoreSelectors) {
      if (selector && selector.trim()) {
        try {
          $(selector.trim()).remove();
        } catch (e) {
          console.warn(`Invalid ignore selector "${selector}":`, e.message);
        }
      }
    }
  }

  // 3. Narrow down to watch selector if specified
  let targetNode = $('body');
  if (watchSelector && watchSelector.trim()) {
    try {
      const selected = $(watchSelector.trim());
      if (selected.length > 0) {
        targetNode = selected;
      }
    } catch (e) {
      console.warn(`Invalid watch selector "${watchSelector}":`, e.message);
    }
  }

  const targetHtml = targetNode.html() || '';
  const text = targetNode.text() || '';

  return { targetHtml, text };
}

/**
 * Clean text by stripping timestamps, counters, and tokens
 */
function cleanTextNoise(text, options = {}) {
  if (!text) return '';
  let cleaned = text;

  // 1. Remove timestamps
  if (options.filterTimestamps !== false) {
    for (const regex of TIMESTAMP_REGEXES) {
      cleaned = cleaned.replace(regex, ' [TIMESTAMP_STRIPPED] ');
    }
  }

  // 2. Remove dynamic counters & random tokens
  if (options.filterCounters !== false) {
    for (const regex of COUNTER_AND_TOKEN_REGEXES) {
      cleaned = cleaned.replace(regex, ' [TOKEN_STRIPPED] ');
    }
  }

  // 3. Apply custom regex if defined
  if (options.customRegex && options.customRegex.trim()) {
    try {
      const userRegex = new RegExp(options.customRegex.trim(), 'gi');
      cleaned = cleaned.replace(userRegex, ' [CUSTOM_STRIPPED] ');
    } catch (e) {
      console.warn('Invalid user custom regex:', e.message);
    }
  }

  // 4. Normalize excessive whitespace and linebreaks
  cleaned = cleaned
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();

  return cleaned;
}

/**
 * Compute SHA-256 hash of cleaned text
 */
function computeContentHash(cleanedText) {
  return crypto.createHash('sha256').update(cleanedText || '').digest('hex');
}

/**
 * Calculate similarity percentage between two strings (word-based Jaccard similarity)
 */
function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(Boolean));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(Boolean));

  if (words1.size === 0 && words2.size === 0) return 1.0;
  if (words1.size === 0 || words2.size === 0) return 0.0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  return intersection / union;
}

/**
 * Determine if diff is significant based on sensitivity
 * sensitivity: 'high' (alerts on >0.5% change), 'medium' (alerts on >4% change), 'low' (alerts on >15% change)
 */
function isChangeSignificant(oldText, newText, sensitivity = 'medium') {
  if (oldText === newText) return false;
  
  const similarity = calculateSimilarity(oldText, newText);
  const diffRatio = 1.0 - similarity; // 0.0 to 1.0

  let threshold = 0.04; // default medium: 4% diff required
  if (sensitivity === 'high') {
    threshold = 0.005; // 0.5% diff triggers alert
  } else if (sensitivity === 'low') {
    threshold = 0.15; // 15% diff required to ignore minor updates
  }

  // Also check character distance
  const charDiff = Math.abs(oldText.length - newText.length);
  if (diffRatio < threshold && charDiff < 10) {
    return false; // Noise, ignore!
  }

  return true;
}

/**
 * Extract numbers (prices, counts) from text for tracking
 */
function extractNumericMetrics(text) {
  if (!text) return null;
  // Match currency ($49.99, €39.00, £25) or isolated numbers
  const priceMatch = text.match(/[$€£¥]\s*(\d+(?:\.\d{1,2})?)/);
  if (priceMatch && priceMatch[1]) {
    return parseFloat(priceMatch[1]);
  }
  const numMatch = text.match(/\b(\d+(?:\.\d+)?)\b/);
  if (numMatch && numMatch[1]) {
    return parseFloat(numMatch[1]);
  }
  return null;
}

module.exports = {
  extractAndFilterHtml,
  cleanTextNoise,
  computeContentHash,
  calculateSimilarity,
  isChangeSignificant,
  extractNumericMetrics
};
