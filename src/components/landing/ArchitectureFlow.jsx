import React, { useState } from 'react';
import { 
  Globe, 
  ArrowRight, 
  Server, 
  Sliders, 
  Database, 
  ShieldAlert, 
  Layers, 
  GitCommit, 
  Send, 
  ExternalLink, 
  Sparkles,
  Cpu,
  CheckCircle2,
  FileCode
} from 'lucide-react';

const architectureLayers = [
  {
    id: 1,
    stageNumber: '01',
    title: 'Target URL Config & Ingestion',
    category: 'Ingestion Layer',
    desc: 'Registers monitored endpoints with target URLs, user-defined check cadences (1m to 24h), scoped CSS watch selectors, ignore regions, sensitivity levels, and notification routes.',
    inputs: 'Target URL + Scope Rules',
    outputs: 'Configured Monitor Entity',
    icon: <Globe size={18} color="var(--cyan-400)" />,
    highlights: ['Polling intervals 1m–24h', 'CSS watch & ignore selectors', 'Custom regex noise patterns']
  },
  {
    id: 2,
    stageNumber: '02',
    title: 'Domain Queue & Coalescing',
    category: 'Queue & Concurrency',
    desc: 'Groups pending requests by hostname, enforces polite inter-request delays (minimum 2000ms), and coalesces identical in-flight check requests via FetchDeduplicator to prevent thundering herds.',
    inputs: 'Pending Target URL Queue',
    outputs: 'Deduplicated Crawl Execution',
    icon: <Server size={18} color="var(--cyan-400)" />,
    highlights: ['1 crawler per hostname limit', 'Polite domain rate limiting', 'Fetch deduplication (1 in-flight)']
  },
  {
    id: 3,
    stageNumber: '03',
    title: 'Resilient Crawling Pipeline',
    category: 'Headless Execution',
    desc: 'Executes headless Chromium rendering with overall crawl deadline budgeting, bounded stage timeouts, DOM salvage on navigation timeout, isolated main-frame HTTP status tracking, and Cheerio HTTP fetch fallback.',
    inputs: 'Resolved URL + Watch Selectors',
    outputs: 'Rendered DOM HTML + Viewport Screenshot',
    icon: <Cpu size={18} color="var(--cyan-400)" />,
    highlights: ['Dynamic deadline time budgeting', 'DOM salvage on event timeouts', 'Cheerio fast HTTP fallback']
  },
  {
    id: 4,
    stageNumber: '04',
    title: 'Incident Classifier & Outage Guard',
    category: 'Quality & Integrity',
    desc: 'Analyzes HTTP status, raw HTML, and screenshot buffers. Detects 5xx server outages, network drops (ERR_CONNECTION_*), Cloudflare Turnstile CAPTCHAs, 403 WAF blocks, and suspiciously truncated renders (<15% baseline).',
    inputs: 'HTTP Status + Raw HTML + PNG',
    outputs: 'Integrity Verdict (Continue vs Incident)',
    icon: <ShieldAlert size={18} color="var(--rose-400)" />,
    highlights: ['Zero dirty snapshot commits', 'Suppresses false change alerts', 'Incomplete render protection']
  },
  {
    id: 5,
    stageNumber: '05',
    title: '3-Layer Noise Scrubbing Engine',
    category: 'Deterministic Cleansing',
    desc: 'Transforms noisy raw HTML into clean, deterministic text. Layer A prunes script/style/iframe tags and user ignore selectors. Layer B strips timestamps, relative dates, and session tokens via regex. Layer C collapses whitespace.',
    inputs: 'Raw Document Content',
    outputs: 'Sanitized Normalized Content',
    icon: <Sliders size={18} color="var(--cyan-400)" />,
    highlights: ['Layer A: DOM tag pruning', 'Layer B: Dynamic regex scrubbing', 'Layer C: Whitespace normalization']
  },
  {
    id: 6,
    stageNumber: '06',
    title: 'Differential Analysis & Gemini AI',
    category: 'Diff & Intelligence',
    desc: 'Computes cryptographic SHA-256 fingerprints for O(1) equality. Runs Myers line/word diffing, tracks numeric shifts (prices, limits), executes Pixelmatch visual screenshot diffing, and generates concise Google Gemini AI change summaries.',
    inputs: 'Cleaned Text + Previous Snapshot',
    outputs: 'Myers Diff + Visual Mask + AI Summary',
    icon: <GitCommit size={18} color="var(--emerald-400)" />,
    highlights: ['Myers semantic LCS diffing', 'Pixelmatch visual comparison', 'Google Gemini 2.5 Flash summaries']
  },
  {
    id: 7,
    stageNumber: '07',
    title: 'Persistence & Snapshot History Store',
    category: 'Data Persistence',
    desc: 'Stores immutable snapshot records with timestamps, content hashes, line diff statistics, numeric tracking metrics, crawl mode provenance, and securely uploads full-resolution screenshot PNGs to Supabase Storage with expiring signed URLs.',
    inputs: 'Verified Change Result Payload',
    outputs: 'Persisted Version Snapshot Record',
    icon: <Database size={18} color="var(--cyan-400)" />,
    highlights: ['Supabase Storage cloud bucket', 'Expiring signed screenshot URLs', 'Historical version timeline']
  },
  {
    id: 8,
    stageNumber: '08',
    title: 'Alert Dispatcher & Feed Distribution',
    category: 'Notification & Delivery',
    desc: 'Dispatches real-time webhook payloads to Discord, Telegram, Slack, or custom REST webhooks keyed by monitored-contentHash to eliminate duplicate alerts. Publishes per-monitor XML RSS feeds and 24-hour daily digests.',
    inputs: 'Confirmed Change Event Payload',
    outputs: 'Multi-Channel Notifications + Feeds',
    icon: <Send size={18} color="var(--amber-400)" />,
    highlights: ['Keyed alert deduplication', 'Discord & Telegram webhooks', 'Per-monitor XML RSS feeds']
  }
];

