const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Store browser binaries inside the project workspace directory (.cache/puppeteer)
  // This ensures Render preserves the downloaded Chrome binary between build and runtime.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
