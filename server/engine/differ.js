const Diff = require('diff');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');
const { downloadScreenshotBuffer, uploadScreenshot, getSignedUrl } = require('./storage');
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = process.env.DATA_DIR || process.env.PERSISTENT_DATA_DIR || (isVercel ? path.join('/tmp', 'data') : path.join(__dirname, '..', '..', 'data'));
const SCREENSHOTS_DIR = path.join(DATA_DIR, 'screenshots');

/**
 * Compute line-by-line and word-by-word text diff
 */
function computeTextDiff(oldText = '', newText = '') {
  const lineDiff = Diff.diffLines(oldText, newText);
  const wordDiff = Diff.diffWordsWithSpace(oldText, newText);

  let addedLines = 0;
  let removedLines = 0;
  let totalLines = 0;

  for (const part of lineDiff) {
    const linesCount = (part.value.match(/\n/g) || []).length + 1;
    totalLines += linesCount;
    if (part.added) addedLines += linesCount;
    if (part.removed) removedLines += linesCount;
  }

  const changedPercent = totalLines > 0 
    ? Math.min(100, Math.round(((addedLines + removedLines) / totalLines) * 100)) 
    : 0;

  return {
    lineDiff,
    wordDiff,
    stats: {
      addedLines,
      removedLines,
      totalLines,
      changedPercent
    }
  };
}

/**
 * Compare two screenshots visually using pixelmatch
 * Produces a visual diff PNG with red/magenta highlight masks
 */
