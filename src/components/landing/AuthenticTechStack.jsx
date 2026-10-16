import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const technologies = [
  {
    name: 'Puppeteer',
    category: 'Headless Browser Automation',
    role: 'Chromium rendering, full DOM execution, viewport screenshot capture',
    color: '#00D8A2',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#00D8A2" strokeWidth="1.8">
        <path d="M12 2a4 4 0 0 1 4 4v1h3a2 2 0 0 1 2 2v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9a2 2 0 0 1 2-2h3V6a4 4 0 0 1 4-4z" fill="rgba(0, 216, 162, 0.1)"/>
        <circle cx="9" cy="13" r="1.5" fill="#00D8A2"/>
        <circle cx="15" cy="13" r="1.5" fill="#00D8A2"/>
        <path d="M9 17h6"/>
      </svg>
    )
  },
  {
    name: 'Node.js',
    category: 'Asynchronous Runtime',
    role: 'Event-driven I/O engine powering crawl queues and rate limiters',
    color: '#5FA04E',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
        <path d="M12 2.5L20.5 7.4V17.3L12 22.2L3.5 17.3V7.4L12 2.5Z" stroke="#5FA04E" strokeWidth="1.8" fill="rgba(95, 160, 78, 0.12)"/>
        <path d="M12 6.5V17.5M7.5 9.2L16.5 14.5M16.5 9.2L7.5 14.5" stroke="#5FA04E" strokeWidth="1.5"/>
      </svg>
    )
  },
  {
    name: 'Express',
    category: 'Backend REST API',
    role: 'Routing engine managing monitor CRUD, manual checks, and test studio',
    color: '#ffffff',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#ffffff" strokeWidth="2">
        <path d="M4 18h16M4 6h16M7 12h10"/>
      </svg>
    )
  },
  {
    name: 'Cheerio',
    category: 'DOM Parsing & Extraction',
    role: 'Fast server-side jQuery syntax for scoping CSS selectors and noise stripping',
    color: '#E88C1F',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#E88C1F" strokeWidth="1.8" fill="rgba(232, 140, 31, 0.12)"/>
        <path d="M8 12l3 3 5-6" stroke="#E88C1F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    name: 'jsdiff',
    category: 'Myers Diff Engine',
    role: 'Line-by-line and character-level difference algorithm calculation',
    color: '#38bdf8',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#38bdf8" strokeWidth="2">
        <path d="M6 4v16M18 4v16M3 9h6M15 15h6"/>
      </svg>
    )
  },
  {
    name: 'pixelmatch & pngjs',
    category: 'Visual Pixel Comparison',
    role: 'Perceptual image difference rendering with bounding highlight masks',
    color: '#F43F5E',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
        <rect x="3" y="3" width="8" height="8" rx="2" stroke="#F43F5E" strokeWidth="1.8" fill="rgba(244, 63, 94, 0.2)"/>
        <rect x="13" y="3" width="8" height="8" rx="2" stroke="#F43F5E" strokeWidth="1.8"/>
        <rect x="3" y="13" width="8" height="8" rx="2" stroke="#F43F5E" strokeWidth="1.8"/>
        <rect x="13" y="13" width="8" height="8" rx="2" stroke="#F43F5E" strokeWidth="1.8" fill="rgba(244, 63, 94, 0.4)"/>
      </svg>
    )
  },
  {
    name: 'React 19 & Vite',
    category: 'Interactive Interface',
    role: 'High-performance component architecture, diff viewers, and timeline modal dialogs',
    color: '#61DAFB',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
        <circle cx="12" cy="12" r="2.5" fill="#61DAFB"/>
        <ellipse cx="12" cy="12" rx="9" ry="3.8" stroke="#61DAFB" strokeWidth="1.4"/>
        <ellipse cx="12" cy="12" rx="9" ry="3.8" stroke="#61DAFB" strokeWidth="1.4" transform="rotate(60 12 12)"/>
        <ellipse cx="12" cy="12" rx="9" ry="3.8" stroke="#61DAFB" strokeWidth="1.4" transform="rotate(120 12 12)"/>
      </svg>
    )
  },
  {
    name: 'Git & GitHub',
    category: 'Version Control & Automation',
    role: 'Source management, distributed branches, and automated Vercel/Render pipelines',
    color: '#F05032',
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#F05032" strokeWidth="1.8">
        <circle cx="6" cy="6" r="3"/>
        <circle cx="18" cy="12" r="3"/>
        <circle cx="6" cy="18" r="3"/>
        <path d="M6 9v6M9 6h4a5 5 0 0 1 5 5v0"/>
      </svg>
    )
  }
];

export default function AuthenticTechStack() {
  return (
    <section id="tech-stack" style={{ padding: '120px 0', position: 'relative' }}>
      <div className="container">
        
        <div className="section-header">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            <span>UNDER THE HOOD</span>
          </div>
          <h2 className="section-title">Every layer has a purpose.</h2>
          <p className="section-desc">
            Browser automation, content processing, comparison, and application infrastructure work together to turn a changing page into a verified signal.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '24px'
        }}>
          {technologies.map((t) => (
            <div 
              key={t.name}
              className="glass-card"
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {t.icon}
                  </div>
                  <span className="code-badge" style={{ color: t.color, borderColor: `${t.color}40` }}>
                    {t.category}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', color: '#ffffff', marginBottom: '6px' }}>
                  {t.name}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  {t.role}
                </p>
              </div>

              <div style={{
                marginTop: '18px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-dim)'
              }}>
                <CheckCircle2 size={13} color="var(--cyan-400)" />
                <span>Verified in active WatchTower codebase</span>
              </div>
            </div>
          ))}
        </div>

        {/* Persistence Architecture Note */}
        <div 
          className="glass-card"
          style={{
            marginTop: '32px',
            padding: '20px 28px',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
              Data Layer Architecture & Persistence Boundary
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
              Implemented with transactional storage routines in <code>server/db.js</code> with support for decoupled distributed cloud backends.
            </p>
          </div>
          <span className="code-badge" style={{ color: 'var(--cyan-400)' }}>
            server/db.js verified
          </span>
        </div>

      </div>
    </section>
  );
}