export default function ArchitectureFlow() {
  const [selectedStage, setSelectedStage] = useState(1);
  const activeLayer = architectureLayers.find(l => l.id === selectedStage) || architectureLayers[0];

  return (
    <section id="architecture" style={{ padding: '120px 0', position: 'relative' }}>
      <div className="container">
        
        {/* Section Header */}
        <div className="section-header">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>SYSTEM TOPOLOGY & RUNTIME PIPELINE</span>
          </div>
          <h2 className="section-title">An 8-Stage Runtime Pipeline Built for Reliability.</h2>
          <p className="section-desc">
            From initial target ingestion to intelligent diffing and multi-channel alerts, WatchTower executes a rigorous 8-stage pipeline designed to prevent false alarms and capture real changes.
          </p>
        </div>

        {/* Interactive 8-Stage Architecture Explorer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          gap: '28px',
          maxWidth: '1140px',
          margin: '0 auto 48px',
          alignItems: 'start'
        }} className="architecture-grid-responsive">
          
          {/* Left Column: Stage Selector List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {architectureLayers.map((layer) => {
              const isSelected = selectedStage === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedStage(layer.id)}
                  className="glass-card"
                  style={{
                    padding: '16px 20px',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--cyan-400)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'rgba(19, 27, 46, 0.95)' : 'rgba(13, 18, 28, 0.75)',
                    boxShadow: isSelected ? '0 8px 24px rgba(0,0,0,0.6), 0 0 20px rgba(56, 189, 248, 0.15)' : 'none',
                    transform: isSelected ? 'translateX(6px)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {layer.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: isSelected ? 'var(--cyan-400)' : 'var(--text-dim)', fontWeight: 700 }}>
                          {layer.stageNumber}
                        </span>
                        <h3 style={{ 
                          fontSize: '14.5px', 
                          color: isSelected ? '#ffffff' : 'var(--text-main)', 
                          margin: 0, 
                          fontWeight: isSelected ? 700 : 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {layer.title}
                        </h3>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {layer.category}
                      </div>
                    </div>
                  </div>

                  <span className="code-badge" style={{
                    borderColor: isSelected ? 'var(--cyan-400)' : 'var(--border-subtle)',
                    color: isSelected ? 'var(--cyan-400)' : 'var(--text-dim)',
                    fontSize: '10.5px',
                    padding: '2px 8px',
                    flexShrink: 0
                  }}>
                    Stage {layer.stageNumber}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right Column: Deep Stage Inspection Card */}
          <div style={{ position: 'sticky', top: '96px' }}>
            <div 
              className="glass-card"
              style={{
                padding: '32px',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                background: 'rgba(10, 15, 26, 0.92)',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)',
                borderRadius: '16px'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--cyan-400)',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    marginBottom: '6px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cyan-400)', boxShadow: '0 0 8px var(--cyan-400)' }} />
                    STAGE {activeLayer.stageNumber} — {activeLayer.category.toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: 1.25 }}>
                    {activeLayer.title}
                  </h3>
                </div>
                <div style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  {activeLayer.icon}
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '24px' }}>
                {activeLayer.desc}
              </p>

              {/* Data Flow Contracts (Input / Output) */}
              <div style={{
                background: '#060910',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-dim)', width: '60px' }}>INPUT:</span>
                  <span style={{ color: '#ffffff', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px' }}>
                    {activeLayer.inputs}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--cyan-400)', width: '60px' }}>OUTPUT:</span>
                  <span style={{ color: 'var(--cyan-400)', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    {activeLayer.outputs}
                  </span>
                </div>
              </div>

              {/* Verified Capabilities */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                  Pipeline Capabilities:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeLayer.highlights.map((h, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e2e8f0' }}>
                      <CheckCircle2 size={15} color="var(--emerald-400)" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blueprint Reference Callout */}
              <div style={{
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11.5px',
                color: 'var(--text-dim)'
              }}>
                <span>Referenced in Runtime Blueprint</span>
                <a 
                  href="#blueprint-diagram" 
                  style={{ color: 'var(--cyan-400)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>View in Diagram</span>
                  <ArrowRight size={12} />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Full WatchTower Runtime Pipeline Architecture Blueprint Image */}
        <div 
          id="blueprint-diagram"
          style={{
            maxWidth: '1140px',
            margin: '0 auto',
            background: 'rgba(10, 15, 26, 0.85)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.15)',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cyan-400)', boxShadow: '0 0 10px var(--cyan-400)' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#ffffff', fontWeight: 700, letterSpacing: '0.04em' }}>
                WATCHTOWER RUNTIME PIPELINE: DETECT / ANALYZE / ALERT
              </span>
              <span className="code-badge" style={{ color: 'var(--emerald-400)', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
                8 VERIFIED STAGES
              </span>
            </div>
            
            <a 
              href="/architecture-pipeline.jpg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none'
              }}
            >
              <span>View Full Resolution</span>
              <ExternalLink size={13} />
            </a>
          </div>

          <div style={{ 
            borderRadius: '12px', 
            overflow: 'hidden', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            background: '#040711',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <img 
              src="/architecture-pipeline.jpg" 
              alt="WatchTower Runtime Pipeline: Detect / Analyze / Alert 8-Stage Architecture Blueprint Diagram" 
              style={{ 
                width: '100%', 
                height: 'auto', 
                display: 'block' 
              }}
              loading="lazy"
            />
          </div>

          <div style={{ 
            marginTop: '18px', 
            fontSize: '12.5px', 
            color: 'var(--text-muted)', 
            textAlign: 'center',
            lineHeight: 1.6,
            maxWidth: '920px',
            margin: '18px auto 0'
          }}>
            <strong style={{ color: '#ffffff' }}>End-to-End Pipeline Contract:</strong> Target URL Config (1) → Domain Queue & Coalescing (2) → Resilient Crawl Pipeline with Timeout Budgeting & Fallbacks (3) → Incident Classifier & Outage Guard (4) → 3-Layer Noise Scrubbing Engine (5) → Differential Analysis with Myers, Pixelmatch & Gemini AI (6) → Persistence & Snapshot Store with Supabase (7) → Multi-Channel Alert Dispatcher & RSS (8).
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .architecture-grid-responsive {
            grid-template-columns: 1fr !important;
          }
          .architecture-grid-responsive > div:last-child {
            position: static !important;
          }
        }
      `}</style>
    </section>
  );
}
