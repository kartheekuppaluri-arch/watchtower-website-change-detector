import React, { useState } from 'react';
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
  Radio,
  Sparkles,
  Database,
  Send,
  Eye,
  ShieldAlert
} from 'lucide-react';
import { apiUrl } from '../api';

const STAGES = [
  {
    num: '01',
    title: 'Target URL Config & Ingestion',
    category: 'Ingestion Layer',
    input: 'Target URL + Schedule + Rules',
    output: 'Configured Monitor Entity',
    desc: 'Registers monitored endpoints with target URLs, user-defined check cadences (1m to 24h), scoped CSS watch selectors, ignore regions, sensitivity levels, and notification routes.',
    details: [
      'Flexible polling cadences (1m, 5m, 15m, 1h, 6h, 24h)',
      'Scoped CSS watch selector targeting (e.g., #pricing, article, .terms)',
      'Ignore selectors for dynamic banners, tickers, and navigation bars',
      'Configurable sensitivity thresholds (High: 0.5%, Medium: 4%, Low: 15%)'
    ]
  },
  {
    num: '02',
    title: 'Domain Queue & Coalescing',
    category: 'Queue & Concurrency',
    input: 'Pending Check Queue',
    output: 'Deduplicated Crawl Jobs',
    desc: 'Groups pending checks by target domain to enforce polite crawling delays, and coalesces concurrent identical crawls via FetchDeduplicator so identical URLs are never crawled redundantly.',
    details: [
      'DomainRateLimiter: strictly 1 active crawl per hostname with polite 1500–2000ms spacing',
      'FetchDeduplicator: merges concurrent duplicate requests into a single in-flight Promise',
      'Prevents thundering herd problems when multiple subscribers monitor the same URL',
      'Reduces unnecessary network roundtrips and protects target servers from load spikes'
    ]
  },
  {
    num: '03',
    title: 'Resilient Crawling Pipeline',
    category: 'Crawl Engine',
    input: 'Resolved URL + Watch Rules',
    output: 'Rendered DOM HTML + Viewport Screenshot',
    desc: 'Executes headless Chromium crawling with strict overall deadline budgeting, bounded stage timeouts, DOM salvage on navigation timeouts, isolated main-frame response tracking, and Cheerio HTTP fallback.',
    details: [
      'Primary: Puppeteer-core Headless Chromium with 1280×800 viewport screenshot capture',
      'Strict overall deadline budgeting (deadline = startTime + timeoutMs) prevents pipeline hangs',
      'DOM salvage on navigation timeout preserves partial DOM for heavy news/ad-cluttered sites',
      'Isolated main-frame HTTP tracking ignores benign 3rd-party ad/tracker network failures',
      'Fallback: High-speed Cheerio HTTP fetch engine when browser binaries are unavailable'
    ]
  },
  {
    num: '04',
    title: 'Incident Classifier & Outage Guard',
    category: 'Quality & Integrity',
    input: 'HTTP Status + Raw HTML + PNG Buffer',
    output: 'Integrity Verdict (Clean vs Incident)',
    desc: 'Analyzes HTTP status, raw HTML, and screenshot buffers before DOM processing. Detects 5xx server outages, network drops, Cloudflare Turnstile/CAPTCHA challenges, 403 blocks, and Incomplete Renders.',
    details: [
      'Zero dirty snapshot commits on 5xx server outages, network resets, or timeouts',
      'Detects Cloudflare Turnstile, reCAPTCHA, and 403 WAF challenge walls',
      'Incomplete Render protection: flags truncated renders (<15% baseline) to prevent false -90% deletion alerts',
      'Suppresses content change alerts and transitions monitor to ERROR/BLOCKED incident state'
    ]
  },
  {
    num: '05',
    title: '3-Layer Noise Scrubbing Engine',
    category: 'Deterministic Cleansing',
    input: 'Raw Document Content',
    output: 'Sanitized Normalized Content',
    desc: 'Transforms noisy raw HTML into clean, deterministic text streams through three progressive layers to eliminate timestamp, live-counter, and advertising false positives.',
    details: [
      'Layer A (DOM Tag Pruning): Strips <script>, <style>, <iframe>, <svg>, <nav>, and user ignoreSelectors',
      'Layer B (Regex Scrubbing): Strips ISO timestamps, 12h/24h clocks, relative times ("3m ago"), UUIDs, and session tokens',
      'Layer C (Whitespace Normalization): Collapses excessive spaces, tabs, and duplicate line breaks into clean semantic text'
    ]
  },
  {
    num: '06',
    title: 'Differential Analysis & Gemini AI',
    category: 'Diff & Intelligence',
    input: 'Cleaned Text + Previous Snapshot',
    output: 'Myers Diff + Visual Mask + Gemini AI Summary',
    desc: 'Generates SHA-256 hashes for <1ms equality short-circuiting. Executes Myers word/line semantic diffing, Pixelmatch visual comparisons, and calls Google Gemini 2.5 Flash for natural-language change summaries.',
    details: [
      'Cryptographic SHA-256 fingerprinting terminates unchanged cycles in <1ms',
      'Myers longest common subsequence (LCS) algorithm generates word-by-word and line-by-line diffs',
      'Pixelmatch visual screenshot diffing creates high-contrast magenta change overlay masks',
      'Google Gemini 2.5 Flash generates concise, plain-English one-line explanations of what actually changed',
      'Sensitivity threshold gating discards micro-changes below the configured percentage threshold'
    ]
  },
  {
    num: '07',
    title: 'Persistence & Snapshot History Store',
    category: 'Data Persistence',
    input: 'Verified Change Payload',
    output: 'Persisted Version Snapshot Record',
    desc: 'Stores immutable snapshot records with content hashes, diff statistics, numeric tracking metrics, crawl mode provenance, and securely uploads full-resolution screenshot PNGs to Supabase Storage with expiring signed URLs.',
    details: [
      'Immutable snapshot records with unique ID, timestamp, SHA-256 hash, and line diff metrics',
      'Numeric metric extraction tracks price fluctuations and quota shifts over time',
      'Supabase Storage integration stores screenshot PNGs and diff masks in secure cloud buckets',
      'Expiring signed URLs ensure secure, authenticated asset viewing without public exposure'
    ]
  },
  {
    num: '08',
    title: 'Alert Dispatcher & Feed Distribution',
    category: 'Notification & Delivery',
    input: 'Confirmed Change Event Payload',
    output: 'Multi-Channel Notifications + Feeds',
    desc: 'Dispatches real-time webhook payloads to Discord, Telegram, and custom REST webhooks keyed by monitored-contentHash to eliminate duplicate alerts. Generates 24-hour daily digests and per-monitor XML RSS feeds.',
    details: [
      'Keyed alert deduplication (monitorId-contentHash) guarantees zero duplicate notifications',
      'Discord webhooks with rich embeds, change stats, and Gemini AI summary highlights',
      'Telegram bot webhooks with instant markdown formatting and diff review links',
      '24-Hour Daily Change Digest consolidating all daily mutations across all active monitors',
      'Per-monitor RSS 2.0 XML feeds (/api/monitors/:id/rss) for Feedly, Slack, and Zapier integrations'
    ]
  }
];

