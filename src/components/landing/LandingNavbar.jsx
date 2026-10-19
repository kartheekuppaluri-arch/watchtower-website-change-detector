import React, { useState, useEffect } from 'react';
import { Activity, ArrowRight, Menu, X, Layers } from 'lucide-react';

export default function LandingNavbar({ onStartMonitoring }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (e, id) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const elem = document.getElementById(id);
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      transition: 'all 0.3s ease',
      background: scrolled ? 'rgba(7, 9, 14, 0.9)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
      padding: scrolled ? '12px 0' : '20px 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.3)'
          }}>
            <Activity size={18} color="#ffffff" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
              WatchTower
            </span>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)' }}>
              v2.0
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }} className="landing-desktop-nav">
          <a href="#story" onClick={(e) => scrollTo(e, 'story')} style={{ color: 'var(--text-muted)', fontSize: '13.5px', textDecoration: 'none', fontWeight: 500 }}>
            The Story of a Change
          </a>
          <a href="#features" onClick={(e) => scrollTo(e, 'features')} style={{ color: 'var(--text-muted)', fontSize: '13.5px', textDecoration: 'none', fontWeight: 500 }}>
            Capabilities
          </a>
          <a href="#tech-stack" onClick={(e) => scrollTo(e, 'tech-stack')} style={{ color: 'var(--text-muted)', fontSize: '13.5px', textDecoration: 'none', fontWeight: 500 }}>
            Tech Stack
          </a>
          <a href="#architecture" onClick={(e) => scrollTo(e, 'architecture')} style={{ color: 'var(--text-muted)', fontSize: '13.5px', textDecoration: 'none', fontWeight: 500 }}>
            Architecture
          </a>
          <a href="#use-cases" onClick={(e) => scrollTo(e, 'use-cases')} style={{ color: 'var(--text-muted)', fontSize: '13.5px', textDecoration: 'none', fontWeight: 500 }}>
            Use Cases
          </a>
        </div>

        {/* Direct Action to Dashboard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={onStartMonitoring}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700 }}
          >
            <span>Start Monitoring</span>
            <ArrowRight size={14} />
          </button>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="landing-mobile-btn"
            style={{ display: 'none', background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px' }}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          background: 'rgba(7, 9, 14, 0.98)',
          borderBottom: '1px solid var(--border-medium)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <a href="#story" onClick={(e) => scrollTo(e, 'story')} style={{ color: '#ffffff', fontSize: '15px', textDecoration: 'none' }}>
            The Story of a Change
          </a>
          <a href="#features" onClick={(e) => scrollTo(e, 'features')} style={{ color: '#ffffff', fontSize: '15px', textDecoration: 'none' }}>
            Capabilities
          </a>
          <a href="#tech-stack" onClick={(e) => scrollTo(e, 'tech-stack')} style={{ color: '#ffffff', fontSize: '15px', textDecoration: 'none' }}>
            Tech Stack
          </a>
          <a href="#architecture" onClick={(e) => scrollTo(e, 'architecture')} style={{ color: '#ffffff', fontSize: '15px', textDecoration: 'none' }}>
            System Architecture
          </a>
          <a href="#use-cases" onClick={(e) => scrollTo(e, 'use-cases')} style={{ color: '#ffffff', fontSize: '15px', textDecoration: 'none' }}>
            Use Cases
          </a>
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '8px 0' }} />
          <button onClick={onStartMonitoring} className="btn btn-primary" style={{ width: '100%' }}>
            <span>Launch WatchTower Dashboard</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .landing-desktop-nav { display: none !important; }
          .landing-mobile-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