async function computeVisualScreenshotDiff(oldScreenshotUrl, newScreenshotUrl, oldStoragePath = '', newStoragePath = '') {
  if (!oldScreenshotUrl && !oldStoragePath) {
    return { hasDiff: false, diffPercentage: 0, diffImageUrl: null, diffSignedUrl: null };
  }
  if (!newScreenshotUrl && !newStoragePath) {
    return { hasDiff: false, diffPercentage: 0, diffImageUrl: null, diffSignedUrl: null };
  }

  let buf1 = null;
  let buf2 = null;

  // 1. Try downloading from Supabase Storage first if storage paths exist
  if (oldStoragePath) {
    buf1 = await downloadScreenshotBuffer(oldStoragePath);
  }
  if (newStoragePath) {
    buf2 = await downloadScreenshotBuffer(newStoragePath);
  }

  // 2. If either buffer is missing, fallback to local filesystem
  if (!buf1 && oldScreenshotUrl) {
    const oldFile = path.basename(oldScreenshotUrl);
    const oldPath = path.join(SCREENSHOTS_DIR, oldFile);
    if (fs.existsSync(oldPath)) {
      buf1 = fs.readFileSync(oldPath);
    }
  }

  if (!buf2 && newScreenshotUrl) {
    const newFile = path.basename(newScreenshotUrl);
    const newPath = path.join(SCREENSHOTS_DIR, newFile);
    if (fs.existsSync(newPath)) {
      buf2 = fs.readFileSync(newPath);
    }
  }

  if (!buf1 || !buf2) {
    return { hasDiff: false, diffPercentage: 0, diffImageUrl: null, diffSignedUrl: null };
  }

  try {
    const img1 = PNG.sync.read(buf1);
    const img2 = PNG.sync.read(buf2);

    // Normalize width/height to match
    const width = Math.min(img1.width, img2.width);
    const height = Math.min(img1.height, img2.height);

    const diff = new PNG({ width, height });

    const numDiffPixels = pixelmatch(
      img1.data,
      img2.data,
      diff.data,
      width,
      height,
      {
        threshold: 0.1,
        diffColor: [255, 0, 102], // Neon magenta for high visibility
        diffColorAlt: [0, 220, 255]
      }
    );

    const totalPixels = width * height;
    const diffPercentage = ((numDiffPixels / totalPixels) * 100).toFixed(2);

    const diffFileName = `diff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
    const diffPath = path.join(SCREENSHOTS_DIR, diffFileName);

    try {
      if (!fs.existsSync(SCREENSHOTS_DIR)) {
        fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
      }
    } catch (_) {}

    fs.writeFileSync(diffPath, PNG.sync.write(diff));

    let diffSignedUrl = null;
    const remoteDiffPath = `diffs/${diffFileName}`;
    try {
      const uploadRes = await uploadScreenshot(diffPath, remoteDiffPath);
      if (uploadRes?.success) {
        const signed = await getSignedUrl(remoteDiffPath, 3600);
        if (signed?.success) {
          diffSignedUrl = signed.signedUrl;
        }
      }
    } catch (diffUploadErr) {
      console.warn('[DIFF] Non-fatal diff upload note:', diffUploadErr.message);
    }

    return {
      hasDiff: numDiffPixels > 0,
      diffPixels: numDiffPixels,
      diffPercentage: parseFloat(diffPercentage),
      diffImageUrl: `/api/screenshots/${diffFileName}`,
      diffSignedUrl
    };
  } catch (err) {
    console.error('Visual diff failed:', err);
    return { hasDiff: false, diffPercentage: 0, diffImageUrl: null, diffSignedUrl: null };
  }
}

/**
 * Generate intelligent one-line change summary (AI/NLP summarizer)
 * Bonus requirement: "AI one-line change summaries"
 */
function generateChangeSummary(oldText = '', newText = '', stats = {}) {
  if (!oldText) return 'Initial baseline snapshot captured.';
  if (oldText === newText) return 'No notable content changes detected.';

  // 1. Detect price changes
  const oldPrice = extractPrice(oldText);
  const newPrice = extractPrice(newText);
  if (oldPrice !== null && newPrice !== null && oldPrice !== newPrice) {
    if (newPrice < oldPrice) {
      const drop = (oldPrice - newPrice).toFixed(2);
      const percent = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
      return `Price dropped by $${drop} from $${oldPrice} to $${newPrice} (${percent}% discount).`;
    } else {
      const hike = (newPrice - oldPrice).toFixed(2);
      return `Price increased by $${hike} from $${oldPrice} to $${newPrice}.`;
    }
  }

  // 2. Detect stock changes
  const stockChanges = checkStockChange(oldText, newText);
  if (stockChanges) return stockChanges;

  // 3. Detect major additions or removals
  if (stats.addedLines > 0 && stats.removedLines === 0) {
    const sampleAdded = getFirstChangedLine(newText, oldText);
    return `Added new content (+${stats.addedLines} lines): "${sampleAdded.slice(0, 60)}..."`;
  }

  if (stats.removedLines > 0 && stats.addedLines === 0) {
    return `Removed ${stats.removedLines} lines of content.`;
  }

  // 4. General modification summary
  const sample = getFirstChangedLine(newText, oldText);
  return `Content updated (+${stats.addedLines || 1} / -${stats.removedLines || 1} lines): "${sample.slice(0, 70)}..."`;
}

function extractPrice(text) {
  const match = text.match(/[$€£]\s*(\d+(?:\.\d{1,2})?)/);
  return match ? parseFloat(match[1]) : null;
}

function checkStockChange(oldText, newText) {
  const oldLower = oldText.toLowerCase();
  const newLower = newText.toLowerCase();

  const wasOut = oldLower.includes('out of stock') || oldLower.includes('sold out');
  const wasIn = oldLower.includes('in stock') || oldLower.includes('available');

  const isOut = newLower.includes('out of stock') || newLower.includes('sold out');
  const isIn = newLower.includes('in stock') || newLower.includes('available');

  if (wasOut && isIn) return 'Stock Alert: Item has been RESTOCKED and is now In Stock!';
  if (wasIn && isOut) return 'Stock Alert: Item has SOLD OUT (now Out of Stock).';
  return null;
}

function getFirstChangedLine(newText, oldText) {
  const newLines = newText.split('\n').map(l => l.trim()).filter(Boolean);
  const oldLines = new Set(oldText.split('\n').map(l => l.trim()).filter(Boolean));
  for (const line of newLines) {
    if (!oldLines.has(line) && line.length > 5) {
      return line;
    }
  }
  return newLines[0] || 'Page updated';
}

/**
 * Check if specific keywords appeared or disappeared
 * Bonus requirement: "Keyword-only alerts"
 */
function checkKeywordAlerts(oldText = '', newText = '', keywords = []) {
  if (!Array.isArray(keywords) || keywords.length === 0) return [];
  const triggered = [];

  for (const kw of keywords) {
    if (!kw || !kw.trim()) continue;
    const term = kw.trim().toLowerCase();
    const wasPresent = oldText.toLowerCase().includes(term);
    const isPresent = newText.toLowerCase().includes(term);

    if (!wasPresent && isPresent) {
      triggered.push({ keyword: kw, type: 'APPEARED', message: `Keyword "${kw}" appeared on page` });
    } else if (wasPresent && !isPresent) {
      triggered.push({ keyword: kw, type: 'DISAPPEARED', message: `Keyword "${kw}" disappeared from page` });
    }
  }

  return triggered;
}

const { generateAiChangeSummary } = require('./gemini');

module.exports = {
  computeTextDiff,
  computeVisualScreenshotDiff,
  generateChangeSummary,
  generateAiChangeSummary,
  checkKeywordAlerts
};
