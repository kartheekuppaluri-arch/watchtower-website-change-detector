import React, { useState, useEffect, useRef } from 'react';
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

export default function CinematicScrollStory({ onStartMonitoring }) {
  const scrollTrackRef = useRef(null);
  const cardRefs = useRef([]);
  const [currentStage, setCurrentStage] = useState(1);
  const [sliderPos, setSliderPos] = useState(50);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isDraggingRef = useRef(false);

  const stages = [
    {
      id: 1,
      badge: 'STAGE 01 — TARGET CONFIGURATION',
      shortTitle: 'Target Configuration',
      headline: 'Choose what to monitor, not just a URL.',
      desc: 'Critical updates happen without warning on pricing tables, service terms, and API documentation. Instead of manually refreshing pages, you register any web address, configure check intervals from 1 minute to 24 hours, and specify the exact DOM regions that matter.',
      tags: ['Polling 1m–24h', 'Auto-Retry & Backoff', 'Rate-Limit Shield'],
      metaLabel: 'Job Registered',
      metaValue: 'Interval: 15m'
    },
    {
      id: 2,
      badge: 'STAGE 02 — EXTRACTION & NOISE SCRUBBING',
      shortTitle: 'Noise Scrubbing',
      headline: 'Filter out dynamic noise before diffing.',
      desc: 'Modern websites constantly mutate live clocks, random session tokens, and shifting banner ads. WatchTower applies scoped CSS selectors and 4-layer regex filtering to strip ephemeral noise, isolating only the genuine content you care about.',
      tags: ['CSS Watch Selectors', 'Ignore Region Stripping', 'Token Sanitization'],
      metaLabel: 'Scrubber Active',
      metaValue: '0 False Alerts'
    },
    {
      id: 3,
      badge: 'STAGE 03 — DETERMINISTIC DETECTION',
      shortTitle: 'Change Detection',
      headline: 'Detect mutations against verified snapshots.',
      desc: 'Every crawl is hashed with SHA-256 and compared with the previous valid snapshot. Myers diffing computes exact line additions and deletions, while numeric tracking automatically extracts price shifts, rate limits, and quota changes.',
      tags: ['SHA-256 Fingerprints', 'Myers Diff Algorithm', 'Numeric Metric Radar'],
      metaLabel: 'Diff Computed',
      metaValue: '+2 Added / -1 Removed'
    },
    {
      id: 4,
      badge: 'STAGE 04 — TEXT & VISUAL DELTA ANALYSIS',
      shortTitle: 'Visual Comparison',
      headline: 'Inspect both semantic text and visual layout.',
      desc: 'Review changes through dual perspectives: semantic line diffs for raw text and an interactive visual comparison curtain with pixel-level bounding masks. AI-generated summaries distill complex diffs into a clear, single sentence.',
      tags: ['Dual Snapshot View', 'Pixelmatch Overlays', 'Gemini AI Summaries'],
      metaLabel: 'Interactive Proof',
      metaValue: 'Drag Curtain to Compare'
    },
    {
      id: 5,
      badge: 'STAGE 05 — DEDUPLICATED ALERT DISPATCH',
      shortTitle: 'Alert Delivery',
      headline: 'Deliver actionable signals without alert fatigue.',
      desc: 'Confirmed changes trigger immediate webhooks to Slack, Discord, Telegram, or custom endpoints, along with RSS feeds and email alerts. Intelligent deduplication prevents repeated notification spam when values remain stable.',
      tags: ['Webhook Dispatch', 'Custom Endpoints', 'Spam Deduplication'],
      metaLabel: 'Delivery Status',
      metaValue: 'HTTP 200 Confirmed'
    }
  ];

  // Update scroll navigation arrow state and current active stage on scroll
  const handleScroll = () => {
    const track = scrollTrackRef.current;
    if (!track) return;

    const scrollLeft = track.scrollLeft;
    const maxScroll = track.scrollWidth - track.clientWidth;
    setCanScrollLeft(scrollLeft > 20);
    setCanScrollRight(scrollLeft < maxScroll - 20);

    // Calculate active stage based on card centers
    const trackCenter = scrollLeft + track.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    cardRefs.current.forEach((card, idx) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - trackCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    setCurrentStage(closestIndex + 1);
  };

  useEffect(() => {
    const track = scrollTrackRef.current;
    if (!track) return;

    track.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => track.removeEventListener('scroll', handleScroll);
  }, []);

  // Programmatic scroll to specific stage
  const scrollToStage = (stageId) => {
    const targetCard = cardRefs.current[stageId - 1];
    const track = scrollTrackRef.current;
    if (targetCard && track) {
      const cardLeft = targetCard.offsetLeft;
      const cardWidth = targetCard.offsetWidth;
      const trackWidth = track.clientWidth;
      const scrollPos = cardLeft - (trackWidth - cardWidth) / 2;

      track.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: 'smooth'
      });
      setCurrentStage(stageId);
    }
  };

  const handlePrev = () => {
    if (currentStage > 1) {
      scrollToStage(currentStage - 1);
    }
  };

  const handleNext = () => {
    if (currentStage < stages.length) {
      scrollToStage(currentStage + 1);
    }
  };

  // Keyboard navigation for carousel
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    }
  };

  // Interactive slider controls for Stage 4
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

  return (
    <section 
      id="story" 
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ 
        position: 'relative', 
        width: '100%', 
        padding: '90px 0 110px', 
        background: '#07090e',
        overflow: 'hidden',
        outline: 'none'
      }}
      aria-label="The Story of a Change walkthrough"
    >
      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        
        {/* Section Header */}
        <div className="section-header" style={{ marginBottom: '40px', textAlign: 'center' }}>
          <div className="eyebrow" style={{ marginBottom: '14px' }}>
            <span className="eyebrow-dot" />
            <span>HOW WATCHTOWER WORKS</span>
          </div>
          <h2 className="section-title" style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '16px' }}>
            The Story of a Change
          </h2>
          <p className="section-desc" style={{ maxWidth: '640px', margin: '0 auto', fontSize: '15.5px', color: 'var(--text-muted)', lineHeight: 1.65 }}>
            Follow the complete lifecycle of a monitored website — from initial URL ingestion and noise filtering to semantic diffing, visual proof, and alert delivery.
          </p>
        </div>

        {/* Stepper Navigation Strip & Directional Arrows */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          padding: '0 8px'
        }}>
          {/* Stage selector pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(13, 18, 28, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '6px 12px',
            borderRadius: '9999px',
            border: '1px solid var(--border-subtle)',
            overflowX: 'auto',
            maxWidth: '100%'
          }}>
            {stages.map((s) => {
              const isActive = currentStage === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollToStage(s.id)}
                  style={{
                    background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                    color: isActive ? 'var(--cyan-400)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11.5px',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  aria-label={`Jump to stage 0${s.id}: ${s.shortTitle}`}
                >
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isActive ? 'var(--cyan-400)' : '#475569',
                    boxShadow: isActive ? '0 0 8px var(--cyan-400)' : 'none',
                    transition: 'all 0.2s ease'
                  }} />
                  <span>0{s.id}</span>
                  <span className="stage-pill-label" style={{ opacity: isActive ? 1 : 0.75 }}>
                    {s.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls: Previous / Next & Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ 
              fontSize: '12px', 
              fontFamily: 'var(--font-mono)', 
              color: 'var(--text-dim)', 
              marginRight: '6px',
              userSelect: 'none'
            }}>
              <span style={{ color: 'var(--cyan-400)', fontWeight: 700 }}>0{currentStage}</span> / 0{stages.length}
            </span>

            <button
              onClick={handlePrev}
              disabled={!canScrollLeft}
              className="btn btn-secondary btn-sm"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canScrollLeft ? 1 : 0.35,
                cursor: canScrollLeft ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease'
              }}
              aria-label="Previous story card"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={handleNext}
              disabled={!canScrollRight}
              className="btn btn-secondary btn-sm"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: canScrollRight ? 1 : 0.35,
                cursor: canScrollRight ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease'
              }}
              aria-label="Next story card"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* Horizontal Card Carousel Track */}
      <div style={{ position: 'relative', width: '100%' }}>
        
        {/* Right edge gradient peek indicator */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '60px',
          background: 'linear-gradient(to right, transparent, rgba(7, 9, 14, 0.95))',
          pointerEvents: 'none',
          zIndex: 20,
          opacity: canScrollRight ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }} />

        {/* Left edge gradient peek indicator */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '60px',
          background: 'linear-gradient(to left, transparent, rgba(7, 9, 14, 0.95))',
          pointerEvents: 'none',
          zIndex: 20,
          opacity: canScrollLeft ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }} />

        <div 
          ref={scrollTrackRef}
          className="story-scroll-track"
          style={{
            display: 'flex',
            gap: '28px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            padding: '12px max(24px, calc((100vw - 1200px) / 2)) 32px',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(56, 189, 248, 0.3) rgba(15, 23, 42, 0.6)'
          }}
        >
          {stages.map((s, index) => {
            const isCurrent = currentStage === s.id;
            return (
              <div
                key={s.id}
                ref={(el) => (cardRefs.current[index] = el)}
                className="glass-card story-card-item"
                style={{
                  flex: '0 0 min(960px, 86vw)',
                  scrollSnapAlign: 'center',
                  scrollSnapStop: 'always',
                  borderRadius: '16px',
                  border: isCurrent ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid var(--border-subtle)',
                  background: 'rgba(10, 15, 26, 0.75)',
                  boxShadow: isCurrent 
                    ? '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15)' 
                    : '0 10px 30px rgba(0, 0, 0, 0.5)',
                  padding: '36px',
                  display: 'grid',
                  gridTemplateColumns: '1.05fr 1fr',
                  gap: '40px',
                  alignItems: 'center',
                  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                
                {/* Left Column: Narrative Content */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Badge */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--cyan-400)',
                    letterSpacing: '0.08em',
                    marginBottom: '12px'
                  }}>
                    <span style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      background: 'var(--cyan-400)', 
                      boxShadow: '0 0 8px var(--cyan-400)' 
                    }} />
                    {s.badge}
                  </div>

                  {/* Headline */}
                  <h3 style={{
                    fontSize: 'clamp(22px, 2.5vw, 32px)',
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: '-0.025em',
                    lineHeight: 1.2,
                    marginBottom: '14px'
                  }}>
                    {s.headline}
                  </h3>

                  {/* Description */}
                  <p style={{
                    fontSize: '14.5px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.65,
                    marginBottom: '20px'
                  }}>
                    {s.desc}
                  </p>

                  {/* Feature Tags Strip */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
                    {s.tags.map((tag, tIdx) => (
                      <span 
                        key={tIdx} 
                        style={{
                          fontSize: '11px',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(56, 189, 248, 0.08)',
                          color: '#bae6fd',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                          padding: '3px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>

                  {/* Card Action Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
                    <button 
                      onClick={onStartMonitoring}
                      className="btn btn-primary btn-sm"
                      style={{ fontWeight: 700 }}
                    >
                      <span>Try This in Dashboard</span>
                      <ArrowRight size={13} />
                    </button>

                    {index < stages.length - 1 ? (
                      <button
                        onClick={() => scrollToStage(s.id + 1)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <span>Next Step</span>
                        <ChevronRight size={13} />
                      </button>
                    ) : (
                      <span style={{ fontSize: '11.5px', color: 'var(--emerald-400)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> Full Pipeline Complete
                      </span>
                    )}
                  </div>

                </div>

                {/* Right Column: Visual Stage Artifact */}
                <div style={{ width: '100%', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  
                  {/* STAGE 1 VISUAL: Target Ingestion & Job Registration */}
                  {s.id === 1 && (
                    <div 
                      className="glass-card"
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.15)',
                        overflow: 'hidden'
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
                  )}

                  {/* STAGE 2 VISUAL: Scoped DOM Inspection & Noise Filtering */}
                  {s.id === 2 && (
                    <div 
                      className="glass-card"
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.15)',
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
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>Enterprise Dedicated Cluster</div>
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
                  )}

                  {/* STAGE 3 VISUAL: Historical vs Active Snapshot Diff */}
                  {s.id === 3 && (
                    <div style={{ position: 'relative', width: '100%', height: '260px' }}>
                      <div 
                        className="glass-card"
                        style={{
                          position: 'absolute',
                          top: '0px',
                          left: '0px',
                          right: '24px',
                          height: '210px',
                          background: '#0a0f1a',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
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

                      <div 
                        className="glass-card"
                        style={{
                          position: 'absolute',
                          top: '32px',
                          left: '16px',
                          right: '0px',
                          height: '228px',
                          background: '#090d16',
                          border: '1px solid var(--cyan-400)',
                          padding: '18px',
                          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.2)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)', fontWeight: 600 }}>
                            ACTIVE CAPTURE #1084 (SHA-256: 8f3c7...)
                          </span>
                          <span className="code-badge" style={{ color: 'var(--emerald-400)', borderColor: 'rgba(52, 211, 153, 0.4)' }}>
                            +2 LINES / -1 LINE
                          </span>
                        </div>
                        <div style={{ background: '#05070a', borderRadius: '6px', padding: '10px', fontFamily: 'var(--font-mono)', fontSize: '11.5px', lineHeight: 1.55 }}>
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
                  )}

                  {/* STAGE 4 VISUAL: Interactive Comparison Curtain */}
                  {s.id === 4 && (
                    <div 
                      className="comparison-curtain"
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      tabIndex={0}
                      role="slider"
                      aria-valuenow={Math.round(sliderPos)}
                      aria-label="Interactive before and after comparison curtain slider"
                      style={{ width: '100%', height: '280px', borderRadius: '12px' }}
                    >
                      <div className="comparison-pane comparison-pane-before" style={{ padding: '20px' }}>
                        <span className="comparison-tag before">BEFORE (CAPTURE A)</span>
                        <div style={{ marginTop: '28px' }}>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Enterprise Subscription</div>
                          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--rose-400)', margin: '6px 0' }}>
                            $499 <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ month</span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Unlimited checks • 0 Quota Caps</div>
                        </div>
                      </div>
                      <div 
                        className="comparison-pane comparison-pane-after"
                        style={{
                          clipPath: `polygon(${sliderPos}% 0, 100% 0, 100% 100%, ${sliderPos}% 100%)`,
                          padding: '20px'
                        }}
                      >
                        <span className="comparison-tag after">AFTER (CAPTURE B)</span>
                        <div style={{ marginTop: '28px' }}>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Enterprise Subscription</div>
                          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--emerald-400)', margin: '6px 0' }}>
                            $799 <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>/ month</span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>50,000 API checks • Enforced Capping</div>
                        </div>
                      </div>
                      <div className="comparison-divider" style={{ left: `${sliderPos}%` }}>
                        <div className="comparison-handle">
                          <Sliders size={13} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STAGE 5 VISUAL: Webhook Event Payload */}
                  {s.id === 5 && (
                    <div 
                      className="glass-card"
                      style={{
                        width: '100%',
                        borderRadius: '12px',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.15)',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ height: '36px', background: '#111827', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '8px' }}>
                        <Send size={13} color="var(--cyan-400)" />
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                          Webhook Delivery Confirmed • HTTP 200 OK
                        </span>
                      </div>
                      <div style={{ padding: '20px', background: '#090d16' }}>
                        <div style={{ background: '#060910', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '14px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#cbd5e1' }}>
                          <div style={{ color: 'var(--cyan-400)', marginBottom: '6px' }}>
                            POST https://hooks.slack.com/services/T00/B00/X00
                          </div>
                          <pre style={{ margin: 0, lineHeight: 1.45 }}>
{`{
  "event": "target.mutation_detected",
  "monitor": "Vendor Cloud Pricing",
  "delta": "+$300/mo price increase",
  "dedupeKey": "mon_1084_8f3c",
  "status": "DELIVERED"
}`}
                          </pre>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', color: 'var(--emerald-400)', fontSize: '12px' }}>
                          <ShieldCheck size={16} />
                          <span>Deduplicated • Zero repeated notification spam</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>

      </div>

      <style>{`
        .story-scroll-track::-webkit-scrollbar {
          height: 6px;
        }
        .story-scroll-track::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 9999px;
        }
        .story-scroll-track::-webkit-scrollbar-thumb {
          background: rgba(56, 189, 248, 0.35);
          border-radius: 9999px;
        }
        .story-scroll-track::-webkit-scrollbar-thumb:hover {
          background: rgba(56, 189, 248, 0.6);
        }
        @media (max-width: 900px) {
          .story-card-item {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
            padding: 24px !important;
          }
          .stage-pill-label {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
