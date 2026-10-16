import React, { useState } from 'react';
import { Globe, ArrowRight, Server, Sliders, Database, ArrowDown, ExternalLink, Sparkles } from 'lucide-react';

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

        {/* Full WatchTower Runtime Pipeline Architecture Blueprint Image */}
        <div style={{
          maxWidth: '1060px',
          margin: '48px auto 0',
          background: 'rgba(10, 15, 26, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.1)',
          overflow: 'hidden'
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

      </div>
    </section>
  );
}
