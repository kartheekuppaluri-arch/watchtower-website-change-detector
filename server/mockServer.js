// In-memory state for mock test targets
const mockState = {
  store: {
    price: 49.99,
    originalPrice: 79.99,
    stockStatus: 'In Stock',
    stockCount: 14,
    shippingTime: 'Ships tomorrow, Free Delivery',
    rating: 4.8,
    reviews: 320
  },
  news: {
    headline: 'Autonomous AI Agents Breakthrough: Deep Reasoning at 10x Speed',
    paragraph: 'Researchers unveiled an architectural leap demonstrating that lightweight models can rival massive neural nets by leveraging asynchronous tool orchestrators and continuous context streaming.',
    extraUpdate: '',
    commentsCount: 42
  },
  status: {
    state: 'operational', // 'operational', 'outage_503', 'captcha_cloudflare'
    uptime: '99.98%'
  }
};

function setupMockRoutes(app) {
  // --- STORE MOCK ---
  app.get('/mock/store', (req, res) => {
    // Dynamic noise that changes every request (to test noise filtering)
    const randomViewers = Math.floor(Math.random() * 20) + 5;
    const randomSession = Math.random().toString(36).substring(7);
    const serverTimestamp = new Date().toLocaleTimeString();

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>TechGadget Pro Store</title>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .badge { display: inline-block; padding: 4px 10px; background: #0284c7; color: white; border-radius: 6px; font-size: 12px; font-weight: bold; }
          .price { font-size: 32px; font-weight: 800; color: #10b981; margin: 12px 0; }
          .original-price { font-size: 18px; text-decoration: line-through; color: #94a3b8; margin-left: 8px; }
          .stock-in { color: #34d399; font-weight: bold; }
          .stock-out { color: #f87171; font-weight: bold; }
          .noise-box { background: rgba(239, 68, 68, 0.1); border: 1px dashed #ef4444; padding: 10px; border-radius: 6px; font-size: 12px; color: #fca5a5; margin: 16px 0; }
          .controls { margin-top: 24px; padding: 16px; background: #0f172a; border-radius: 8px; border: 1px solid #475569; }
          button { background: #3b82f6; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; margin-right: 8px; margin-bottom: 8px; font-weight: 600; }
          button:hover { background: #2563eb; }
          .btn-danger { background: #ef4444; }
          .btn-danger:hover { background: #dc2626; }
          .btn-success { background: #10b981; }
          .btn-success:hover { background: #059669; }
        </style>
      </head>
      <body>
        <div class="container">
          <span class="badge">E-COMMERCE DEMO</span>
          <h1 id="product-title" style="margin-top: 10px; font-size: 22px;">TechGadget Pro ANC Wireless Headphones</h1>
          
          <!-- NOISE SECTION (Ignored by noise filters) -->
          <div class="noise-box promo-ticker">
            <span>⚡ Flash deal ends in 02:44:19</span> | 
            <span class="live-viewers-count">🔥 ${randomViewers} people viewing right now</span> | 
            <span class="random-token">CSRF: ${randomSession}</span>
          </div>

          <!-- WATCH REGION -->
          <div id="product-details" style="padding: 12px; background: #0f172a; border-radius: 8px; border: 1px solid #334155;">
            <div class="price">
              $<span id="price-val">${mockState.store.price.toFixed(2)}</span>
              <span class="original-price">$${mockState.store.originalPrice.toFixed(2)}</span>
            </div>
            
            <p><strong>Availability:</strong> 
              <span id="stock-val" class="${mockState.store.stockStatus === 'In Stock' ? 'stock-in' : 'stock-out'}">
                ${mockState.store.stockStatus} (${mockState.store.stockCount} left)
              </span>
            </p>
            <p><strong>Shipping:</strong> <span id="shipping-val">${mockState.store.shippingTime}</span></p>
            <p style="font-size: 13px; color: #94a3b8;">Customer Rating: ⭐ ${mockState.store.rating}/5 (${mockState.store.reviews} verified reviews)</p>
          </div>

          <div style="margin-top: 16px; font-size: 11px; color: #64748b;">
            Server rendered at: <span id="timestamp-clock">${serverTimestamp}</span>
          </div>

          <!-- INTERACTIVE CONTROLS FOR TESTING -->
          <div class="controls">
            <h3 style="font-size: 14px; margin-top: 0; color: #38bdf8;">🎮 Interactive Testing Controls</h3>
            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 10px;">Click these buttons to change this target page, then run a check in the detector:</p>
            <button class="btn-success" onclick="fetch('/mock/api/store/price-drop', {method: 'POST'}).then(() => location.reload())">🏷️ Drop Price to $39.99</button>
            <button onclick="fetch('/mock/api/store/price-reset', {method: 'POST'}).then(() => location.reload())">🔄 Reset Price to $49.99</button>
            <button class="btn-danger" onclick="fetch('/mock/api/store/toggle-stock', {method: 'POST'}).then(() => location.reload())">📦 Toggle In/Out of Stock</button>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  // Mock Store API controls
  app.post('/mock/api/store/price-drop', (req, res) => {
    mockState.store.price = 39.99;
    mockState.store.stockCount = 8;
    res.json({ success: true, store: mockState.store });
  });

  app.post('/mock/api/store/price-reset', (req, res) => {
    mockState.store.price = 49.99;
    mockState.store.stockCount = 14;
    mockState.store.stockStatus = 'In Stock';
    res.json({ success: true, store: mockState.store });
  });

  app.post('/mock/api/store/toggle-stock', (req, res) => {
    if (mockState.store.stockStatus === 'In Stock') {
      mockState.store.stockStatus = 'Out of Stock';
      mockState.store.stockCount = 0;
    } else {
      mockState.store.stockStatus = 'In Stock';
      mockState.store.stockCount = 25;
    }
    res.json({ success: true, store: mockState.store });
  });

  // --- NEWS MOCK ---
  app.get('/mock/news', (req, res) => {
    const liveTime = new Date().toTimeString().split(' ')[0];
    const adId = Math.floor(Math.random() * 10000);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tech Chronicle Daily</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Georgia, serif; background: #111827; color: #f3f4f6; padding: 24px; line-height: 1.6; }
          .container { max-width: 640px; margin: 0 auto; background: #1f2937; padding: 28px; border-radius: 8px; border: 1px solid #374151; }
          header { border-bottom: 2px solid #4b5563; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: baseline; }
          #live-clock { font-family: monospace; color: #a78bfa; font-size: 13px; }
          .ad-banner { background: #374151; border: 1px dashed #6b7280; padding: 10px; text-align: center; font-size: 12px; color: #9ca3af; margin: 15px 0; border-radius: 4px; }
          article h1 { font-size: 24px; color: #f9fafb; margin-bottom: 12px; }
          article p { font-size: 15px; color: #d1d5db; }
          .breaking-badge { background: #dc2626; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; font-family: sans-serif; }
          .controls { margin-top: 24px; padding: 14px; background: #111827; border-radius: 6px; border: 1px solid #4b5563; font-family: sans-serif; }
          button { background: #8b5cf6; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px; font-weight: bold; }
          button:hover { background: #7c3aed; }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <span style="font-weight: bold; font-size: 18px; letter-spacing: 1px;">THE TECH CHRONICLE</span>
            <!-- NOISE: Ticking live clock on every single load -->
            <span id="live-clock">🕒 Live: ${liveTime}</span>
          </header>

          <!-- NOISE: Dynamic banner ad -->
          <div class="ad-banner">
            [SPONSORED AD #${adId}] Cloud Solutions for Scale - Start free trial now
          </div>

          <!-- WATCH REGION -->
          <main>
            <article id="article-body">
              <span class="breaking-badge">TECH NEWS</span>
              <h1>${mockState.news.headline}</h1>
              <p>${mockState.news.paragraph}</p>
              ${mockState.news.extraUpdate ? `<p style="padding: 10px; background: #312e81; border-left: 4px solid #818cf8; border-radius: 4px;"><strong>UPDATE:</strong> ${mockState.news.extraUpdate}</p>` : ''}
              <div style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
                Comments: <span class="view-counter">${mockState.news.commentsCount} reader responses</span>
              </div>
            </article>
          </main>

          <div class="controls">
            <h4 style="margin: 0 0 10px 0; color: #c4b5fd;">🎮 Interactive Controls</h4>
            <button onclick="fetch('/mock/api/news/add-update', {method: 'POST'}).then(() => location.reload())">📰 Add Breaking Update</button>
            <button onclick="fetch('/mock/api/news/reset', {method: 'POST'}).then(() => location.reload())">🔄 Reset Article</button>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  app.post('/mock/api/news/add-update', (req, res) => {
    mockState.news.extraUpdate = 'Official benchmark results just published confirm a 3.4x latency reduction across complex multi-step reasoning evaluations.';
    mockState.news.commentsCount += 15;
    res.json({ success: true, news: mockState.news });
  });

  app.post('/mock/api/news/reset', (req, res) => {
    mockState.news.extraUpdate = '';
    mockState.news.commentsCount = 42;
    res.json({ success: true, news: mockState.news });
  });

  // --- STATUS / OUTAGE / CAPTCHA MOCK ---
  app.get('/mock/status', (req, res) => {
    if (mockState.status.state === 'outage_503') {
      return res.status(503).send(`
        <!DOCTYPE html>
        <html>
        <head><title>503 Service Unavailable</title></head>
        <body style="font-family: sans-serif; background: #0f172a; color: white; text-align: center; padding: 60px;">
          <h1 style="color: #ef4444; font-size: 40px;">503 Service Unavailable</h1>
          <p>The server is temporarily unable to service your request due to maintenance downtime or capacity problems.</p>
          <div style="margin-top: 30px;">
            <button style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;"
              onclick="fetch('/mock/api/status/operational', {method: 'POST'}).then(() => location.reload())">
              Restore Operational State
            </button>
          </div>
        </body>
        </html>
      `);
    }

    if (mockState.status.state === 'captcha_cloudflare') {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Just a moment... Cloudflare Verification</title></head>
        <body style="font-family: sans-serif; background: #18181b; color: #e4e4e7; text-align: center; padding: 60px;">
          <div class="cf-browser-verification" style="max-width: 480px; margin: 0 auto; background: #27272a; padding: 30px; border-radius: 8px;">
            <h2>Checking your browser before accessing cloudapi.io</h2>
            <p>Please complete the security check to continue.</p>
            <div style="margin: 20px 0; padding: 15px; border: 1px solid #71717a; border-radius: 4px; display: inline-block;">
              <input type="checkbox" disabled checked> I am not a robot (Cloudflare Turnstile)
            </div>
            <br>
            <button style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;"
              onclick="fetch('/mock/api/status/operational', {method: 'POST'}).then(() => location.reload())">
              Pass Verification Challenge
            </button>
          </div>
        </body>
        </html>
      `);
    }

    // Normal Operational Page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cloud Infrastructure Status</title>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, sans-serif; background: #0f172a; color: white; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; padding: 24px; border-radius: 10px; border: 1px solid #334155; }
          .status-indicator { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: bold; color: #10b981; }
          .dot { width: 14px; height: 14px; background: #10b981; border-radius: 50%; box-shadow: 0 0 10px #10b981; }
          .service-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155; font-size: 14px; }
          .controls { margin-top: 24px; padding: 14px; background: #0f172a; border-radius: 6px; border: 1px solid #475569; }
          button { padding: 8px 12px; border-radius: 4px; border: none; cursor: pointer; font-weight: bold; margin-right: 8px; margin-bottom: 6px; color: white; }
          .btn-danger { background: #ef4444; }
          .btn-warning { background: #f59e0b; }
          .btn-success { background: #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div id="status-board">
            <div class="status-indicator">
              <span class="dot"></span> All Systems Operational
            </div>
            <p style="color: #94a3b8; font-size: 13px;">90-day rolling uptime: ${mockState.status.uptime}</p>
            
            <div style="margin-top: 20px;">
              <div class="service-row"><span>REST API Core</span> <span style="color: #34d399;">Operational</span></div>
              <div class="service-row"><span>Authentication Services</span> <span style="color: #34d399;">Operational</span></div>
              <div class="service-row"><span>Storage & CDN</span> <span style="color: #34d399;">Operational</span></div>
              <div class="service-row"><span>Webhooks Ingestion</span> <span style="color: #34d399;">Operational</span></div>
            </div>
          </div>

          <div class="controls">
            <h4 style="margin: 0 0 10px 0; color: #38bdf8;">🎮 Test Architecture Scenarios</h4>
            <p style="font-size: 12px; color: #94a3b8; margin-bottom: 8px;">Test Question 1: "Is a site outage or CAPTCHA a change?"</p>
            <button class="btn-danger" onclick="fetch('/mock/api/status/outage', {method: 'POST'}).then(() => location.reload())">💥 Trigger 503 Site Outage</button>
            <button class="btn-warning" onclick="fetch('/mock/api/status/captcha', {method: 'POST'}).then(() => location.reload())">🛡️ Trigger Cloudflare CAPTCHA</button>
            <button class="btn-success" onclick="fetch('/mock/api/status/operational', {method: 'POST'}).then(() => location.reload())">✅ Reset to Operational</button>
          </div>
        </div>
      </body>
      </html>
    `);
  });

  app.post('/mock/api/status/outage', (req, res) => {
    mockState.status.state = 'outage_503';
    res.json({ success: true, status: mockState.status });
  });

  app.post('/mock/api/status/captcha', (req, res) => {
    mockState.status.state = 'captcha_cloudflare';
    res.json({ success: true, status: mockState.status });
  });

  app.post('/mock/api/status/operational', (req, res) => {
    mockState.status.state = 'operational';
    res.json({ success: true, status: mockState.status });
  });
}

module.exports = { setupMockRoutes, mockState };
