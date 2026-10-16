import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  ShieldAlert, 
  Eye, 
  Clock, 
  Hash, 
  ArrowRight, 
  Layers, 
  CheckCircle2,
  Info
} from 'lucide-react';
import { apiFetch, apiUrl } from '../api';

export default function TimelineModal({ monitor, onClose, onOpenDiff }) {
  const [snapshots, setSnapshots] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [activeTab, setActiveTab] = useState('snapshots');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!monitor) return;
    setLoading(true);
    Promise.all([
      apiFetch(`/api/monitors/${monitor.id}/snapshots`).then(r => r.json()),
      apiFetch(`/api/monitors/${monitor.id}/incidents`).then(r => r.json())
    ])
      .then(([snapData, incData]) => {
        setSnapshots(snapData.snapshots || []);
        setIncidents(incData.incidents || []);
      })
      .catch(err => console.error('Failed to load timeline:', err))
      .finally(() => setLoading(false));
  }, [monitor]);

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Version History & Incident Timeline</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {monitor.name} ({snapshots.length} Snapshots • {incidents.length} Outage/Block Events)
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Tabs */}
          <div className="diff-tabs" style={{ marginBottom: '16px' }}>
            <button 
              className={`diff-tab ${activeTab === 'snapshots' ? 'active' : ''}`}
              onClick={() => setActiveTab('snapshots')}
            >
              <History size={13} style={{ display: 'inline', marginRight: 5 }} />
              Content Snapshots ({snapshots.length})
            </button>
            <button 
              className={`diff-tab ${activeTab === 'incidents' ? 'active' : ''}`}
              onClick={() => setActiveTab('incidents')}
            >
              <ShieldAlert size={13} style={{ display: 'inline', marginRight: 5 }} />
              Outage / CAPTCHA Incidents ({incidents.length})
            </button>
          </div>

          {/* SNAPSHOTS TAB */}
          {activeTab === 'snapshots' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {snapshots.map((s, idx) => (
                <div 
                  key={s.id}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Version Badge */}
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '6px', 
                      background: 'var(--accent-subtle)', 
                      border: '1px solid var(--accent-border)',
                      color: 'var(--accent-primary)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px'
                    }}>
                      v{snapshots.length - idx}
                    </div>

                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-main)' }}>
                        {s.summary || 'Snapshot captured'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', display: 'flex', gap: '8px', marginTop: '2px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>{new Date(s.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <code className="code-pill">Hash: {s.contentHash.slice(0, 8)}</code>
                        {s.numberValue !== null && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--status-ok)', fontWeight: 600 }}>Value: ${s.numberValue}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--status-ok)', fontWeight: 600 }}>
                      +{s.diffStats?.addedLines || 0}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--status-error)', fontWeight: 600 }}>
                      -{s.diffStats?.removedLines || 0}
                    </span>

                    {s.screenshotUrl && (
                      <a 
                        href={apiUrl(s.screenshotUrl)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-secondary btn-sm"
                      >
                        <Eye size={12} /> View Screenshot
                      </a>
                    )}

                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        onClose();
                        onOpenDiff(monitor);
                      }}
                    >
                      Compare Diff
                    </button>
                  </div>
                </div>
              ))}

              {snapshots.length === 0 && (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No snapshots captured yet.
                </div>
              )}
            </div>
          )}

          {/* INCIDENTS TAB */}
          {activeTab === 'incidents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ 
                background: 'var(--bg-elevated)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '6px', 
                padding: '12px 14px', 
                fontSize: '12px', 
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <Info size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  <strong style={{ color: 'var(--text-main)' }}>Outage & CAPTCHA Shield:</strong> These events represent site outages, Cloudflare challenges, or bot barriers. They are isolated here and <strong style={{ color: 'var(--text-main)' }}>suppressed from false content change alerts</strong> to preserve snapshot integrity.
                </span>
              </div>

              {incidents.map((inc) => (
                <div 
                  key={inc.id}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--status-error-border)',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      background: 'var(--status-error-bg)', 
                      padding: '6px', 
                      borderRadius: '6px', 
                      color: 'var(--status-error)' 
                    }}>
                      <ShieldAlert size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--status-error)' }}>
                        [{inc.type}] {inc.message}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        Timestamp: {new Date(inc.timestamp).toLocaleString()} • HTTP Status: {inc.httpStatus || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <span className="status-badge blocked">Filtered Incident</span>
                </div>
              ))}

              {incidents.length === 0 && (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No outage or CAPTCHA incidents recorded for this monitor. Clean health!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
