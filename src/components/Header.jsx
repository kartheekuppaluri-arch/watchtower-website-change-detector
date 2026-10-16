import React from 'react';
import { 
  Activity, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  BellRing, 
  HelpCircle, 
  Layers, 
  FlaskConical, 
  FileText,
  LayoutGrid,
  BookOpen,
  Sparkles
} from 'lucide-react';

export default function Header({ 
  monitors = [], 
  activeView = 'dashboard',
  onSelectView,
  onAddMonitor, 
  onRunAllChecks, 
  isRunningAll, 
  onOpenFaq, 
  onOpenDigest, 
  onOpenAlerts,
  testStudioOpen,
  setTestStudioOpen
}) {
  const activeCount = monitors.filter(m => m.active).length;
  const changedCount = monitors.filter(m => m.status === 'CHANGED').length;
  const totalSnapshots = monitors.reduce((acc, m) => acc + (m.snapshotCount || 0), 0);
  const totalIncidents = monitors.reduce((acc, m) => acc + (m.incidentCount || 0), 0);

  return (
    <header>
      <div className="header-wrapper">
        {/* Brand Lockup */}
        <div className="brand-section">
          <div className="brand-icon">
            <Activity size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="brand-title">WatchTower</h1>
              <span style={{ 
                fontSize: '11px', 
                background: 'rgba(56, 189, 248, 0.15)', 
                color: 'var(--cyan-400)', 
                padding: '2px 8px', 
                borderRadius: '9999px',
                fontWeight: 700,
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                CHANGE DETECTOR
              </span>
            </div>
            <p className="brand-subtitle">
              Headless browser change monitor with noise scrubbing, visual diffs & smart request coalescing
            </p>
          </div>
        </div>

        {/* View Switcher & Action Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Navigation View Switcher (Dashboard vs About) */}
          <div className="view-nav-tabs">
            <button 
              className={`view-nav-tab ${activeView === 'landing' ? 'active' : ''}`}
              onClick={() => onSelectView && onSelectView('landing')}
              title="Return to Public 3D Landing Page"
            >
              <Sparkles size={13} color="var(--cyan-400)" />
              Product Film
            </button>
            <button 
              className={`view-nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onSelectView && onSelectView('dashboard')}
            >
              <LayoutGrid size={13} />
              Dashboard
            </button>
            <button 
              className={`view-nav-tab ${activeView === 'about' ? 'active' : ''}`}
              onClick={() => onSelectView && onSelectView('about')}
            >
              <BookOpen size={13} />
              Architecture & About
            </button>
          </div>

          <button 
            className={`btn ${testStudioOpen ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setTestStudioOpen(!testStudioOpen)}
          >
            <FlaskConical size={15} />
            {testStudioOpen ? 'Hide Test Lab' : 'Live Test Lab'}
          </button>

          <button className="btn btn-secondary" onClick={onOpenFaq}>
            <HelpCircle size={15} />
            Architecture & FAQ
          </button>

          <button className="btn btn-secondary" onClick={onOpenDigest}>
            <FileText size={15} />
            Daily Digest
          </button>

          <button className="btn btn-secondary" onClick={onOpenAlerts}>
            <BellRing size={15} />
            Alerts & Webhooks
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={onRunAllChecks} 
            disabled={isRunningAll}
          >
            <RefreshCw size={15} className={isRunningAll ? 'animate-spin' : ''} />
            {isRunningAll ? 'Checking...' : 'Run All Checks'}
          </button>

          <button className="btn btn-primary" onClick={onAddMonitor}>
            <Plus size={16} />
            New Monitor
          </button>
        </div>
      </div>

      {/* KPI Stats Bar (Visible on Dashboard) */}
      {activeView === 'dashboard' && (
        <div className="kpi-grid">
          <div className="glass-panel kpi-card">
            <div className="kpi-icon-wrap" style={{ color: 'var(--cyan-400)' }}>
              <Layers size={22} />
            </div>
            <div>
              <div className="kpi-value">{monitors.length}</div>
              <div className="kpi-label">Active Monitors ({activeCount} Live)</div>
            </div>
          </div>

          <div className="glass-panel kpi-card">
            <div className="kpi-icon-wrap" style={{ color: 'var(--emerald-400)' }}>
              <Activity size={22} />
            </div>
            <div>
              <div className="kpi-value">{totalSnapshots}</div>
              <div className="kpi-label">Snapshots Recorded</div>
            </div>
          </div>

          <div className="glass-panel kpi-card">
            <div className="kpi-icon-wrap" style={{ color: 'var(--amber-400)' }}>
              <BellRing size={22} />
            </div>
            <div>
              <div className="kpi-value">{changedCount}</div>
              <div className="kpi-label">Active Change Alerts</div>
            </div>
          </div>

          <div className="glass-panel kpi-card">
            <div className="kpi-icon-wrap" style={{ color: 'var(--rose-400)' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="kpi-value">{totalIncidents}</div>
              <div className="kpi-label">Outage/CAPTCHA Defended</div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
