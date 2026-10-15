# WatchTower — Website Change Detection & Diff Engine

A full-stack, production-grade service that monitors public web pages, captures content snapshots, filters dynamic noise, and alerts users to meaningful changes while preventing false positives.

**Live Application:** [https://watchtower-website-change-detector.vercel.app/](https://watchtower-website-change-detector.vercel.app/)

---

## Overview

WatchTower is designed to monitor web content reliably at scale. Unlike simple HTTP pollers, WatchTower implements multi-layered noise suppression, visual region extraction, request coalescing, and incident detection to ensure alerts represent authentic, actionable page modifications.

The application is deployed as a single full-stack project on Vercel, combining a modern React/Vite dashboard with an Express-powered serverless backend.

---

## Core Engineering Decisions

### 1. Is a site outage or CAPTCHA considered a change?
**No. Outages and challenges are classified as incidents, not content changes.**

- **Problem:** Treating HTTP 5xx responses, timeouts, or Cloudflare/CAPTCHA challenge pages as content updates generates false alarms and corrupts clean baseline snapshots with error HTML.
- **Solution:** Before DOM parsing, the engine evaluates responses via `inspectForOutageOrCaptcha()`. Responses matching 5xx status codes, Cloudflare Turnstile tokens, or CAPTCHA challenges are categorized as `OUTAGE`, `CAPTCHA`, or `BLOCKED`. Change alerts are suppressed, no corrupted snapshot is recorded, and the incident is appended to the monitor's audit history with an updated status badge.

### 2. If 200 users monitor the same URL, is it fetched 200 times?
**No. Concurrent requests are coalesced into a single crawl job.**

- **Problem:** Redundant crawls of the same URL waste server bandwidth and trigger target IP rate limits.
- **Solution:** A centralized `FetchDeduplicator` manages an in-flight Promise map keyed by normalized URL. If multiple monitors or users request a check for the same target concurrently, only one fetch/render job executes. The resulting DOM snapshot is distributed to all waiting monitors simultaneously, where each monitor's custom CSS selectors and noise filters execute in-memory.

### 3. How to avoid false alerts on pages that change on every load?
**Multi-layer noise scrubbing with similarity threshold gating.**

- **Problem:** Dynamic elements (live clocks, view counters, session IDs, rotating banners) cause content hashes to mutate on every request.
- **Solution:**
  1. **Ignore Selectors:** Removes targeted DOM subtrees (`#live-clock`, `.view-counter`, `.ad-banner`) prior to text extraction.
  2. **Regex Normalization:** Strips ISO timestamps, relative dates ("3 minutes ago"), UUIDs, and user-defined regex patterns.
  3. **Similarity Gating:** Computes word-level Jaccard similarity and character delta against sensitivity thresholds (High: 0.5%, Medium: 4.0%, Low: 15.0%). Variations below the threshold are filtered as background noise.
  4. **Hash Deduplication:** Stores a new snapshot only when the SHA-256 hash of normalized text differs from the latest record.

### 4. How to prevent hammering external servers?
**Per-domain mutex queues with polite crawl delays.**

- **Problem:** Uncontrolled polling can degrade target site performance or result in IP blacklisting.
- **Solution:** The `DomainRateLimiter` enforces a strict concurrency ceiling of one active request per hostname, along with an enforced delay (1.5–2.0 seconds) between successive requests to the same origin. Exponential backoff with jitter is applied on transient network errors.

---

## Key Features

- **Visual Region Selector:** Point-and-click interface to define Watch Selectors (regions of interest) and Ignore Selectors (noise elements) without manual CSS inspection.
- **3-Way Diff Engine:**
  - **Text Diff:** Unified and split side-by-side diff highlighting line-level and word-level additions/deletions.
  - **Visual Comparison:** Interactive horizontal swipe curtain comparing before-and-after screenshots.
  - **Pixelmatch Mask:** Pixel-level visual difference highlight overlay.
- **Automated Summaries:** Rule-assisted and NLP summarization highlighting specific events (e.g., price drop from $49.99 to $39.99, restock notices).
- **Multi-Channel Alerts:** Webhook delivery (Discord/Telegram/Slack format) and simulated email alerts with deduplication ensuring no duplicate notifications for the same state.
- **Numerical & Metric Tracking:** Automatically parses numeric values (e.g. pricing, stock quantities) to render trend lines across recorded versions.
- **Version Timeline & RSS Feed:** Detailed audit trail of all historical snapshots, diff metrics, and content hashes, alongside an RSS 2.0 XML endpoint per monitor.
- **Interactive Testing Studio:** Built-in mock targets (`/mock/store`, `/mock/news`, `/mock/status`) to simulate price drops, restock toggles, dynamic clocks, and 503 outages directly from the UI.

---

## Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────┐
│                   Vercel Deployment                    │
├───────────────────────────┬────────────────────────────┤
│      Vite Frontend        │     Express Serverless     │
│   React 19 + Lucide UI    │   api/index.js (Handler)   │
│   Client-side SPA         │   /api/* & /mock/* routes  │
└─────────────┬─────────────┴──────────────┬─────────────┘
              │                            │
              ▼                            ▼
      Browser Client               Crawler & Diff Engine
   (Diff Modal, Picker)          (Cheerio / Puppeteer / Diff)
                                           │
                                           ▼
                                 Persistence & Alerts
                              (/tmp & In-Memory / Webhook)
```

- **Frontend:** React 19, Vite, Lucide Icons, Vanilla CSS with custom design system (dark mode, glassmorphism).
- **Backend:** Node.js, Express 4.
- **Crawling & Scraping:** Cheerio (high-speed DOM parsing on serverless), Puppeteer-Core (local headless Chrome/Edge automation).
- **Diffing:** jsdiff (Myers diff algorithm), pixelmatch, pngjs.
- **Scheduling:** Vercel Cron Jobs (production) and background setInterval timer (local).

---

## Vercel Deployment Architecture

The application is structured for unified, single-repository deployment on Vercel:

1. **Serverless Function Entry Points (`api/index.js`, `api/[...path].js`):**
   Vercel compiles the `api/` directory into serverless functions. The Express app is exported directly as the request handler, receiving incoming HTTP calls routed by `vercel.json`.

2. **Route Handling (`vercel.json`):**
   Requests to `/api/*` and `/mock/*` route to the Express handler, while all frontend asset requests route to the static `dist/` directory. Unmatched paths fall back to `index.html` for client-side routing.

3. **Database & State Management:**
   - Serverless containers run on an ephemeral, read-only root filesystem.
   - For demo resilience, `server/db.js` uses an in-memory cache backed by `/tmp/data/db.json` when running in production, pre-seeded with baseline monitors so all features function immediately upon cold start.
   - For permanent production workloads, an external managed database (e.g. PostgreSQL, Supabase, Neon, or Vercel KV) can be configured via environment variables.

4. **Environment-Adaptive Crawler:**
   - **Local / Self-Hosted:** Detects local Google Chrome or Microsoft Edge installations to capture viewport screenshots and render JavaScript SPAs.
   - **Vercel Serverless:** Automatically falls back to high-speed Cheerio HTTP fetching and generates lightweight SVG visual preview snapshots, operating within serverless memory and execution limits.

---

## Local Development Setup

### Prerequisites
- Node.js 18.0 or higher
- Google Chrome or Microsoft Edge (optional, for local headless browser screenshots)

### Installation & Execution

```bash
# 1. Clone the repository
git clone https://github.com/kartheekuppaluri-arch/watchtower-website-change-detector.git
cd watchtower-website-change-detector

# 2. Install dependencies
npm install

# 3. Start development environment (runs backend and Vite concurrently)
npm run dev
```

The application will be accessible at:
- **Frontend Dashboard:** `http://localhost:5173`
- **Backend API:** `http://localhost:3001`
- **Mock E-Commerce Store:** `http://localhost:3001/mock/store`
- **Mock News Portal:** `http://localhost:3001/mock/news`
- **Mock Status Board:** `http://localhost:3001/mock/status`

### Build Verification
```bash
npm run build
```

---

## API Summary

| Endpoint | Method | Description |
|---|---|---|
| `/api/monitors` | `GET` | List all monitors with latest snapshot and incident counts |
| `/api/monitors` | `POST` | Create a new monitor configuration |
| `/api/monitors/:id` | `GET` | Fetch single monitor details and full version history |
| `/api/monitors/:id` | `PUT` | Update monitor selectors, intervals, or alert rules |
| `/api/monitors/:id` | `DELETE` | Delete a monitor and its historical snapshots |
| `/api/monitors/:id/check` | `POST` | Trigger an immediate manual check for a monitor |
| `/api/monitors/check-all` | `POST` / `GET` | Execute checks across all active monitors (used by Vercel Cron) |
| `/api/diff/compare` | `POST` | Compute text diff, visual diff, and summary between any two snapshots |
| `/api/picker/inspect` | `POST` | Inspect and extract DOM tree for visual selector configuration |
| `/api/alerts/test-webhook` | `POST` | Test delivery of Discord / Telegram / generic webhook payloads |
| `/api/monitors/:id/rss` | `GET` | Output standard RSS 2.0 XML feed of page changes |
| `/api/digest` | `GET` | Compile 24-hour daily digest of changes and incidents |
