import React, { useState } from 'react';
import { 
  FlaskConical, 
  ShoppingCart, 
  Newspaper, 
  Activity, 
  Play, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  ShieldAlert, 
  RefreshCw 
} from 'lucide-react';

export default function TestStudio({ monitors, onCheckNow }) {
  const [loadingAction, setLoadingAction] = useState('');
  const [actionFeedback, setActionFeedback] = useState({});

  const storeMonitor = monitors.find(m => m.url.includes('/mock/store'));
  const newsMonitor = monitors.find(m => m.url.includes('/mock/news'));
  const statusMonitor = monitors.find(m => m.url.includes('/mock/status'));

  const triggerMockApi = async (key, endpoint) => {
    setLoadingAction(key);
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      setActionFeedback(prev => ({ ...prev, [key]: 'Updated mock state! Now run a check.' }));
    } catch (e) {
      setActionFeedback(prev => ({ ...prev, [key]: 'Failed: ' + e.message }));
    } finally {
      setLoadingAction('');
    }
  };

  return (
    <div className="test-studio-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'var(--violet-500)', padding: '6px', borderRadius: '8px', color: 'white' }}>
            <FlaskConical size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', color: '#f8fafc' }}>
              Interactive Live Testing Studio
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Simulate real-world website changes, noise tickers, and bot blocks with 1-click test scenarios
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Scenario 1: E-commerce Store */}
        <div className="test-scenario-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={16} color="var(--cyan-400)" />
              <strong style={{ fontSize: '14px', color: '#f8fafc' }}>E-Commerce Store</strong>
            </div>
            <a href="http://localhost:3001/mock/store" target="_blank" rel="noreferrer" className="monitor-url" style={{ fontSize: '11px' }}>
              Open Page <ExternalLink size={10} />
            </a>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>
            Tests price drops, restock alerts, numerical tracking, and stripping live viewer noise counters.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => triggerMockApi('store-drop', '/mock/api/store/price-drop')}
              disabled={loadingAction === 'store-drop'}
            >
              🏷️ Drop Price ($39.99)
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => triggerMockApi('store-stock', '/mock/api/store/toggle-stock')}
              disabled={loadingAction === 'store-stock'}
            >
              📦 Toggle Stock Status
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => triggerMockApi('store-reset', '/mock/api/store/price-reset')}
              disabled={loadingAction === 'store-reset'}
            >
              🔄 Reset Store
            </button>
          </div>

          {storeMonitor && (
            <button 
              className="btn btn-primary btn-sm" 
              style={{ width: '100%' }}
              onClick={() => onCheckNow(storeMonitor.id)}
            >
              <Play size={12} /> Run Check on Store Monitor
            </button>
          )}
        </div>

        {/* Scenario 2: News Portal */}
        <div className="test-scenario-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Newspaper size={16} color="var(--violet-400)" />
              <strong style={{ fontSize: '14px', color: '#f8fafc' }}>Tech News Portal</strong>
            </div>
            <a href="http://localhost:3001/mock/news" target="_blank" rel="noreferrer" className="monitor-url" style={{ fontSize: '11px' }}>
              Open Page <ExternalLink size={10} />
            </a>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>
            Has a ticking clock (<code>#live-clock</code>) and rotating ad that change every second. Demonstrates noise suppression!
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => triggerMockApi('news-update', '/mock/api/news/add-update')}
              disabled={loadingAction === 'news-update'}
            >
              📰 Publish Breaking Update
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => triggerMockApi('news-reset', '/mock/api/news/reset')}
              disabled={loadingAction === 'news-reset'}
            >
              🔄 Reset Article
            </button>
          </div>

          {newsMonitor && (
            <button 
              className="btn btn-primary btn-sm" 
              style={{ width: '100%' }}
              onClick={() => onCheckNow(newsMonitor.id)}
            >
              <Play size={12} /> Run Check on News Monitor
            </button>
          )}
        </div>

        {/* Scenario 3: Cloud Infrastructure */}
        <div className="test-scenario-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--emerald-400)" />
              <strong style={{ fontSize: '14px', color: '#f8fafc' }}>Status Page (Question 1)</strong>
            </div>
            <a href="http://localhost:3001/mock/status" target="_blank" rel="noreferrer" className="monitor-url" style={{ fontSize: '11px' }}>
              Open Page <ExternalLink size={10} />
            </a>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>
            Tests Outage & CAPTCHA protection. Outages and challenges are classified as incidents, NOT false content diffs!
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            <button 
              className="btn btn-danger-outline btn-sm"
              onClick={() => triggerMockApi('status-503', '/mock/api/status/outage')}
              disabled={loadingAction === 'status-503'}
            >
              💥 Trigger 503 Outage
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => triggerMockApi('status-captcha', '/mock/api/status/captcha')}
              disabled={loadingAction === 'status-captcha'}
            >
              🛡️ Trigger Cloudflare CAPTCHA
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => triggerMockApi('status-reset', '/mock/api/status/operational')}
              disabled={loadingAction === 'status-reset'}
            >
              ✅ Restore Operational
            </button>
          </div>

          {statusMonitor && (
            <button 
              className="btn btn-primary btn-sm" 
              style={{ width: '100%' }}
              onClick={() => onCheckNow(statusMonitor.id)}
            >
              <Play size={12} /> Run Check on Status Monitor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
