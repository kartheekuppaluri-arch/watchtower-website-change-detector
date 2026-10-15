# 🛡️ WatchTower — Website Change Detector & Diff Engine

> Production-grade service that monitors public web pages, captures headless browser snapshots, filters dynamic noise, and alerts users to meaningful changes.

---

## 🌟 Highlights & Core Requirements Coverage

| Requirement | Implementation Details |
|---|---|
| **1. URL, Name, Interval & Headless Browser** | Add any public URL with intervals from 15 min to 24h. Headless rendering via Puppeteer using system Chrome/Edge (`C:\Program Files\Google\Chrome\Application\chrome.exe` / `msedge.exe`). |
| **2. Scheduler & Job Queue** | Queue with configurable timeouts (25s), retries with exponential backoff & jitter, per-domain rate limiting, and zero credential storage. |
| **3. Snapshots & Content Hashes** | Saves extracted page text and high-res screenshot; computes SHA-256 content hash of normalized text; stores new snapshot in history **only when the hash changes**. |
| **4. Multi-Layer Noise Filtering** | Strips timestamps (`ISO`, `HH:MM:SS`, relative times), live counters (`18 people viewing`), dynamic tokens (CSRF, session, UUIDs), user regex patterns, and ignore CSS selectors. Gated by sensitivity settings (High 0.5%, Medium 4%, Low 15%). |
| **5. Visual Region Picker** | Interactive point-and-click UI to highlight elements and save **Watch Regions** (e.g. `#product-details`, `main article`) and **Ignore Regions** (e.g. `.live-viewers-count`, `#live-clock`, `.ad-banner`). |
| **6. 3-Way Diff Engine** | **Unified & Split Text Diff** (Myers algorithm with line/word additions & deletions), **Interactive Visual Swipe Slider** (before/after horizontal curtain comparison), and **Pixelmatch Highlight Overlay** (neon magenta change masks). |
| **7. Multi-Channel Alerting** | **Telegram / Discord Webhook** (rich embeds with markdown diff summaries and direct links) and **Email notifications**. Deduplication guarantees zero duplicate alerts for the same content hash. Includes a **24-hour Daily Digest generator**. |
| **8. Per-Page Version Timeline** | Version history timeline (v1, v2, v3...) with diff stats (`+lines` / `-lines`), timestamps, content hashes, screenshot links, and live monitor status badges (`OK`, `CHANGED`, `ERROR`, `BLOCKED`, `PAUSED`). |

---

## 🧠 Core Architecture Solutions (The 4 Questions)

### 1. Is a site outage or CAPTCHA a change?
**Answer: Absolutely NOT.**
- **Problem**: Treating a `503 Service Unavailable`, `500 Server Error`, connection timeout, or a Cloudflare/Turnstile/reCAPTCHA challenge as a content change creates massive false positive alerts and pollutes clean baseline snapshots with error page text.
- **WatchTower Solution**:
  - The crawler executes `inspectForOutageOrCaptcha(status, html)` before DOM parsing.
  - HTTP 5xx codes are classified as `OUTAGE` incidents.
  - Cloudflare tokens (`cf-browser-verification`, `Turnstile`, `Just a moment...`, 403 blocks) are classified as `CAPTCHA` or `BLOCKED`.
  - **No snapshot is saved and content change alerts are suppressed**. The monitor enters `ERROR` or `BLOCKED` status with an incident logged in the Incident Audit Log.

### 2. If 200 users watch the same URL, is it fetched 200 times?
**Answer: No, it is fetched ONCE via Request Coalescing.**
- **WatchTower Solution**:
  - Implements `FetchDeduplicator`.
  - When concurrent checks target the exact same URL, only **1 headless browser crawl job** is dispatched.
  - The in-flight Promise is shared among all subscribers. When the render completes, the HTML, screenshot, and content hash are broadcast to all 200 monitors simultaneously.
  - Each monitor's individual watch/ignore CSS selectors are then processed in-memory without extra network overhead.

### 3. How to avoid endless alerts on pages that differ on every load?
**Answer: 4-Layer Noise Scrubbing & Similarity Thresholding.**
- **WatchTower Solution**:
  1. **Ignore CSS Selectors**: Strips dynamic headers, footers, live clocks (`#live-clock`), rotating ads (`.ad-banner`), and live viewer counters (`.live-viewers-count`) from the DOM before text extraction.
  2. **Regex Scrubbing**: Removes dates, 12h/24h timestamps, relative times ("just now", "5 mins ago"), CSRF tokens, session IDs, and custom regexes.
  3. **Similarity Gating**: Word-level Jaccard similarity gating (High: 0.5%, Medium: 4%, Low: 15%). Changes below the threshold are suppressed as noise.
  4. **Alert Deduplication**: Keyed by `monitorId-contentHash` ensuring identical content states never fire multiple alerts.

### 4. How to avoid hammering a site with requests?
**Answer: Domain-Level Mutex Queue & Polite Crawl Delays.**
- **WatchTower Solution**:
  - `DomainRateLimiter` enforces a strict concurrency limit of **1 active crawler per hostname**.
  - Enforces a polite crawl delay (default 1.5 to 2.0 seconds between successive requests to the same host).
  - Exponential backoff with randomized jitter on transient network errors prevents thundering herds.

---

## 🎁 Bonus Features Included

- **Keyword-Only Alerts**: Configure target trigger words (e.g. `Price`, `In Stock`, `Restocked`, `Sold Out`). Alerts highlight when target terms appear or disappear.
- **Number & Price Tracking with Charts**: Automatically parses currency values (`$49.99` ➔ `$39.99`) and renders an interactive metric trajectory chart across versions!
- **AI One-Line Change Summaries**: Intelligent NLP summarizer producing concise, human-readable explanations (e.g. *"Price dropped by $10.00 from $49.99 to $39.99 (20% discount)"* or *"Added new section on Quantum benchmarks"*).
- **Interactive Live Testing Studio**: Built-in mock test targets (`/mock/store`, `/mock/news`, `/mock/status`) with one-click buttons to simulate price drops, restock events, ticking clock noise, and 503 outages directly from the UI.
- **Per-Page RSS Feed Generator**: Standard RSS 2.0 XML endpoint at `/api/monitors/:id/rss` for any RSS reader!

---

## 🚀 Running the Project

### Prerequisites
- Node.js (v18+)
- Google Chrome or Microsoft Edge installed on system (auto-detected)

### Start Backend & Frontend
```bash
# 1. Install dependencies
npm install

# 2. Start backend server (Express on port 3001)
npm run server

# 3. Start Vite frontend (port 5173 with proxy to 3001)
npm run dev:frontend
```

Open your browser at:
👉 **`http://localhost:5173`** (or **`http://localhost:3001`**)
