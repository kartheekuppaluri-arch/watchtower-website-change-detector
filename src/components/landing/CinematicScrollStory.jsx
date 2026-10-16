import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Globe, 
  Layers, 
  GitCommit, 
  Eye, 
  Send, 
  Check, 
  Sliders, 
  Activity, 
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function CinematicScrollStory({ onStartMonitoring }) {
  const containerRef = useRef(null);
  const pinnedRef = useRef(null);
  const [currentStage, setCurrentStage] = useState(1);
  const [sliderPos, setSliderPos] = useState(50);
  const isDraggingRef = useRef(false);

  const stages = [
    {
      id: 1,
      badge: 'STAGE 01 — TARGET INGESTION',
      headline: 'A target enters the pipeline.',
      desc: 'WatchTower accepts any web address. The system assembles a headless Chromium crawler session, configures polling cadences (1m to 24h), and verifies connectivity with automatic retry and rate-limiting.'
    },
    {
      id: 2,
      badge: 'STAGE 02 — PERSPECTIVE INSPECTION',
      headline: 'Inspect beyond the surface.',
      desc: 'The browser rotates into deep 3D perspective while high-frequency scanning lines sweep across the DOM tree. Scoped CSS watch targets and ignore regions are parsed and isolated via Cheerio.'
    },
    {
      id: 3,
      badge: 'STAGE 03 — DUAL SNAPSHOT SEPARATION',
      headline: 'Separate and detect changes.',
      desc: 'A second historical snapshot revolves out from behind the active render. Cryptographic SHA-256 fingerprints are compared, and Myers diffing isolates exact line additions, removals, and number mutations.'
    },
    {
      id: 4,
      badge: 'STAGE 04 — SIDE-BY-SIDE VISUAL PROOF',
      headline: 'Align and compare visual deltas.',
      desc: 'Both snapshots rotate face-forward and align into an interactive comparison curtain. Drag the slider to reveal pixel-level diff bounding masks and numerical value modifications.'
    },
    {
      id: 5,
      badge: 'STAGE 05 — SPRING DISPATCH & WEBHOOKS',
      headline: 'Deliver the signal to your tools.',
      desc: 'Deduplicated change payloads travel into your downstream tools. Immediate webhook dispatches to Slack, Discord, or REST webhooks confirm delivery with HTTP 200 responses.'
    }
  ];

  // GSAP ScrollTrigger Setup
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: '+=3800',
        pin: pinnedRef.current,
        scrub: 1.8,
        onUpdate: (self) => {
          const raw = self.progress * 5;
          const stageIndex = Math.min(Math.max(Math.round(raw + 0.1), 1), 5);
          setCurrentStage(stageIndex);
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Slider controls
  const handleSliderMove = (clientX, rect) => {
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    handleSliderMove(e.clientX, rect);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleSliderMove(e.clientX, rect);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Shared fade style
  const fadeStyle = (active) => ({
    position: 'absolute',
    inset: 0,
    opacity: active ? 1 : 0,
    transform: active ? 'scale(1) translateY(0px)' : 'scale(0.97) translateY(8px)',
    transition: 'opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1)',
    pointerEvents: active ? 'auto' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  return (
    <section 
      id="story" 
      ref={containerRef} 
      style={{ position: 'relative', width: '100%', minHeight: '4200px', background: '#07090e' }}
    >
      <div 
        ref={pinnedRef} 
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        
        {/* Pinned Stage Stepper Pill */}
        <div style={{
          position: 'absolute',
          top: '84px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(13, 18, 28, 0.9)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          padding: '6px 14px',
          borderRadius: '9999px',
          border: '1px solid var(--border-subtle)',
          zIndex: 40
        }}>
          {stages.map((s) => (
            <button
              key={s.id}
              onClick={() => setCurrentStage(s.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: currentStage === s.id ? 'var(--cyan-400)' : 'var(--text-dim)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: currentStage === s.id ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 6px',
                transition: 'all 0.2s ease'
              }}
              aria-label={`Jump to stage 0${s.id}`}
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: currentStage === s.id ? 'var(--cyan-400)' : '#334155',
                boxShadow: currentStage === s.id ? '0 0 8px var(--cyan-400)' : 'none',
                transition: 'all 0.2s ease'
              }} />
              <span>0{s.id}</span>
            </button>
          ))}
        </div>

        {/* Global Progress Bar at bottom */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '2px',
          width: `${(currentStage / 5) * 100}%`,
          background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
          boxShadow: '0 0 8px var(--cyan-400)',
          transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 50
        }} />

        {/* Main Stage Presentation Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          gap: '56px',
          width: '100%',
          maxWidth: '1240px',
          padding: '0 32px',
          zIndex: 20
        }} className="story-grid">
          
          {/* Left Narrative — cross-fades between stages */}
          <div style={{ position: 'relative', minHeight: '280px' }}>
            {stages.map((s) => (
              <div
                key={s.id}
                style={{
                  position: s.id === 1 ? 'relative' : 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  opacity: currentStage === s.id ? 1 : 0,
                  transform: currentStage === s.id ? 'translateY(0px)' : 'translateY(14px)',
                  transition: 'opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1)',
                  pointerEvents: currentStage === s.id ? 'auto' : 'none',
                }}
              >
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--cyan-400)',
                  letterSpacing: '0.1em',
                  marginBottom: '12px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--cyan-400)', boxShadow: '0 0 8px var(--cyan-400)' }} />
                  {s.badge}
                </div>

                <h2 style={{
                  fontSize: 'clamp(28px, 3.8vw, 46px)',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  marginBottom: '18px'
                }}>
                  {s.headline}
                </h2>

                <p style={{
                  fontSize: '15px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.65,
                  marginBottom: '28px'
                }}>
                  {s.desc}
                </p>
              </div>
            ))}

            {/* Nav controls sit below the cross-faded content */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'absolute', bottom: '-60px', left: 0 }}>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentStage(prev => Math.max(1, prev - 1))}
                disabled={currentStage === 1}
                style={{ opacity: currentStage === 1 ? 0.35 : 1 }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentStage(prev => Math.min(5, prev + 1))}
                disabled={currentStage === 5}
                style={{ opacity: currentStage === 5 ? 0.35 : 1 }}
              >
                Next <ChevronRight size={14} />
              </button>

              <button 
                onClick={onStartMonitoring}
                className="btn btn-primary btn-sm"
                style={{ marginLeft: '12px' }}
              >
                <span>Launch in Dashboard</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Right 3D Visual Stage — all stages always mounted, CSS cross-fade */}
          <div style={{ position: 'relative', width: '100%', height: '360px' }}>

            {/* STAGE 1: Browser enters and assembles */}
            <div style={fadeStyle(currentStage === 1)}>
              <div 
                className="glass-card"
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  borderRadius: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  transform: 'rotateY(-8deg) rotateX(4deg) translateZ(20px)',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)'
                }}
              >
                <div style={{ height: '36px', background: '#111827', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  </div>
                  <div style={{ flex: 1, background: '#090e17', borderRadius: '4px', padding: '3px 10px', fontSize: '11px', color: 'var(--cyan-400)', fontFamily: 'var(--font-mono)' }}>
                    https://vendor-cloud.io/api/pricing-matrix
                  </div>
                </div>
                <div style={{ padding: '24px', background: '#090d16' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Crawl Job #1084 Registered</span>
                    <span className="code-badge">Interval: 15m</span>
                  </div>
                  <div style={{ background: '#131b2e', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ padding: '8px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: 'var(--cyan-400)' }}>
                      <Activity size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Vendor Cloud Services Pricing</div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                        Status: Active • Rate-Limit Token Granted
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 2: Scanning lasers */}
            <div style={fadeStyle(currentStage === 2)}>
              <div 
                className="glass-card"
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  borderRadius: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  transform: 'scale(1.04) rotateX(4deg)',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.25)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div className="laser-scan-line" />
                <div style={{ height: '36px', background: '#111827', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px' }}>
                  <Layers size={13} color="var(--cyan-400)" />
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                    DOM Scoped Inspection Active
                  </span>
                </div>
                <div style={{ padding: '24px', background: '#090d16' }}>
                  <div style={{ border: '2px dashed var(--cyan-400)', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)', fontWeight: 700, marginBottom: '4px' }}>
                      WATCH TARGET: section.pricing-tier-enterprise
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>Enterprise Dedicated Cluster</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>$899 / month • 100,000 monthly API calls</div>
                  </div>
                  <div style={{ border: '2px dashed var(--amber-400)', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--amber-400)', fontWeight: 700, marginBottom: '2px' }}>
                      IGNORE REGION: aside.live-visitor-ticker
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      [Filtered: 1,482 live concurrent viewers • Clock ticks stripped]
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 3: Two snapshots separate in space */}
            <div style={fadeStyle(currentStage === 3)}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '520px', height: '300px', transformStyle: 'preserve-3d' }}>
                {/* Previous Snapshot */}
                <div 
                  className="glass-card"
                  style={{
                    position: 'absolute',
                    top: '-15px',
                    left: '-15px',
                    right: '15px',
                    height: '240px',
                    background: '#0a0f1a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transform: 'translateZ(-50px) rotateY(-6deg)',
                    padding: '16px',
                    opacity: 0.65
                  }}
                >
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                    HISTORICAL CAPTURE #1083 (SHA-256: 7f21a...)
                  </div>
                  <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--rose-400)' }}>
                    - Rate Limit: 1,000 requests/minute
                  </div>
                </div>
                {/* Active Snapshot */}
                <div 
                  className="glass-card"
                  style={{
                    position: 'absolute',
                    top: '20px',
                    left: '10px',
                    right: '-10px',
                    height: '260px',
                    background: '#090d16',
                    border: '1px solid var(--cyan-400)',
                    transform: 'translateZ(30px) rotateY(4deg)',
                    padding: '20px',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.2)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)', fontWeight: 600 }}>
                      ACTIVE CAPTURE #1084 (SHA-256: 8f3c7...)
                    </span>
                    <span className="code-badge" style={{ color: 'var(--emerald-400)', borderColor: 'rgba(52, 211, 153, 0.4)' }}>
                      +2 LINES / -1 LINE
                    </span>
                  </div>
                  <div style={{ background: '#05070a', borderRadius: '6px', padding: '12px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', lineHeight: 1.6 }}>
                    <div style={{ color: 'var(--rose-400)', background: 'rgba(248, 113, 113, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                      - Rate Limit: 1,000 requests/minute
                    </div>
                    <div style={{ color: 'var(--emerald-400)', background: 'rgba(52, 211, 153, 0.12)', padding: '2px 6px', borderRadius: '4px', marginTop: '3px' }}>
                      + Rate Limit: 250 requests/minute (Enforced Capping)
                    </div>
                    <div style={{ color: 'var(--emerald-400)', background: 'rgba(52, 211, 153, 0.12)', padding: '2px 6px', borderRadius: '4px', marginTop: '3px' }}>
                      + Overage: $0.05 per extra request
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 4: Interactive Before/After Curtain Slider */}
            <div style={fadeStyle(currentStage === 4)}>
              <div 
                className="comparison-curtain"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                tabIndex={0}
                role="slider"
                aria-valuenow={Math.round(sliderPos)}
                aria-label="Interactive before/after comparison slider"
                style={{ width: '100%', maxWidth: '520px', height: '300px' }}
              >
                <div className="comparison-pane comparison-pane-before" style={{ padding: '24px' }}>
                  <span className="comparison-tag before">BEFORE (CAPTURE A)</span>
                  <div style={{ marginTop: '36px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Enterprise Subscription</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--rose-400)', margin: '8px 0' }}>
                      $499 <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ month</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Unlimited API checks • 0 Quota Caps</div>
                  </div>
                </div>
                <div 
                  className="comparison-pane comparison-pane-after"
                  style={{
                    clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
                    padding: '24px'
                  }}
                >
                  <span className="comparison-tag after">AFTER (CAPTURE B)</span>
                  <div style={{ marginTop: '36px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>Enterprise Subscription</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--emerald-400)', margin: '8px 0' }}>
                      $799 <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>/ month</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>50,000 API checks • Enforced Capping</div>
                  </div>
                </div>
                <div className="comparison-divider" style={{ left: `${sliderPos}%` }}>
                  <div className="comparison-handle">
                    <Sliders size={13} />
                  </div>
                </div>
              </div>
            </div>

            {/* STAGE 5: Webhook event payload */}
            <div style={fadeStyle(currentStage === 5)}>
              <div 
                className="glass-card"
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  borderRadius: '12px',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.2)'
                }}
              >
                <div style={{ height: '36px', background: '#111827', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px' }}>
                  <Send size={13} color="var(--cyan-400)" />
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                    Webhook Delivery Confirmed • HTTP 200 OK
                  </span>
                </div>
                <div style={{ padding: '24px', background: '#090d16' }}>
                  <div style={{ background: '#060910', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#cbd5e1' }}>
                    <div style={{ color: 'var(--cyan-400)', marginBottom: '6px' }}>
                      POST https://hooks.slack.com/services/T00/B00/X00
                    </div>
                    <pre style={{ margin: 0, lineHeight: 1.5 }}>
{`{
  "event": "target.mutation_detected",
  "monitor": "Vendor Cloud Pricing",
  "delta": "+$300/mo price increase",
  "dedupeKey": "mon_1084_8f3c",
  "status": "DELIVERED"
}`}
                    </pre>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', color: 'var(--emerald-400)', fontSize: '12px' }}>
                    <ShieldCheck size={16} />
                    <span>Deduplicated • Zero repeated notification spam</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .story-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
}
