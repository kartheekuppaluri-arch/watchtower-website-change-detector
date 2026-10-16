import React, { useState } from 'react';
import { Globe, ArrowRight, Server, Sliders, Database, ArrowDown } from 'lucide-react';

const architectureLayers = [
  {
    id: 0,
    title: '1. React Frontend SPA',
    desc: 'Interactive monitor cards, side-by-side Myers diff viewers, visual point-and-click region picker, and snapshot timeline charts.',
    icon: <Globe size={18} color="var(--cyan-400)" />,
    tag: 'Client Layer'
  },
  {
    id: 1,
    title: '2. CORS-Secured HTTP API',
    desc: 'JSON REST communications transmitting check requests, monitor updates, and diff queries between frontend and backend.',
    icon: <ArrowRight size={18} color="var(--cyan-400)" />,
    tag: 'Transport Layer'
  },
  {
    id: 2,
    title: '3. Node.js & Express API Gateway',
    desc: 'Server orchestrator enforcing domain concurrency rate limits, token-bucket queues, and shared request coalescing.',
    icon: <Server size={18} color="var(--cyan-400)" />,
    tag: 'Runtime Gateway'
  },
  {
    id: 3,
    title: '4. 4-Stage Monitoring Pipeline',
    desc: 'Headless Chromium rendering -> Cheerio DOM extraction -> 4-layer noise scrubbing (CSS ignore selectors & regex stripping) -> Myers line diffing & pixelmatch comparison.',
    icon: <Sliders size={18} color="var(--cyan-400)" />,
    tag: 'Core Engine'
  },
  {
    id: 4,
    title: '5. Persistence & Dispatch',
    desc: 'Immutable snapshot commits, outage/CAPTCHA incident suppression, SHA-256 fingerprint hashing, webhook dispatching, and daily digest generation.',
    icon: <Database size={18} color="var(--cyan-400)" />,
    tag: 'Data & Alerts'
  }
];

export default function ArchitectureFlow() {
  const [selectedLayer, setSelectedLayer] = useState(0);

  return (
    <section id="architecture" style={{ padding: '120px 0', position: 'relative' }}>
      <div className="container">
        
        <div className="section-header">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>SYSTEM TOPOLOGY</span>
          </div>
          <h2 className="section-title">A pipeline built to follow the change.</h2>
          <p className="section-desc">
            From a configured target to a recorded difference, WatchTower organizes the work into distinct, verified stages.
          </p>
        </div>

        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {architectureLayers.map((layer) => {
            const isSelected = selectedLayer === layer.id;
            return (
              <div
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id)}
                className="glass-card"
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--cyan-400)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(19, 27, 46, 0.95)' : 'rgba(13, 18, 28, 0.8)',
                  boxShadow: isSelected ? '0 10px 30px rgba(0,0,0,0.6), 0 0 25px rgba(56, 189, 248, 0.2)' : 'none',
                  transform: isSelected ? 'translateX(8px)' : 'none',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {layer.icon}
                    </div>
                    <h3 style={{ fontSize: '17px', color: isSelected ? '#ffffff' : 'var(--text-main)', margin: 0 }}>
                      {layer.title}
                    </h3>
                  </div>

                  <span className="code-badge" style={{
                    borderColor: isSelected ? 'var(--cyan-400)' : 'var(--border-subtle)',
                    color: isSelected ? 'var(--cyan-400)' : 'var(--text-muted)'
                  }}>
                    {layer.tag}
                  </span>
                </div>

                <p style={{ fontSize: '13.5px', color: isSelected ? '#e2e8f0' : 'var(--text-muted)', margin: 0, paddingLeft: '48px', lineHeight: 1.6 }}>
                  {layer.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Real ASCII Dataflow Blueprint */}
        <div style={{
          maxWidth: '860px',
          margin: '40px auto 0',
          background: '#070a12',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '24px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          lineHeight: '1.6',
          color: '#cbd5e1',
          overflowX: 'auto'
        }}>
          <div style={{ color: 'var(--cyan-400)', fontWeight: 600, marginBottom: '10px' }}>
            // VERIFIED RUNTIME DATAFLOW BLUEPRINT
          </div>
{`[Target Webpage] ---> (Headless Chromium Crawl Engine)
                           |
                           v
               [CSS Scoped Selector Isolation]
                           |
                           v
          [4-Layer Noise Scrubber (Regex & Selectors)]
                           |
                           v
          [Myers Text Diffing & Pixelmatch Visual]
                           |
              +------------+------------+
              |                         |
              v                         v
    (Snapshot Repository)      (Webhook Event & Digest)
    [SHA-256 Content Hash]     [Slack / Discord / JSON]`}
        </div>

      </div>
    </section>
  );
}
