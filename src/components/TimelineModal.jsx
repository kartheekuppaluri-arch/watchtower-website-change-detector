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
  CheckCircle2 
} from 'lucide-react';
import { apiFetch, apiUrl } from '../api';

export default function TimelineModal({ monitor, onClose, onOpenDiff }) {
  const [snapshots, setSnapshots] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [activeTab, setActiveTab] = useState('snapshots'); // 'snapshots', 'incidents'
  const [loading, setLoading] = useState(true);

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Version History & Incident Timeline</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {monitor.name} ({snapshots.length} Snapshots • {incidents.length} Outage/Block Events)
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {/* Tabs */}
          <div className="diff-tabs" style={{ marginBottom: '16px' }}>
            <button 
              className={`diff-tab ${activeTab === 'snapshots' ? 'active' : ''}`}
              onClick={() => setActiveTab('snapshots')}
            >
              <History size={13} style={{ display: 'inline', marginRight: 4 }} />
              Content Snapshots ({snapshots.length})
            </button>
            <button 
              className={`diff-tab ${activeTab === 'incidents' ? 'active' : ''}`}
              onClick={() => setActiveTab('incidents')}
            >
              <ShieldAlert size={13} style={{ display: 'inline', marginRight: 4 }} />
              Outage / CAPTCHA Incidents ({incidents.length})
            </button>
          </div>

          {/* SNAPSHOTS TAB */}
          {activeTab === 'snapshots' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {snapshots.map((s, idx) => (
                <div 
                  key={s.id}
                  style={{
                    background: '#131c2e',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Version Badge */}
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '8px', 
                      background: 'rgba(56, 189, 248, 0.15)', 
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: 'var(--cyan-400)',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }}>
                      v{snapshots.length - idx}
                    </div>

                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                        {s.summary || 'Snapshot captured'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'flex', gap: '10px', marginTop: '3px' }}>
                        <span>🕒 {new Date(s.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <code>Hash: {s.contentHash.slice(0, 8)}</code>
                        {s.numberValue !== null && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>Value: ${s.numberValue}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Diff stats */}
                    <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>
                      +{s.diffStats?.addedLines || 0}
                    </span>
                    <span style={{ fontSize: '12px', color: '#f87171', fontWeight: 600 }}>
                      -{s.diffStats?.removedLines || 0}
                    </span>

                    {/* Screenshot preview button if available */}
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
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No snapshots captured yet.
                </div>
              )}
            </div>
          )}

          {/* INCIDENTS TAB */}
          {activeTab === 'incidents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                background: 'rgba(56, 189, 248, 0.1)', 
                border: '1px solid rgba(56, 189, 248, 0.2)', 
                borderRadius: '8px', 
                padding: '12px', 
                fontSize: '12.5px', 
                color: '#93c5fd' 
              }}>
                ℹ️ <strong>Outage & CAPTCHA Shield:</strong> These events represent site outages, Cloudflare challenges, or bot barriers. They are isolated here and <strong>suppressed from false content change alerts</strong> to preserve snapshot integrity.
              </div>

              {incidents.map((inc) => (
                <div 
                  key={inc.id}
                  style={{
                    background: '#131c2e',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      background: 'rgba(239, 68, 68, 0.2)', 
                      padding: '8px', 
                      borderRadius: '8px', 
                      color: 'var(--rose-400)' 
                    }}>
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fca5a5' }}>
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
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
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
