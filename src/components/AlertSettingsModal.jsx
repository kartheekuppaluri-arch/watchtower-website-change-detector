import React, { useState, useEffect } from 'react';
import { 
  X, 
  BellRing, 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  ExternalLink 
} from 'lucide-react';

export default function AlertSettingsModal({ onClose, defaultTab = 'alerts' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [alerts, setAlerts] = useState([]);
  const [digest, setDigest] = useState(null);
  const [testWebhookUrl, setTestWebhookUrl] = useState('');
  const [testMsg, setTestMsg] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch('/api/alerts/history')
      .then(r => r.json())
      .then(d => setAlerts(d.alerts || []))
      .catch(console.error);

    fetch('/api/digest')
      .then(r => r.json())
      .then(d => setDigest(d.digest || null))
      .catch(console.error);
  }, []);

  const runTestWebhook = () => {
    if (!testWebhookUrl) return;
    setTesting(true);
    setTestMsg('');
    fetch('/api/alerts/test-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: testWebhookUrl, monitorName: 'Live Test Monitor' })
    })
      .then(r => r.json())
      .then(d => setTestMsg(d.message))
      .catch(e => setTestMsg('Error: ' + e.message))
      .finally(() => setTesting(false));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Alert Dispatcher & Daily Digest</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Webhook tests, deduplication logs, and 24-hour change digests
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          <div className="diff-tabs" style={{ marginBottom: '16px' }}>
            <button 
              className={`diff-tab ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
            >
              <BellRing size={13} style={{ display: 'inline', marginRight: 4 }} />
              Dispatched Alerts Log ({alerts.length})
            </button>
            <button 
              className={`diff-tab ${activeTab === 'digest' ? 'active' : ''}`}
              onClick={() => setActiveTab('digest')}
            >
              <FileText size={13} style={{ display: 'inline', marginRight: 4 }} />
              24h Daily Digest Preview
            </button>
          </div>

          {activeTab === 'alerts' && (
            <div>
              {/* Webhook tester box */}
              <div style={{ 
                background: '#131c2e', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '8px', 
                padding: '14px',
                marginBottom: '16px' 
              }}>
                <label className="form-label" style={{ fontSize: '12.5px' }}>
                  Send Test Discord / Telegram Webhook Notification:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="url" 
                    className="form-input mono" 
                    placeholder="https://discord.com/api/webhooks/..." 
                    value={testWebhookUrl}
                    onChange={e => setTestWebhookUrl(e.target.value)}
                    style={{ fontSize: '12px', flex: 1 }}
                  />
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={runTestWebhook}
                    disabled={!testWebhookUrl || testing}
                  >
                    <Send size={12} />
                    {testing ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
                {testMsg && (
                  <div style={{ fontSize: '11.5px', color: 'var(--cyan-400)', marginTop: '6px' }}>
                    {testMsg}
                  </div>
                )}
              </div>

              {/* History list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                {alerts.map(a => (
                  <div key={a.id} style={{ 
                    background: '#131c2e', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: '8px', 
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                        [{a.channel.toUpperCase()}] {a.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {a.summary}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        🕒 {new Date(a.timestamp).toLocaleString()} • DedupeKey: <code>{a.dedupeKey}</code>
                      </div>
                    </div>
                    <span className="status-badge ok" style={{ fontSize: '10px' }}>Delivered</span>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No alerts sent yet. Alerts are sent whenever a monitor status changes!
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'digest' && (
            <div>
              <div style={{ 
                background: '#131c2e', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '8px', 
                padding: '16px',
                lineHeight: '1.6'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '12px' }}>
                  <strong>DAILY CHANGE DIGEST REPORT</strong>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    Generated: {digest?.generatedAt ? new Date(digest.generatedAt).toLocaleString() : 'Now'}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Summary of changes across all monitored endpoints in the last 24 hours:
                </div>

                {digest?.items?.map(item => (
                  <div key={item.monitorId} style={{ 
                    padding: '10px 0', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#ffffff' }}>{item.monitorName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{item.url}</div>
                      <div style={{ fontSize: '12px', color: 'var(--cyan-400)', marginTop: '2px' }}>
                        {item.lastSummary}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`status-badge ${item.status.toLowerCase()}`}>
                        {item.changesCount} Changes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
