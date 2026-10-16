import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  ArrowRight, 
  Layers, 
  Globe, 
  ShieldCheck, 
  GitCommit, 
  RotateCw, 
  Sparkles,
  Terminal,
  ChevronRight,
  Sliders
} from 'lucide-react';

export default function Hero3D({ onStartMonitoring, onExploreExperience }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [flipped, setFlipped] = useState(false);
  const containerRef = useRef(null);

  // Typewriter effect phrases
  const phrases = [
    'web changes in real time.',
    'pricing updates silently.',
    'terms & policies shift.',
    'competitors make moves.',
    'critical DOM nodes break.'
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    let timeout;

    if (!isDeleting && typedText === currentPhrase) {
      timeout = setTimeout(() => setIsDeleting(true), 2400);
    } else if (isDeleting && typedText === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
      timeout = setTimeout(() => {}, 400);
    } else {
      const nextLength = isDeleting ? typedText.length - 1 : typedText.length + 1;
      const speed = isDeleting ? 38 : 75;
      timeout = setTimeout(() => {
        setTypedText(currentPhrase.substring(0, nextLength));
      }, speed);
    }

    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, phraseIndex]);

  // Subtle pointer-aware 3D world tilt
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16; // -8deg to +8deg
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <section 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        minHeight: '100vh',
        paddingTop: '110px',
        paddingBottom: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Cinematic Top Lockup */}
      <div className="container" style={{ textAlign: 'center', zIndex: 30, marginBottom: '24px' }}>
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11.5px',
          fontWeight: 600,
          color: 'var(--cyan-400)',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          padding: '6px 14px',
          borderRadius: '9999px',
          marginBottom: '20px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cyan-400)', boxShadow: '0 0 10px var(--cyan-400)' }} />
          <span>AUTONOMOUS DOM DIFF & MUTATION RADAR</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(42px, 6.5vw, 76px)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.1,
          color: '#ffffff',
          marginBottom: '20px',
          minHeight: '2.25em'
        }}>
          Know when the <br />
          <span style={{
            background: 'linear-gradient(135deg, #ffffff 15%, #fb923c 55%, #f43f5e 80%, #d946ef 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>
            {typedText}
          </span>
          <span className="typewriter-cursor">|</span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 19px)',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          margin: '0 auto 32px',
          lineHeight: 1.6
        }}>
          Track the pages that matter. Compare captured versions. Catch meaningful pricing, legal, and API changes without repeatedly checking pages manually.
        </p>

        {/* Action Controls: Direct Launch to Dashboard */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            onClick={onStartMonitoring}
            className="btn btn-primary"
            style={{
              padding: '14px 32px',
              fontSize: '15px',
              fontWeight: 700,
              boxShadow: '0 4px 20px rgba(14, 165, 233, 0.45)'
            }}
          >
            <span>Start Monitoring</span>
            <ArrowRight size={16} />
          </button>

          <button 
            onClick={onExploreExperience}
            className="btn btn-secondary"
            style={{
              padding: '14px 28px',
              fontSize: '15px'
            }}
          >
            <Layers size={16} color="var(--cyan-400)" />
            <span>Explore the Experience</span>
          </button>
        </div>

        <div style={{ marginTop: '14px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
          Direct launch into production dashboard • Zero sign-up friction • Free instant monitoring
        </div>
      </div>

      {/* REVOLVING 3D BROWSER HERO COMPOSITION */}
      <div className="scene-3d-viewport">
        <div 
          className="world-3d"
          style={{
            transform: `rotateX(${10 + mousePos.y}deg) rotateY(${mousePos.x}deg)`
          }}
        >
          {/* Orbital Horizontal Guide Tracks */}
          <div className="orbit-track" />
          <div className="orbit-track" style={{ width: '480px', height: '480px', borderColor: 'rgba(56, 189, 248, 0.08)' }} />

          {/* Central WatchTower Anchor Beacon */}
          <div className="watchtower-core-beacon">
            <div className="core-ring outer" />
            <div className="core-ring middle" />
            <div className="core-pulse">
              <Activity size={28} color="#ffffff" />
            </div>
          </div>

          {/* Orbiting Satellites Carousel */}
          <div className="orbit-carousel">
            
            {/* SATELLITE 1: Dramatic 180° Flipping Browser (0 deg position) */}
            <div 
              className={`orbital-browser-panel flip-browser-card ${flipped ? 'flipped' : ''}`}
              onClick={() => setFlipped(!flipped)}
              title="Click to perform 180° 3D card flip"
              style={{
                transform: 'rotateY(0deg) translateZ(350px)'
              }}
            >
              <div className="flip-browser-inner">
                {/* Front: Webpage Viewport */}
                <div className="flip-browser-front">
                  <div style={{ height: '34px', background: '#111827', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }} />
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b' }} />
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
                    </div>
                    <div style={{ flex: 1, background: '#090e17', borderRadius: '3px', padding: '2px 8px', fontSize: '10.5px', color: 'var(--cyan-400)', fontFamily: 'var(--font-mono)' }}>
                      api.github.com/changelog
                    </div>
                    <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>FLIP 180°</span>
                  </div>

                  <div style={{ padding: '14px', position: 'relative', flex: 1, background: '#090d16' }}>
                    {/* Laser Sweep Scanner Line */}
                    <div className="laser-scan-line" />

                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                      REST API v3 Rate Limits
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      Captured 2 mins ago • Crawl Interval: 5m
                    </div>

                    <div className="diff-pulse-added" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                      + auth_rate_limit: 5,000 req/hr
                    </div>
                    <div className="diff-pulse-removed" style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                      - public_rate_limit: 60 req/hr
                    </div>
                  </div>
                </div>

                {/* Back: Myers Diff Engine Matrix */}
                <div className="flip-browser-back">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--emerald-400)', fontWeight: 600 }}>
                      MYERS DIFF MATRIX (180° REVERSE)
                    </span>
                    <span className="code-badge" style={{ fontSize: '9px' }}>SHA-256 MATCH</span>
                  </div>
                  <pre style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: '#94a3b8', lineHeight: '1.45', margin: 0 }}>
{`EditScript: [
  { op: "KEEP", text: "API Base" },
  { op: "DELETE", text: "60 req" },
  { op: "INSERT", text: "5000 req" }
]`}
                  </pre>
                  <div style={{ marginTop: 'auto', fontSize: '10px', color: 'var(--text-dim)' }}>
                    Click again to flip back to viewport
                  </div>
                </div>
              </div>
            </div>

            {/* SATELLITE 2: Separating Visual Snapshot (90 deg position) */}
            <div 
              className="orbital-browser-panel"
              style={{
                transform: 'rotateY(90deg) translateZ(350px)'
              }}
            >
              <div style={{ height: '34px', background: '#111827', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '8px' }}>
                <Globe size={12} color="var(--cyan-400)" />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                  store.techgear.com/headphones
                </span>
              </div>
              <div style={{ padding: '14px', background: '#090d16', height: 'calc(100% - 34px)', position: 'relative' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                  ANC Wireless Studio Max
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0' }}>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--emerald-400)' }}>$179.00</span>
                  <span style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--rose-400)' }}>$229.00</span>
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--emerald-400)', background: 'rgba(52, 211, 153, 0.1)', padding: '3px 8px', borderRadius: '4px', display: 'inline-block' }}>
                  Stock Trigger: Price Drop -$50.00 Detected
                </div>
              </div>
            </div>

            {/* SATELLITE 3: Noise Scrubber Layer (180 deg position) */}
            <div 
              className="orbital-browser-panel"
              style={{
                transform: 'rotateY(180deg) translateZ(350px)'
              }}
            >
              <div style={{ height: '34px', background: '#111827', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '8px' }}>
                <ShieldCheck size={12} color="var(--emerald-400)" />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                  4-Layer Noise Scrubber
                </span>
              </div>
              <div style={{ padding: '14px', background: '#090d16', height: 'calc(100% - 34px)' }}>
                <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)', marginBottom: '6px' }}>
                  // Noise Scrubber Active
                </div>
                <div style={{ fontSize: '11px', color: 'var(--amber-400)', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 6px', borderRadius: '4px', marginBottom: '4px' }}>
                  [Filtered #live-clock timestamp]
                </div>
                <div style={{ fontSize: '11px', color: 'var(--amber-400)', background: 'rgba(245, 158, 11, 0.1)', padding: '4px 6px', borderRadius: '4px' }}>
                  [Stripped session token & ad-slot]
                </div>
                <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--emerald-400)' }}>
                  ✓ 0 False Alert Floods
                </div>
              </div>
            </div>

            {/* SATELLITE 4: Webhook Event Dispatcher (270 deg position) */}
            <div 
              className="orbital-browser-panel"
              style={{
                transform: 'rotateY(270deg) translateZ(350px)'
              }}
            >
              <div style={{ height: '34px', background: '#111827', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '8px' }}>
                <GitCommit size={12} color="var(--violet-400)" />
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                  Webhook Dispatcher
                </span>
              </div>
              <div style={{ padding: '14px', background: '#090d16', height: 'calc(100% - 34px)', fontFamily: 'var(--font-mono)' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--cyan-400)', marginBottom: '4px' }}>
                  POST /webhooks/slack HTTP/1.1
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.4 }}>
                  payload: &#123; <br />
                  &nbsp;&nbsp;event: "page.diff",<br />
                  &nbsp;&nbsp;diff: "+2 / -1",<br />
                  &nbsp;&nbsp;sha256: "8f3c7a..."<br />
                  &#125;
                </div>
                <span className="code-badge" style={{ marginTop: '8px', fontSize: '9px', display: 'inline-block' }}>
                  HTTP 200 DELIVERED
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
