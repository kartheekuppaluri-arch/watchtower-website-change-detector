import React from 'react';
import { Activity, ExternalLink, ArrowRight } from 'lucide-react';

export default function LandingFooter({ onStartMonitoring }) {
  return (
    <footer style={{
      background: '#04060a',
      borderTop: '1px solid var(--border-subtle)',
      padding: '80px 0 40px',
      color: 'var(--text-muted)'
    }}>
      <div className="container">
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr',
          gap: '48px',
          marginBottom: '56px'
        }} className="landing-footer-grid">
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Activity size={18} color="#ffffff" />
              </div>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                WatchTower
              </span>
            </div>

            <p style={{ fontSize: '13.5px', lineHeight: '1.6', maxWidth: '340px', marginBottom: '16px' }}>
              Production-grade website change detection and alerting engine with visual diff, noise filtering, and smart deduplication.
            </p>

            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
              Built by Kartheek Uppaluri <br />
              Computer Science & Engineering, VIT Vellore
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              Platform Navigation
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <button 
                onClick={onStartMonitoring}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--cyan-400)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: 0,
                  fontSize: '13.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Launch Main Dashboard</span>
                <ArrowRight size={13} />
              </button>
              <a href="#story" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Cinematic 3D Story</a>
              <a href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Capabilities Matrix</a>
              <a href="#tech-stack" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Technology Stack</a>
              <a href="#architecture" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>System Architecture</a>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              Official Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px' }}>
              <a 
                href="https://watchtower-website-change-detector.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--cyan-400)', textDecoration: 'none' }}
              >
                <span>Live Vercel Application</span>
                <ExternalLink size={12} />
              </a>

              <a 
                href="https://watchtower-website-change-detector-v2.onrender.com" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none' }}
              >
                <span>Render Backend API</span>
                <ExternalLink size={12} />
              </a>

              <a 
                href="https://github.com/kartheekuppaluri-arch/watchtower-website-change-detector" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', textDecoration: 'none' }}
              >
                <span>GitHub Repository</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

        </div>

        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          fontSize: '12px'
        }}>
          <div>© {new Date().getFullYear()} WatchTower. All rights reserved.</div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
            Integrated Single-Project Architecture
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 800px) {
          .landing-footer-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </footer>
  );
}
