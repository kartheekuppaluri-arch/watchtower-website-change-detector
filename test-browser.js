const puppeteer = require('puppeteer-core');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const execPath = fs.existsSync(chromePath) ? chromePath : edgePath;

console.log('Using browser executable:', execPath);

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: execPath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    const page = await browser.newPage();
    await page.setContent('<h1>Website Change Detector Test</h1>');
    const title = await page.$eval('h1', el => el.textContent);
    console.log('Page rendered successfully with title:', title);
    const screenshot = await page.screenshot({ encoding: 'base64' });
    console.log('Screenshot length:', screenshot.length);
    await browser.close();
    console.log('Headless Chrome test passed with flying colors!');
  } catch (err) {
    console.error('Test error:', err);
  }
})();
