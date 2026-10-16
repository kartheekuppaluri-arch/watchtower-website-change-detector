import React from 'react';
import { 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Server, 
  Globe, 
  GitCommit, 
  ArrowRight, 
  Terminal, 
  Clock, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  Code2,
  FileCode,
  LayoutGrid,
  Radio
} from 'lucide-react';
import { apiUrl } from '../api';

export default function AboutPage({ onBackToDashboard }) {
  const renderBackendUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL || 'Local / Configured Endpoint';

  return (
    <div className="about-page-container">
      {/* Top Banner / Breadcrumb */}
      <div className="about-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="about-badge">
              <Terminal size={12} /> Technical Architecture & Design Manifesto
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '8px' }}>
              WatchTower Architecture & Engineering Documentation
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '720px', lineHeight: 1.6 }}>
              A technical breakdown of WatchTower's change detection engine, noise scrubbing pipeline, diffing algorithms, and distributed deployment model. Built for engineering interviews, code audits, and technical evaluations.
            </p>
          </div>

          <button className="btn btn-primary" onClick={onBackToDashboard}>
            <LayoutGrid size={14} /> Back to Live Dashboard
          </button>
        </div>
      </div>

      {/* SECTION A & B: PROBLEM & SOLUTION */}
      <section className="about-section">
        <h2 className="about-section-title">
          <Globe size={18} color="var(--cyan-400)" />
          1. Problem Statement & System Objectives
        </h2>
        <div className="about-card">
          <p style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: '1.7', marginBottom: '12px' }}>
            Modern websites are dynamic, state-driven software artifacts that change constantly without publishing change feeds. Critical events—such as API documentation updates, pricing tier revisions, compliance and terms-of-service amendments, competitor product releases, and e-commerce inventory restocks—occur silently inside HTML DOM trees.
          </p>
          <div className="about-grid-2" style={{ marginTop: '16px' }}>
            <div style={{ background: '#131c2e', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: 600, color: 'var(--rose-400)', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} /> The Failure of Manual Verification
              </div>
              <ul style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '16px' }}>
                <li>High latency between an edit occurring and human awareness.</li>
                <li>Inability to visually isolate subtle inline text changes amidst large layouts.</li>
                <li>Cognitive fatigue from refreshing pages with non-deterministic dynamic content.</li>
                <li>Alert storms triggered by live clocks, visitor tickers, and advertisement banners.</li>
              </ul>
            </div>

            <div style={{ background: '#131c2e', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: 600, color: 'var(--emerald-400)', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} /> WatchTower's Automated Solution
              </div>
              <ul style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '16px' }}>
                <li>Scheduled headless DOM polling with scoped CSS watch selectors.</li>
                <li>Four-layer noise scrubbing (DOM pruning, timestamp/token regex, sensitivity gating).</li>
                <li>Cryptographic SHA-256 fingerprinting paired with Myers text diffing.</li>
                <li>Visual screenshot pixel comparison with pixelmatch highlight masks.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C: ARCHITECTURE & INFORMATION FLOW */}
      <section className="about-section">
        <h2 className="about-section-title">
          <Layers size={18} color="var(--cyan-400)" />
          2. End-to-End System Architecture & Information Flow
        </h2>
        <p className="about-section-desc">
          Every monitoring cycle traverses an 8-stage verification pipeline designed to avoid false alarms, mitigate thundering herd problems, and generate human-readable diff summaries.
        </p>

        <div style={{
          background: 'rgba(10, 15, 26, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.1)',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cyan-400)', boxShadow: '0 0 8px var(--cyan-400)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cyan-400)', fontWeight: 600 }}>
                WATCHTOWER RUNTIME PIPELINE ARCHITECTURE (8 VERIFIED STAGES)
              </span>
            </div>
            <a 
              href="/architecture-pipeline.jpg" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>View Full Resolution</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div style={{ 
            borderRadius: '10px', 
            overflow: 'hidden', 
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#ffffff'
          }}>
            <img 
              src="/architecture-pipeline.jpg" 
              alt="WatchTower Runtime Pipeline Architecture Blueprint Diagram" 
              style={{ 
                width: '100%', 
                height: 'auto', 
                display: 'block' 
              }}
              loading="lazy"
            />
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center' }}>
            Complete 8-stage verification pipeline: Target URL Config → Domain Queue & Coalescing → Crawl Pipeline → Incident Classifier → Noise Scrubbing Engine → Differential Analysis → Persistence & History Store → Alert Dispatcher & Feed Distribution.
          </div>
        </div>
      </section>

      {/* SECTION D: TECHNOLOGY STACK */}
      <section className="about-section">
        <h2 className="about-section-title">
          <Cpu size={18} color="var(--violet-400)" />
          3. Verified Technology Stack
        </h2>
        <p className="about-section-desc">
          The technologies below reflect the actual source code and dependency tree found in WatchTower's repository.
        </p>

        <div className="about-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="tech-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Component</th>
                <th style={{ width: '28%' }}>Technology / Library</th>
                <th>Role in WatchTower</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Frontend Framework</strong></td>
                <td><span className="code-pill">React 19 + Vite 6</span></td>
                <td>Single-page reactive UI with fast HMR, component lifecycle management, and optimistic UI updates for checks.</td>
              </tr>
              <tr>
                <td><strong>Design System</strong></td>
                <td><span className="code-pill">Deep Slate Obsidian CSS</span></td>
                <td>Refined deep slate palette with cyan, emerald, and violet accents, view-containment units, and custom scrollbars.</td>
              </tr>
              <tr>
                <td><strong>Iconography</strong></td>
                <td><span className="code-pill">lucide-react (v1.16)</span></td>
                <td>Crisp, semantically meaningful SVG icons representing system status, monitoring tools, and telemetry metrics.</td>
              </tr>
              <tr>
                <td><strong>Backend Server</strong></td>
                <td><span className="code-pill">Node.js + Express 4</span></td>
                <td>REST API handling monitor CRUD, on-demand inspection triggers, diff comparisons, mock test targets, and RSS feeds.</td>
              </tr>
              <tr>
                <td><strong>Static Scraping</strong></td>
                <td><span className="code-pill">cheerio (v1.0.0)</span></td>
                <td>Fast server-side DOM parser for static websites, watch selector scoping, and unwanted element pruning.</td>
              </tr>
              <tr>
                <td><strong>Browser Rendering</strong></td>
                <td><span className="code-pill">puppeteer-core (v24.4)</span></td>
                <td>Headless Chromium automation for JavaScript-rendered SPAs, custom viewport sizing (1280x800), and snapshot screenshot capture.</td>
              </tr>
              <tr>
                <td><strong>Text Diff Algorithm</strong></td>
                <td><span className="code-pill">diff (v7.0.0)</span></td>
                <td>Computes granular line-by-line and word-by-word diffs using the Myers longest common subsequence (LCS) algorithm.</td>
              </tr>
              <tr>
                <td><strong>Visual Diffing</strong></td>
                <td><span className="code-pill">pixelmatch (v5.3) + pngjs</span></td>
                <td>Pixel-level visual comparison between sequential screenshot PNGs, generating highlighted diff mask images.</td>
              </tr>
              <tr>
                <td><strong>Hashing & Security</strong></td>
                <td><span className="code-pill">Node.js crypto (SHA-256)</span></td>
                <td>Cryptographic content hashing for $O(1)$ equality checks and alert deduplication keys.</td>
              </tr>
              <tr>
                <td><strong>Hosting & Edge</strong></td>
                <td><span className="code-pill">Vercel (SPA) + Render (API)</span></td>
                <td>Vercel serves client assets with global CDN caching; Render runs the persistent Node.js Express server.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION E: CORE ALGORITHMIC IMPLEMENTATION */}
      <section className="about-section">
        <h2 className="about-section-title">
          <Code2 size={18} color="var(--emerald-400)" />
          4. Technical Implementation & Algorithmic Highlights
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card 1 */}
          <div className="about-card">
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="var(--rose-400)" />
              A. Outage and CAPTCHA Classification Engine
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Treating an outage (HTTP 500, 502, 503) or a Cloudflare Turnstile/reCAPTCHA challenge as a content change corrupts historical baselines and triggers false alerts. In <span className="code-pill">server/engine/crawler.js</span>, WatchTower executes <code className="code-pill">inspectForOutageOrCaptcha(status, html, title)</code> prior to DOM processing. If challenge signatures (<code className="code-pill">cf-browser-verification</code>, <code className="code-pill">challenges.cloudflare.com</code>) or 5xx codes are found, the cycle is logged as an <strong style={{ color: 'var(--text-main)' }}>incident</strong> and zero dirty snapshots are stored.
            </p>
          </div>

          {/* Card 2 */}
          <div className="about-card">
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="var(--cyan-400)" />
              B. Four-Layer Noise Scrubbing Pipeline
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              In <span className="code-pill">server/engine/noiseFilter.js</span>, pages with dynamic noise (live clocks, timestamps, rotating ads) are cleaned systematically:
            </p>
            <ul style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '18px', marginTop: '6px' }}>
              <li><strong>DOM Element Pruning:</strong> Removes <code className="code-pill">script</code>, <code className="code-pill">style</code>, <code className="code-pill">iframe</code>, and all user-configured <code className="code-pill">ignoreSelectors</code> (e.g. <code className="code-pill">.promo-ticker, #visitor-count</code>).</li>
              <li><strong>Regex Pattern Normalization:</strong> Matches ISO timestamps, 12h/24h clocks, relative times ("3 minutes ago"), UUIDs, and CSRF tokens, substituting them with normalized tokens before hashing.</li>
              <li><strong>Sensitivity Gating:</strong> Word-level Jaccard similarity gating (High: &gt;0.5%, Medium: &gt;4%, Low: &gt;15%). Changes below the threshold are ignored as background noise.</li>
              <li><strong>Alert Deduplication:</strong> Webhooks are keyed by <code className="code-pill">monitorId-contentHash</code>, guaranteeing that identical content states never trigger duplicate alert dispatches.</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="about-card">
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} color="var(--emerald-400)" />
              C. Request Coalescing & Thundering Herd Protection
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              When multiple users monitor identical URLs or check intervals overlap, launching independent headless browsers would hammer the target server and exhaust local CPU/memory. In <span className="code-pill">server/engine/scheduler.js</span>:
            </p>
            <ul style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '18px', marginTop: '6px' }}>
              <li><strong>FetchDeduplicator:</strong> Coalesces concurrent fetch requests for identical URLs into a single in-flight crawl Promise. All subscribers await the single crawl response.</li>
              <li><strong>DomainRateLimiter:</strong> Enforces a concurrency limit of 1 crawler per hostname with polite delays (minimum 2000ms between requests to the same domain).</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION F: DEPLOYMENT ARCHITECTURE */}
      <section className="about-section">
        <h2 className="about-section-title">
          <Server size={18} color="var(--cyan-400)" />
          5. Deployment & Runtime Configuration
        </h2>
        <div className="about-card">
          <p style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: '1.7', marginBottom: '12px' }}>
            WatchTower uses a split production topology designed to leverage edge CDN delivery for static client assets while maintaining a persistent Node.js environment for crawling and scheduling:
          </p>

          <div className="about-grid-2" style={{ marginTop: '14px' }}>
            <div style={{ background: '#131c2e', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px', marginBottom: '6px' }}>
                Frontend: Vercel Edge SPA
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                The React 19 application is compiled into static assets by Vite and distributed globally via Vercel's Edge Network. The client reads the backend URL dynamically using <code className="code-pill">import.meta.env.VITE_API_BASE_URL</code> or <code className="code-pill">import.meta.env.API_BASE_URL</code> via the centralized <code className="code-pill">src/api.js</code> helper.
              </p>
            </div>

            <div style={{ background: '#131c2e', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px', marginBottom: '6px' }}>
                Backend: Render Web Service
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                The Express.js server runs as a Node.js web service on Render (<code className="code-pill">{renderBackendUrl}</code>). It handles continuous background scheduling, rate-limited crawling, diff generation, and alert dispatching with CORS headers enabled.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION G & H: ENGINEERING TRADE-OFFS & ROADMAP */}
      <section className="about-section">
        <h2 className="about-section-title">
          <GitCommit size={18} color="var(--violet-400)" />
          6. Engineering Trade-offs, Current Limitations & Roadmap
        </h2>
        <div className="about-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>1. Headless Browser vs Lightweight HTTP Scraping:</strong>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.6' }}>
                <strong>Decision:</strong> WatchTower uses a dual-engine approach. When Chromium binaries are present, Puppeteer captures complete JS-rendered SPAs and visual screenshots. If binaries are absent or in constrained cloud runtimes, it falls back seamlessly to Cheerio HTTP crawling with generated SVG visual fallbacks.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>2. Storage Architecture & Ephemeral Persistence:</strong>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.6' }}>
                <strong>Current Limitation:</strong> The server uses an in-memory database backed by local JSON files (<span className="code-pill">data/monitors.json</span>). On container restarts or platform sleep cycles, ephemeral filesystem state is subject to recycling.
                <br />
                <strong>Future Roadmap:</strong> Transitioning the persistence layer to PostgreSQL via Prisma/Drizzle and moving screenshot blobs to Cloudflare R2 / AWS S3 for long-term historical retention.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>3. Distributed Worker Architecture:</strong>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.6' }}>
                <strong>Current Limitation:</strong> Scheduling runs in-process via Node.js intervals within the single Express container.
                <br />
                <strong>Future Roadmap:</strong> Decoupling the crawler into distributed background workers orchestrated via Redis and BullMQ, supporting horizontal autoscale across multiple worker instances.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '20px' }}>
        <button className="btn btn-primary" onClick={onBackToDashboard}>
          <LayoutGrid size={14} /> Return to WatchTower Live Dashboard
        </button>
      </div>
    </div>
  );
}
