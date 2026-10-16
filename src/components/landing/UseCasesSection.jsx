import React from 'react';
import { Code2, Briefcase, Zap, CheckCircle2 } from 'lucide-react';

const useCases = [
  {
    tag: 'DEVELOPERS',
    title: 'Keep track of the pages you depend on.',
    desc: 'Follow relevant documentation, third-party API references, dependency releases, and web resources whose contents evolve without public feeds.',
    badge: 'Zero Silent Breaking Changes',
    items: [
      'Detect API deprecation notices and schema revisions instantly',
      'Track cloud provider SLA changes and status policy updates',
      'Isolate breaking syntax alterations in public library documentation'
    ],
    codePreview: `// Target: https://docs.example.com/api/v2\nWatchTarget: "div.breaking-changes-log"\nNotification: Dispatched on SHA-256 mutation`
  },
  {
    tag: 'OPERATIONS',
    title: 'Spend less time checking.',
    desc: 'Use automated monitoring and recorded history to review critical differences across vendor pricing, compliance mandates, and service health grids.',
    badge: 'Eliminate Repetitive Manual Auditing',
    items: [
      'Capture vendor price drops and seat-tier alterations immediately',
      'Monitor Terms of Service and Privacy Policy updates for legal teams',
      'Track SaaS status pages and incident response feeds'
    ],
    codePreview: `// Target: https://vendor.com/pricing\nWatchTarget: "span.price-tier-val"\nNoiseFilter: Ignore live-clock and currency toggles`
  },
  {
    tag: 'AUTOMATED WORKFLOWS',
    title: 'Connect the result to your tools.',
    desc: 'Use supported API and webhook mechanisms to move monitoring events into downstream Slack channels, incident queues, or event-driven serverless pipelines.',
    badge: 'Real-Time Event Payloads',
    items: [
      'Deliver rich JSON webhook payloads with line diff statistics',
      'Trigger automated staging regression suites upon competitor changes',
      'Aggregate 24-hour daily digest summaries for engineering syncs'
    ],
    codePreview: `// Webhook Dispatch Payload\n{\n  "event": "target.content_mutated",\n  "monitor": "E-Commerce Stock Status",\n  "diff": { "added": 2, "removed": 1 }\n}`
  }
];

export default function UseCasesSection({ onStartMonitoring }) {
  return (
    <section id="use-cases" style={{ padding: '120px 0', position: 'relative' }}>
      <div className="container">
        
        <div className="section-header">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>REAL-WORLD DEPLOYMENT</span>
          </div>
          <h2 className="section-title">From a change to the next action.</h2>
          <p className="section-desc">
            Monitoring becomes useful when the right person can investigate a change without manually checking every page.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {useCases.map((uc, idx) => (
            <div 
              key={uc.tag}
              className="glass-card usecase-responsive-grid"
              style={{
                padding: '36px',
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr',
                gap: '40px',
                alignItems: 'center',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)', letterSpacing: '0.08em' }}>
                  USE CASE 0{idx + 1} — {uc.tag}
                </span>
                <h3 style={{ fontSize: '22px', color: '#ffffff', margin: '8px 0 12px' }}>{uc.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.65', marginBottom: '20px' }}>
                  {uc.desc}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {uc.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-main)' }}>
                      <CheckCircle2 size={15} color="var(--cyan-400)" style={{ flexShrink: 0 }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: '#070a12',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '20px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                lineHeight: '1.6',
                color: '#cbd5e1'
              }}>
                <div style={{ color: 'var(--text-dim)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>// TARGET EXECUTION</span>
                  <span className="code-badge" style={{ fontSize: '10px' }}>{uc.badge}</span>
                </div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  <code>{uc.codePreview}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .usecase-responsive-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </section>
  );
}
