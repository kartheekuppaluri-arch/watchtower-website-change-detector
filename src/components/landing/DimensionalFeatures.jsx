import React, { useState } from 'react';
import { Globe, GitCommit, Sliders, Send, ArrowRight } from 'lucide-react';

const pillars = [
  {
    icon: Globe,
    id: '01',
    category: 'INGEST & CRAWL',
    title: 'Bring any page into the pipeline.',
    desc: 'Create monitored targets with configurable polling cadences (1m–24h). Headless Chromium rendering evaluates JavaScript before content extraction — matching what a real user actually sees.',
    snippet: `POST /api/monitors\n{ "url": "https://vendor.io/pricing",\n  "intervalMinutes": 15 }`,
    accent: '#38bdf8'
  },
  {
    icon: GitCommit,
    id: '02',
    category: 'DIFF & FINGERPRINT',
    title: 'Find the actual difference.',
    desc: '4-layer noise scrubbing strips live clocks, session tokens, and ad banners before hashing. Myers diffing then computes precise line additions, removals, and value mutations.',
    snippet: `const diff = jsdiff.diffLines(prev, curr);\n// +2 added  /  -1 removed\n// SHA-256: 8f3c7a1b... ← mutation detected`,
    accent: '#34d399'
  },
  {
    icon: Sliders,
    id: '03',
    category: 'VISUAL SELECTOR & HISTORY',
    title: 'Scope precisely. Review completely.',
    desc: 'Point-and-click region picker isolates the DOM elements worth watching. Every capture is stored as a timestamped snapshot with a SHA-256 fingerprint for full replay and side-by-side diff review.',
    snippet: `watchSelector: "div.pricing-tier"\nignoreSelector: "aside.ticker"\nGET /api/monitors/:id/snapshots`,
    accent: '#a78bfa'
  },
  {
    icon: Send,
    id: '04',
    category: 'ALERTS & DISPATCH',
    title: 'Deliver the signal to your tools.',
    desc: 'Deduplicated webhook payloads fire immediately on confirmed changes. Daily digest summaries keep teams informed without alert fatigue. Explore all scenarios through the built-in Testing Studio.',
    snippet: `{\n  "event": "target.mutation_detected",\n  "delta": "+$300/mo price increase",\n  "status": "DELIVERED"\n}`,
    accent: '#fb923c'
  }
];

const stats = [
  { value: '4-layer', label: 'Noise Scrubbing' },
  { value: 'Myers', label: 'Diff Algorithm' },
  { value: 'SHA-256', label: 'Mutation Fingerprinting' },
  { value: '1m–24h', label: 'Polling Cadence' },
];

export default function DimensionalFeatures({ onStartMonitoring }) {
  const [hovered, setHovered] = useState(null);

  return (
    <section id="features" style={{ padding: '120px 0', position: 'relative' }}>
      <div className="container">

        <div className="section-header">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>CORE CAPABILITIES</span>
          </div>
          <h2 className="section-title">Everything between checks.</h2>
          <p className="section-desc">
            A monitoring system needs more than a fetch. It extracts content, recognises differences, filters noise, and makes results useful.
          </p>
        </div>

        {/* Stats Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1px',
          background: 'var(--border-subtle)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '56px',
          border: '1px solid var(--border-subtle)'
        }}>
          {stats.map((s) => (
            <div key={s.label} style={{
              background: '#0b0f1a',
              padding: '24px 20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* 2×2 Pillar Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px'
        }} className="features-grid-responsive">
          {pillars.map((p) => {
            const Icon = p.icon;
            const isHovered = hovered === p.id;
            return (
              <div
                key={p.id}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
                className="glass-card"
                style={{
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0',
                  border: `1px solid ${isHovered ? p.accent + '66' : 'var(--border-subtle)'}`,
                  boxShadow: isHovered ? `0 0 30px ${p.accent}18` : 'none',
                  transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                  cursor: 'default'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: `${p.accent}15`,
                    border: `1px solid ${p.accent}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background 0.25s ease'
                  }}>
                    <Icon size={20} color={p.accent} />
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: p.accent,
                      letterSpacing: '0.1em',
                      marginBottom: '4px'
                    }}>
                      {p.id} — {p.category}
                    </div>
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      color: '#ffffff',
                      lineHeight: 1.25,
                      margin: 0
                    }}>
                      {p.title}
                    </h3>
                  </div>
                </div>

                <p style={{
                  fontSize: '13.5px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.65,
                  marginBottom: '20px',
                  flex: 1
                }}>
                  {p.desc}
                </p>

                {/* Code Block */}
                <div style={{
                  background: '#060910',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: '#94a3b8',
                  lineHeight: 1.6,
                  overflowX: 'auto'
                }}>
                  <pre style={{ margin: 0 }}><code>{p.snippet}</code></pre>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', marginTop: '56px' }}>
          <button
            onClick={onStartMonitoring}
            className="btn btn-primary"
            style={{ padding: '13px 32px', fontSize: '14px', fontWeight: 700 }}
          >
            <span>Open the Dashboard</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .features-grid-responsive {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .features-grid-responsive > div {
            grid-column: span 1 !important;
          }
          div[style*="repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
