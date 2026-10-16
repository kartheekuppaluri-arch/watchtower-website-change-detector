import React, { useEffect } from 'react';
import LandingNavbar from './LandingNavbar';
import Hero3D from './Hero3D';
import CinematicScrollStory from './CinematicScrollStory';
import DimensionalFeatures from './DimensionalFeatures';
import AuthenticTechStack from './AuthenticTechStack';
import ArchitectureFlow from './ArchitectureFlow';
import UseCasesSection from './UseCasesSection';
import LandingFooter from './LandingFooter';
import '../../landing.css';

export default function LandingPage({ onStartMonitoring }) {
  useEffect(() => {
    // Scroll to top when landing page loads
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleExplore = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const elem = document.getElementById('story');
    if (elem) elem.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-root">
      <LandingNavbar onStartMonitoring={onStartMonitoring} />
      
      <main>
        <Hero3D 
          onStartMonitoring={onStartMonitoring} 
          onExploreExperience={handleExplore}
        />
        
        <CinematicScrollStory onStartMonitoring={onStartMonitoring} />
        
        <DimensionalFeatures onStartMonitoring={onStartMonitoring} />
        
        <AuthenticTechStack />
        
        <ArchitectureFlow />
        
        <UseCasesSection onStartMonitoring={onStartMonitoring} />

        {/* Final Call to Action */}
        <section style={{ padding: '120px 0', textAlign: 'center', position: 'relative' }}>
          <div className="container">
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="glass-card" style={{ padding: '60px 32px', border: '1px solid rgba(56, 189, 248, 0.35)' }}>
                <div className="eyebrow" style={{ marginBottom: '20px' }}>
                  <span className="eyebrow-dot" />
                  <span>EXPERIENCE THE MONITORING ENGINE</span>
                </div>
                <h2 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
                  Stop checking. Start monitoring.
                </h2>
                <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 32px', lineHeight: 1.6 }}>
                  Choose the pages that matter. WatchTower automates DOM crawling, noise scrubbing, and Myers difference detection.
                </p>
                <button 
                  onClick={onStartMonitoring}
                  className="btn btn-primary btn-lg"
                  style={{ fontWeight: 700, padding: '14px 36px', fontSize: '15px' }}
                >
                  <span>Launch WatchTower Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter onStartMonitoring={onStartMonitoring} />
    </div>
  );
}