export default function AboutPage({ onBackToDashboard }) {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const activeStage = STAGES[activeStageIndex];
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
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '780px', lineHeight: 1.6 }}>
              A comprehensive technical breakdown of WatchTower's 8-stage change detection engine, resilient crawling architecture, noise scrubbing pipeline, diffing algorithms, Gemini AI integration, and distributed cloud deployment model. Built for engineering interviews, code audits, and technical evaluations.
            </p>
          </div>

          <button className="btn btn-primary" onClick={onBackToDashboard}>
            <LayoutGrid size={14} /> Back to Live Dashboard
          </button>
        </div>
      </div>

      {/* SECTION 1: PROBLEM STATEMENT & SYSTEM OBJECTIVES */}
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
                <AlertTriangle size={15} /> The Failure of Naive Monitoring
              </div>
              <ul style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '16px' }}>
                <li><strong>False Alarm Storms:</strong> Dynamic timestamps (<em>"3m ago"</em>), live clocks, rotating ads, and viewer counters trigger false notifications on every check.</li>
                <li><strong>Outage & CAPTCHA Corruption:</strong> Basic tools treat 503 errors and Cloudflare challenge screens as page changes, overwriting clean baselines.</li>
                <li><strong>Truncated Render Flaws:</strong> Heavy JavaScript or ad-cluttered sites that timeout trigger catastrophic false -90% deletion diffs.</li>
                <li><strong>Server Hammering:</strong> Multiple subscribers watching the same URL hammer target servers without request coalescing.</li>
              </ul>
            </div>

            <div style={{ background: '#131c2e', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: 600, color: 'var(--emerald-400)', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={15} /> WatchTower's Engineered Solution
              </div>
              <ul style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '16px' }}>
                <li><strong>8-Stage Runtime Pipeline:</strong> Deterministic progression from request coalescing to Gemini AI summarization and multi-channel alerts.</li>
                <li><strong>Incident Classifier:</strong> Separates server outages, CAPTCHAs, and incomplete renders from legitimate content changes.</li>
                <li><strong>3-Layer Noise Scrubbing:</strong> DOM element pruning, dynamic regex tokenization, and whitespace collapse.</li>
                <li><strong>Dual Semantic & Visual Diffing:</strong> Myers longest common subsequence diffs paired with Pixelmatch visual masks and Google Gemini 2.5 Flash summaries.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: END-TO-END 8-STAGE RUNTIME PIPELINE ARCHITECTURE */}
      <section className="about-section">
        <h2 className="about-section-title">
          <Layers size={18} color="var(--cyan-400)" />
          2. End-to-End System Architecture (8-Stage Runtime Pipeline)
        </h2>
        <p className="about-section-desc">
          Every monitoring cycle traverses an 8-stage verification pipeline designed to guarantee zero false alarms, protect target servers, ensure screenshot integrity, and generate human-readable diff summaries.
        </p>

        {/* Blueprint Architecture Diagram Display */}
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
                WATCHTOWER RUNTIME PIPELINE: DETECT / ANALYZE / ALERT (8 VERIFIED STAGES)
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
            background: '#090d16'
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
            Complete 8-stage runtime verification pipeline: Target URL Config → Domain Queue & Coalescing → Crawl Pipeline → Incident Classifier → Noise Scrubbing Engine → Differential Analysis → Persistence & History Store → Alert Dispatcher & Feed Distribution.
          </div>
        </div>

        {/* Interactive / Detailed 8-Stage Architecture Explorer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.25fr',
          gap: '20px',
          alignItems: 'start'
        }}>
          {/* Left Column: Stage Selector List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {STAGES.map((stage, idx) => {
              const isSelected = idx === activeStageIndex;
              return (
                <div
                  key={stage.num}
                  onClick={() => setActiveStageIndex(idx)}
                  style={{
                    background: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-elevated)',
                    border: `1px solid ${isSelected ? 'var(--cyan-500)' : 'var(--border-subtle)'}`,
                    borderRadius: '8px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.15)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '12px', 
                      color: isSelected ? 'var(--cyan-400)' : 'var(--text-dim)', 
                      fontWeight: 700 
                    }}>
                      {stage.num}
                    </span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#ffffff' : 'var(--text-main)' }}>
                        {stage.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {stage.category}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={14} color={isSelected ? 'var(--cyan-400)' : 'var(--text-dim)'} />
                </div>
              );
            })}
          </div>

          {/* Right Column: Stage Deep Dive Card */}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--cyan-500)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', pb: '12px', paddingBottom: '12px' }}>
              <div>
                <span className="code-pill" style={{ color: 'var(--cyan-400)', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                  STAGE {activeStage.num} OF 08
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginTop: '6px' }}>
                  {activeStage.title}
                </h3>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {activeStage.category}
              </span>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '16px' }}>
              {activeStage.desc}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--bg-sunken)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '4px' }}>INPUT</div>
                <div style={{ fontSize: '12px', color: 'var(--cyan-300)', fontFamily: 'var(--font-mono)' }}>{activeStage.input}</div>
              </div>
              <div style={{ background: 'var(--bg-sunken)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '4px' }}>OUTPUT</div>
                <div style={{ fontSize: '12px', color: 'var(--emerald-400)', fontFamily: 'var(--font-mono)' }}>{activeStage.output}</div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                Key Technical Capabilities & Guarantees:
              </div>
              <ul style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '18px' }}>
                {activeStage.details.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: VERIFIED TECHNOLOGY STACK */}
      <section className="about-section">
        <h2 className="about-section-title">
          <Cpu size={18} color="var(--violet-400)" />
          3. Verified Technology Stack
        </h2>
        <p className="about-section-desc">
          The technologies below reflect the actual source code, production dependencies, and deployment topology in WatchTower's repository.
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
                <td>Single-page reactive dashboard with instant HMR, component lifecycle management, and optimistic UI updates for manual and automated crawl checks.</td>
              </tr>
              <tr>
                <td><strong>AI Intelligence Engine</strong></td>
                <td><span className="code-pill">@google/genai (Gemini 2.5 Flash)</span></td>
                <td>Analyzes Myers semantic text additions and deletions to generate concise, one-sentence plain-English explanations of detected website changes.</td>
              </tr>
              <tr>
                <td><strong>Cloud Screenshot Storage</strong></td>
                <td><span className="code-pill">@supabase/supabase-js</span></td>
                <td>Encrypted cloud object storage for full-resolution screenshot PNGs and diff masks with expiring signed URLs, ensuring zero local disk saturation.</td>
              </tr>
              <tr>
                <td><strong>Headless Browser Engine</strong></td>
                <td><span className="code-pill">puppeteer-core (v24.4)</span></td>
                <td>Headless Chromium automation for JavaScript-rendered SPAs, deadline-budgeted crawl execution, DOM salvage, and 1280×800 viewport screenshot capture.</td>
              </tr>
              <tr>
                <td><strong>Static Scraping Fallback</strong></td>
                <td><span className="code-pill">cheerio (v1.0.0)</span></td>
                <td>High-speed server-side DOM parser for static HTML websites, watch selector scoping, and fast fallback when browser binaries are unavailable.</td>
              </tr>
              <tr>
                <td><strong>Semantic Text Diff Algorithm</strong></td>
                <td><span className="code-pill">diff (v7.0.0)</span></td>
                <td>Computes granular line-by-line and word-by-word diffs using the Myers longest common subsequence (LCS) algorithm with colored change metrics.</td>
              </tr>
              <tr>
                <td><strong>Visual Pixel Diffing</strong></td>
                <td><span className="code-pill">pixelmatch (v5.3) + pngjs</span></td>
                <td>Pixel-level visual comparison between sequential screenshot PNGs, generating highlighted neon magenta diff mask overlays.</td>
              </tr>
              <tr>
                <td><strong>Cryptographic Fingerprinting</strong></td>
                <td><span className="code-pill">Node.js crypto (SHA-256)</span></td>
                <td>Cryptographic content hashing for $O(1)$ equality checks (&lt;1ms short-circuit) and alert deduplication keys.</td>
              </tr>
              <tr>
                <td><strong>Alerts & Webhooks</strong></td>
                <td><span className="code-pill">Discord, Telegram, RSS, Resend</span></td>
                <td>Multi-channel alert dispatching keyed by monitor-contentHash, daily digest generation, per-monitor XML RSS 2.0 feeds, and transactional email alerts.</td>
              </tr>
              <tr>
                <td><strong>Backend Runtime & Hosting</strong></td>
                <td><span className="code-pill">Node.js Express + Render + Vercel</span></td>
                <td>Split topology: Vercel delivers the client SPA via global edge CDN; Render hosts the persistent Node.js Express crawler backend.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 4: CORE ALGORITHMIC IMPLEMENTATION */}
      <section className="about-section">
        <h2 className="about-section-title">
          <Code2 size={18} color="var(--emerald-400)" />
          4. Technical Implementation & Algorithmic Highlights
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card A: Outage, CAPTCHA & Incomplete Render Classification */}
          <div className="about-card">
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} color="var(--rose-400)" />
              A. Outage, CAPTCHA, and Incomplete Render Classification
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Treating an outage (HTTP 500, 502, 503), network failure (<code>ERR_CONNECTION_RESET</code>), Cloudflare challenge, or a broken truncated render as a content change corrupts historical baselines and triggers catastrophic false alerts.
            </p>
            <div style={{ background: 'var(--bg-sunken)', padding: '12px', borderRadius: '6px', marginTop: '10px', borderLeft: '3px solid var(--rose-400)' }}>
              <span style={{ fontWeight: 600, color: 'var(--rose-400)', fontSize: '12.5px' }}>WatchTower Incident Guard Implementation:</span>
              <ul style={{ paddingLeft: '18px', marginTop: '6px', fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                <li><strong>Outage Detection:</strong> In <code>server/engine/crawler.js</code>, <code>inspectForOutageOrCaptcha(status, html, title)</code> scans for 5xx codes, gateway timeouts, and network drop signatures.</li>
                <li><strong>Anti-Bot & CAPTCHA Detection:</strong> Identifies Cloudflare Turnstile, <code>cf-browser-verification</code>, reCAPTCHA, and 403 WAF blocks.</li>
                <li><strong>Incomplete Render Guard:</strong> If a crawl yields suspiciously truncated content (&lt;50 characters or &lt;15% of the baseline text) without a valid redirection code, WatchTower flags an <code>INCOMPLETE_RENDER</code> incident rather than triggering a false -90% deletion alert.</li>
                <li><strong>Baseline Preservation:</strong> When an incident occurs, <strong>zero dirty snapshots are stored</strong>, content change alerts are suppressed, and the monitor enters an <code>ERROR</code> or <code>BLOCKED</code> state with an incident logged.</li>
              </ul>
            </div>
          </div>

          {/* Card B: Resilient Crawling Engine */}
          <div className="about-card">
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="var(--cyan-400)" />
              B. Resilient Crawling Architecture (Deadline Budgeting & DOM Salvage)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              JavaScript-heavy news sites (CNN, NYT, TechCrunch) load dozens of ad scripts, telemetry beacons, and video players that easily exceed standard Puppeteer navigation timeouts. WatchTower incorporates a multi-layer resiliency engine:
            </p>
            <ul style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '18px', marginTop: '6px' }}>
              <li><strong>Overall Crawl Deadline Budgeting:</strong> Computes <code>deadline = startTime + timeoutMs</code> at launch and calculates remaining milliseconds for every sub-operation (navigation, DOM extraction, screenshot). No individual step can hang the worker.</li>
              <li><strong>DOM Salvage on Timeout:</strong> When a navigation event times out, WatchTower evaluates whether meaningful DOM content was already rendered by the browser. If so, it extracts the salvageable HTML and continues the pipeline instead of throwing a fatal error.</li>
              <li><strong>Isolated Main-Frame Response Tracking:</strong> Tracks only the HTTP status of the primary top-level navigation request, ignoring failed or blocked 3rd-party ad trackers, beacons, and analytics scripts.</li>
              <li><strong>Cheerio HTTP Fallback:</strong> If Chromium fails to initialize or experiences platform constraints, WatchTower falls back to a high-speed Cheerio HTTP request (<code>crawlMode: 'http_fallback'</code>), ensuring continuous uptime.</li>
            </ul>
          </div>

          {/* Card C: Google Gemini AI Change Summarization */}
          <div className="about-card">
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--violet-400)" />
              C. Google Gemini AI Change Summarization Engine
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Raw diffs containing hundreds of lines of code or markup are difficult for humans to parse quickly. WatchTower integrates the official <code>@google/genai</code> SDK using the <code>gemini-2.5-flash</code> model to synthesize raw Myers additions and deletions into natural-language one-line summaries:
            </p>
            <ul style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '18px', marginTop: '6px' }}>
              <li><strong>Contextual Diff Parsing:</strong> Feeds the sanitized Myers diff chunks (added lines and removed lines) to Gemini with a strict system prompt instructing it to describe <em>what changed and why it matters</em> in one concise sentence.</li>
              <li><strong>Example Output:</strong> <em>"Pro plan pricing increased from $29 to $49/month, and team seat limits were removed."</em></li>
              <li><strong>Graceful Degradation:</strong> If <code>GEMINI_API_KEY</code> is not provided or rate limits are reached, the differ falls back seamlessly to algorithmic metric summaries (e.g., <em>"+4 additions, -2 deletions"</em>) without interrupting the crawl cycle.</li>
            </ul>
          </div>

          {/* Card D: 3-Layer Noise Scrubbing Pipeline */}
          <div className="about-card">
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} color="var(--emerald-400)" />
              D. 3-Layer Deterministic Noise Scrubbing Pipeline
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              In <code>server/engine/noiseFilter.js</code>, pages containing dynamic noise (live clocks, timestamps, rotating ads) are cleaned systematically:
            </p>
            <ul style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '18px', marginTop: '6px' }}>
              <li><strong>Layer A (DOM Element Pruning):</strong> Removes <code>&lt;script&gt;</code>, <code>&lt;style&gt;</code>, <code>&lt;iframe&gt;</code>, <code>&lt;svg&gt;</code>, <code>&lt;nav&gt;</code>, and all user-configured <code>ignoreSelectors</code> (e.g., <code>.promo-ticker, #visitor-count</code>).</li>
              <li><strong>Layer B (Regex Pattern Normalization):</strong> Matches ISO timestamps, 12h/24h clocks, relative dates (<em>"3 minutes ago"</em>), UUIDs, session tokens, and CSRF tokens, substituting them with normalized tokens before hashing.</li>
              <li><strong>Layer C (Whitespace Normalization):</strong> Collapses excessive spaces, tabs, and duplicate line breaks into clean semantic text.</li>
              <li><strong>Sensitivity Threshold Gating:</strong> Word-level Jaccard similarity gating (High: &gt;0.5%, Medium: &gt;4%, Low: &gt;15%). Changes below the threshold are ignored as background noise.</li>
            </ul>
          </div>

          {/* Card E: Request Coalescing & Thundering Herd Protection */}
          <div className="about-card">
            <h3 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} color="var(--amber-400)" />
              E. Request Coalescing & Domain Rate Limiting
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              When multiple users monitor identical URLs or check intervals overlap, launching independent headless browsers would hammer the target server and exhaust CPU/memory. In <code>server/engine/scheduler.js</code>:
            </p>
            <ul style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.6', paddingLeft: '18px', marginTop: '6px' }}>
              <li><strong>FetchDeduplicator:</strong> Coalesces concurrent fetch requests for identical URLs into a single in-flight crawl Promise. All subscribers await the single crawl response.</li>
              <li><strong>DomainRateLimiter:</strong> Enforces a concurrency limit of 1 crawler per hostname with polite delays (minimum 1500–2000ms between requests to the same domain).</li>
              <li><strong>Alert Deduplication:</strong> Webhooks are keyed by <code>monitorId-contentHash</code>, guaranteeing that identical content states never trigger duplicate alert dispatches.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 5: DEPLOYMENT ARCHITECTURE */}
      <section className="about-section">
        <h2 className="about-section-title">
          <Server size={18} color="var(--cyan-400)" />
          5. Deployment Topology & Cloud Infrastructure
        </h2>
        <div className="about-card">
          <p style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: '1.7', marginBottom: '12px' }}>
            WatchTower uses a split production topology designed to leverage edge CDN delivery for static client assets, persistent compute for headless browser scheduling, encrypted cloud object storage for visual screenshots, and serverless AI for intelligent change synthesis:
          </p>

          <div className="about-grid-2" style={{ marginTop: '14px' }}>
            <div style={{ background: '#131c2e', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={14} color="var(--cyan-400)" /> Frontend: Vercel Edge SPA
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                The React 19 application is compiled by Vite and distributed globally via Vercel's Edge CDN. The client dynamically connects to the backend API via <code>src/api.js</code> using environment-aware endpoint resolution (<code>VITE_API_BASE_URL</code>).
              </p>
            </div>

            <div style={{ background: '#131c2e', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Server size={14} color="var(--emerald-400)" /> Backend: Render Web Service
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                The Express.js server runs as a persistent Node.js web service on Render (<code className="code-pill">{renderBackendUrl}</code>). It handles continuous background scheduling, rate-limited crawling, diff generation, and alert dispatching with CORS headers enabled.
              </p>
            </div>

            <div style={{ background: '#131c2e', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={14} color="var(--cyan-400)" /> Storage: Supabase Cloud Bucket
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Full-resolution screenshot PNGs and pixelmatch diff mask overlays are stored in a secure Supabase Storage bucket. The server issues expiring signed URLs for client rendering, preventing local disk exhaustion and enabling long-term historical retention.
              </p>
            </div>

            <div style={{ background: '#131c2e', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px' }}>
              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="var(--violet-400)" /> AI: Google Gemini 2.5 Flash
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                High-speed Gemini 2.5 Flash inference via <code>@google/genai</code> analyzes raw text additions and deletions to deliver natural-language summaries in real-time, which are attached directly to snapshot history and webhook alerts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: ENGINEERING TRADE-OFFS & ROADMAP */}
      <section className="about-section">
        <h2 className="about-section-title">
          <GitCommit size={18} color="var(--violet-400)" />
          6. Engineering Trade-offs, Current Architecture & Future Roadmap
        </h2>
        <div className="about-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>1. Headless Browser vs Lightweight HTTP Scraping:</strong>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.6' }}>
                <strong>Architecture:</strong> WatchTower implements a resilient dual-engine approach. When Chromium binaries are present, Puppeteer captures complete JS-rendered SPAs with 1280×800 screenshots and strict deadline budgeting. If browser initialization encounters platform memory limits or missing binaries, WatchTower automatically falls back to Cheerio HTTP crawling (<code>crawlMode: 'http_fallback'</code>), ensuring continuous monitoring without downtime.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>2. Cloud Screenshot Storage vs Local Disk:</strong>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.6' }}>
                <strong>Production Status:</strong> Fully integrated. WatchTower uses Supabase Storage via <code>@supabase/supabase-js</code> for encrypted cloud screenshot storage with expiring signed URLs. This eliminates local container disk saturation on Render and ensures screenshots survive container restarts.
                <br />
                <strong>Next Step:</strong> Migrating the monitor ledger from SQLite/JSON files to managed PostgreSQL (via Supabase or Neon) for distributed multi-instance horizontal scaling.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>3. AI Summarization vs Algorithmic Diff Statistics:</strong>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.6' }}>
                <strong>Production Status:</strong> Fully integrated. WatchTower combines Myers line-by-line diff metrics with Google Gemini 2.5 Flash natural-language one-line summaries. Users receive both exact code-level additions/deletions and an executive plain-English explanation.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>4. Distributed Worker Architecture (Roadmap):</strong>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.6' }}>
                <strong>Current State:</strong> Scheduling runs in-process via Node.js intervals within the Render Express container with <code>DomainRateLimiter</code> and <code>FetchDeduplicator</code>.
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
