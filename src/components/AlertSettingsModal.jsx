import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  FileText, 
  Send, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Clock, 
  Mail,
  Webhook
} from 'lucide-react';
import { apiFetch } from '../api';

export default function AlertSettingsModal({ onClose, defaultTab = 'alerts' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [alerts, setAlerts] = useState([]);
  const [digest, setDigest] = useState(null);

  // Webhook tester state
  const [testWebhookUrl, setTestWebhookUrl] = useState('');
  const [webhookMsg, setWebhookMsg] = useState(null);
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Email tester state
  const [testEmail, setTestEmail] = useState('');
  const [emailMsg, setEmailMsg] = useState(null);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    apiFetch('/api/alerts/history')
      .then(r => r.json())
      .then(d => setAlerts(d.alerts || []))
      .catch(console.error);
    apiFetch('/api/digest')
      .then(r => r.json())
      .then(d => setDigest(d.digest || null))
      .catch(console.error);
  }, []);

  const runTestWebhook = () => {
    if (!testWebhookUrl) return;
    setTestingWebhook(true);
    setWebhookMsg(null);
    apiFetch('/api/alerts/test-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: testWebhookUrl, monitorName: 'WatchTower Live Test' })
    })
      .then(r => r.json())
      .then(d => setWebhookMsg({ success: d.success, text: d.message }))
      .catch(e => setWebhookMsg({ success: false, text: 'Network error: ' + e.message }))
      .finally(() => setTestingWebhook(false));
  };

  const runTestEmail = () => {
    if (!testEmail) return;
    setTestingEmail(true);
    setEmailMsg(null);
    apiFetch('/api/alerts/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, monitorName: 'WatchTower Live Test' })
    })
      .then(r => r.json())
      .then(d => setEmailMsg({ success: d.success, text: d.message }))
      .catch(e => setEmailMsg({ success: false, text: 'Network error: ' + e.message }))
      .finally(() => setTestingEmail(false));
  };

  const msgStyle = (success) => ({
    fontSize: '12px',
    marginTop: '8px',
    padding: '8px 12px',
    borderRadius: '6px',
    background: success ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    border: `1px solid ${success ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
    color: success ? '#34d399' : '#f87171',
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start'
  });

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Alert Dispatcher & Daily Digest</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Webhook & email tests, deduplication logs, and 24-hour change digests
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="diff-tabs" style={{ marginBottom: '16px' }}>
            <button 
              className={`diff-tab ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
            >
              <Bell size={13} style={{ display: 'inline', marginRight: 5 }} />
              Dispatched Alerts Log ({alerts.length})
            </button>
            <button 
              className={`diff-tab ${activeTab === 'digest' ? 'active' : ''}`}
              onClick={() => setActiveTab('digest')}
            >
              <FileText size={13} style={{ display: 'inline', marginRight: 5 }} />
              24h Daily Digest Preview
            </button>
          </div>

          {activeTab === 'alerts' && (
            <div>
              {/* Webhook Tester */}
              <div style={{ 
                background: 'var(--bg-elevated)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '6px', 
                padding: '14px',
                marginBottom: '12px'
              }}>
                <label className="form-label" style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Webhook size={13} />
                  Test Webhook (Discord / Telegram / Slack / Custom):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="url" 
                    className="form-input mono" 
                    placeholder="https://discord.com/api/webhooks/...  |  https://api.telegram.org/bot.../sendMessage?chat_id=..." 
                    value={testWebhookUrl}
                    onChange={e => setTestWebhookUrl(e.target.value)}
                    style={{ fontSize: '11.5px', flex: 1 }}
                  />
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={runTestWebhook}
                    disabled={!testWebhookUrl || testingWebhook}
                  >
                    <Send size={12} />
                    {testingWebhook ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
                {webhookMsg && (
                  <div style={msgStyle(webhookMsg.success)}>
                    {webhookMsg.success ? <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} /> : <XCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
                    <span>{webhookMsg.text}</span>
                  </div>
                )}
              </div>

              {/* Email Tester */}
              <div style={{ 
                background: 'var(--bg-elevated)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '6px', 
                padding: '14px',
                marginBottom: '16px'
              }}>
                <label className="form-label" style={{ fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Mail size={13} />
                  Test Email Delivery (requires RESEND_API_KEY or SMTP_HOST on server):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="you@example.com" 
                    value={testEmail}
                    onChange={e => setTestEmail(e.target.value)}
                    style={{ fontSize: '12px', flex: 1 }}
                  />
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={runTestEmail}
                    disabled={!testEmail || testingEmail}
                  >
                    <Send size={12} />
                    {testingEmail ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
                {emailMsg && (
                  <div style={msgStyle(emailMsg.success)}>
                    {emailMsg.success 
                      ? <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 1 }} /> 
                      : emailMsg.text.includes('⚠️') 
                        ? <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1, color: '#fbbf24' }} /> 
                        : <XCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
                    <span style={{ color: emailMsg.text.includes('⚠️') ? '#fbbf24' : undefined }}>{emailMsg.text}</span>
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px', lineHeight: 1.5 }}>
                  Set <code className="code-pill">RESEND_API_KEY</code> and <code className="code-pill">EMAIL_FROM=onboarding@resend.dev</code> in server environment variables.
                  <br />
                  <span style={{ color: 'var(--amber-400)', display: 'inline-block', marginTop: '4px' }}>
                    ℹ️ <strong>Resend Testing Restriction:</strong> The testing sender (<code>onboarding@resend.dev</code>) can only deliver to the verified Resend account owner's email address. To deliver to other recipients or club members, a verified custom domain is required in Resend.
                  </span>
                </div>
              </div>

              {/* History list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                {alerts.map(a => (
                  <div key={a.id} style={{ 
                    background: 'var(--bg-elevated)', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: '6px', 
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                        [{a.channel.toUpperCase()}] {a.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {a.summary}
                      </div>
                      {a.details && !a.sentSuccessfully && (
                        <div style={{ fontSize: '11px', color: '#f87171', marginTop: '2px' }}>
                          {a.details}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {new Date(a.timestamp).toLocaleString()} • DedupeKey: <code className="code-pill">{a.dedupeKey?.slice(0, 16)}…</code>
                      </div>
                    </div>
                    <span className={`status-badge ${a.sentSuccessfully ? 'ok' : 'error'}`} style={{ fontSize: '10px', flexShrink: 0 }}>
                      {a.sentSuccessfully ? 'Delivered' : 'Failed'}
                    </span>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No alerts sent yet. Alerts are dispatched whenever a significant change is detected.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'digest' && (
            <div>
              <div style={{ 
                background: 'var(--bg-elevated)', 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '6px', 
                padding: '16px',
                lineHeight: '1.6'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '12px' }}>
                  <strong style={{ color: 'var(--text-main)', fontSize: '13px' }}>DAILY CHANGE DIGEST REPORT</strong>
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
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.monitorName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{item.url}</div>
                      <div style={{ fontSize: '12px', color: 'var(--accent-primary)', marginTop: '2px' }}>
                        {item.lastSummary}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`status-badge ${item.status?.toLowerCase() === 'changed' ? 'changed' : 'ok'}`}>
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
