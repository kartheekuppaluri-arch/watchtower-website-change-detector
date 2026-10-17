import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Send, 
  Sliders, 
  BellRing, 
  Globe, 
  Crosshair, 
  Filter, 
  Sparkles 
} from 'lucide-react';
import { apiFetch, apiUrl } from '../api';

export default function AddMonitorModal({ monitor, onClose, onSave }) {
  const [name, setName] = useState(monitor?.name || '');
  const [url, setUrl] = useState(monitor?.url || '');
  const [intervalMinutes, setIntervalMinutes] = useState(monitor?.intervalMinutes || 15);
  const [watchSelector, setWatchSelector] = useState(monitor?.watchSelector || '');
  const [ignoreInput, setIgnoreInput] = useState((monitor?.ignoreSelectors || []).join(', '));
  const [sensitivity, setSensitivity] = useState(monitor?.sensitivity || 'medium');
  const [noiseFilterActive, setNoiseFilterActive] = useState(monitor?.noiseFilterActive !== false);
  const [customRegex, setCustomRegex] = useState(monitor?.customRegex || '');
  const [keywordAlerts, setKeywordAlerts] = useState((monitor?.keywordAlerts || []).join(', '));
  const [numberTracking, setNumberTracking] = useState(monitor?.numberTracking || false);
  const [alertEmail, setAlertEmail] = useState(monitor?.alertEmail || '');
  const [alertWebhook, setAlertWebhook] = useState(monitor?.alertWebhook || '');
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestMsg, setWebhookTestMsg] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailTestMsg, setEmailTestMsg] = useState('');

  // Lock background scroll and add Escape listener while modal is open
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

  const fillMock = (type) => {
    if (type === 'store') {
      setName('TechGadget Headphones (Price & Stock)');
      setUrl(apiUrl('/mock/store'));
      setWatchSelector('#product-details');
      setIgnoreInput('.live-viewers-count, .promo-ticker');
      setNumberTracking(true);
      setKeywordAlerts('Price, In Stock, Out of Stock');
    } else if (type === 'news') {
      setName('Tech Chronicle News Portal');
      setUrl(apiUrl('/mock/news'));
      setWatchSelector('main article');
      setIgnoreInput('#live-clock, .ad-banner');
      setCustomRegex('\\d{1,2}:\\d{2}:\\d{2}\\s*(?:AM|PM)');
      setKeywordAlerts('Breaking, AI, Launch');
    } else if (type === 'status') {
      setName('Cloud Infrastructure Health');
      setUrl(apiUrl('/mock/status'));
      setWatchSelector('#status-board');
      setIgnoreInput('');
      setKeywordAlerts('Operational, Degraded, Outage');
    }
  };

  const testWebhook = () => {
    if (!alertWebhook) return;
    setTestingWebhook(true);
    setWebhookTestMsg('');
    apiFetch('/api/alerts/test-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: alertWebhook, monitorName: name || 'Test Monitor' })
    })
      .then(r => r.json())
      .then(data => {
        setWebhookTestMsg(data.message);
      })
      .catch(err => {
        setWebhookTestMsg('Webhook request failed: ' + err.message);
      })
      .finally(() => setTestingWebhook(false));
  };

  const testEmailHandler = () => {
    if (!alertEmail) return;
    setTestingEmail(true);
    setEmailTestMsg('');
    apiFetch('/api/alerts/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: alertEmail, monitorName: name || 'Test Monitor' })
    })
      .then(r => r.json())
      .then(data => {
        setEmailTestMsg(data.message);
      })
      .catch(err => {
        setEmailTestMsg('Email test failed: ' + err.message);
      })
      .finally(() => setTestingEmail(false));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url) return;

    const ignoreArr = ignoreInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const kwArr = keywordAlerts
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    onSave({
      name: name || new URL(url).hostname,
      url,
      intervalMinutes: Number(intervalMinutes),
      watchSelector,
      ignoreSelectors: ignoreArr,
      sensitivity,
      noiseFilterActive,
      customRegex,
      keywordAlerts: kwArr,
      numberTracking,
      alertEmail,
      alertWebhook
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Pinned Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">{monitor ? 'Edit Monitor' : 'Create New Website Monitor'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Headless browser change tracking with noise scrubbing & instant notifications
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close dialog"><X size={20} /></button>
        </div>

        {/* Constrained Flex Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflow: 'hidden' }}>
          {/* Independently Scrollable Modal Body */}
          <div className="modal-body">
            {/* Quick Presets */}
            {!monitor && (
              <div style={{ 
                background: 'rgba(56, 189, 248, 0.08)', 
                border: '1px solid rgba(56, 189, 248, 0.2)', 
                borderRadius: '8px', 
                padding: '10px 14px', 
                marginBottom: '16px' 
              }}>
                <span style={{ fontSize: '11px', color: 'var(--cyan-400)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Quick Fill Test Targets:
                </span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillMock('store')}>
                    🛒 E-Commerce Store
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillMock('news')}>
                    📰 News Article
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillMock('status')}>
                    ⚡ Cloud Status
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Monitor Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. GPU In-Stock Tracker, Pricing Page" 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Page URL (Public pages only)</label>
              <input 
                type="url" 
                className="form-input mono" 
                value={url} 
                onChange={e => setUrl(e.target.value)} 
                placeholder="https://example.com/product" 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Check Interval</label>
                <select 
                  className="form-select" 
                  value={intervalMinutes} 
                  onChange={e => setIntervalMinutes(e.target.value)}
                >
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every 1 hour</option>
                  <option value={360}>Every 6 hours</option>
                  <option value={1440}>Every 24 hours</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Diff Sensitivity Setting</label>
                <select 
                  className="form-select" 
                  value={sensitivity} 
                  onChange={e => setSensitivity(e.target.value)}
                >
                  <option value="high">High (Alert on &gt;0.5% diff - granular)</option>
                  <option value="medium">Medium (Alert on &gt;4% diff - recommended)</option>
                  <option value="low">Low (Alert on &gt;15% diff - major updates only)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Watch Region CSS Selector (Optional)</label>
              <input 
                type="text" 
                className="form-input mono" 
                value={watchSelector} 
                onChange={e => setWatchSelector(e.target.value)} 
                placeholder="e.g. #product-details, main article, .price-section" 
              />
              <div className="form-helper">
                Narrow crawl focus exclusively to this element. Leave blank to watch the entire page.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ignore Regions (Comma-separated CSS Selectors)</label>
              <input 
                type="text" 
                className="form-input mono" 
                value={ignoreInput} 
                onChange={e => setIgnoreInput(e.target.value)} 
                placeholder="e.g. #live-clock, .ad-banner, .visitor-count, footer" 
              />
              <div className="form-helper">
                Elements removed before computing hash (live counters, ads, cookie notices).
              </div>
            </div>

            {/* Noise Filtering & Sensitivity Options */}
            <div style={{ 
              background: '#131c2e', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '8px', 
              padding: '14px',
              marginBottom: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                  🛡️ Smart Noise Filtering Engine
                </span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={noiseFilterActive} 
                    onChange={e => setNoiseFilterActive(e.target.checked)} 
                  />
                  Enable Noise Stripping
                </label>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px' }}>Custom Regex Ignore Pattern (Optional)</label>
                <input 
                  type="text" 
                  className="form-input mono" 
                  style={{ fontSize: '12px' }}
                  value={customRegex} 
                  onChange={e => setCustomRegex(e.target.value)} 
                  placeholder="e.g. \d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)" 
                />
                <div className="form-helper">
                  Strips dynamic dates, clock ticks, or session tokens matching this regular expression.
                </div>
              </div>
            </div>

            {/* Keyword alerts & Number tracking bonuses */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
              <div>
                <label className="form-label">Keyword-Only Alerts (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={keywordAlerts} 
                  onChange={e => setKeywordAlerts(e.target.value)} 
                  placeholder="e.g. Restocked, Discount, Sold Out" 
                />
                <div className="form-helper">
                  Highlights when these specific phrases appear or disappear.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#f8fafc' }}>
                  <input 
                    type="checkbox" 
                    checked={numberTracking} 
                    onChange={e => setNumberTracking(e.target.checked)} 
                  />
                  📈 Number & Price Tracking
                </label>
                <div className="form-helper">
                  Extracts numerical values ($ prices, quantities) to generate history charts.
                </div>
              </div>
            </div>

            {/* Alert Channels */}
            <div style={{ 
              background: '#131c2e', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: '8px', 
              padding: '14px' 
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '10px' }}>
                🔔 Notification Channels (No duplicate alerts)
              </span>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '12px' }}>Email Address (Instant change alerts)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={alertEmail} 
                    onChange={e => setAlertEmail(e.target.value)} 
                    placeholder="alerts@example.com" 
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={testEmailHandler}
                    disabled={!alertEmail || testingEmail}
                  >
                    <Send size={12} />
                    {testingEmail ? 'Testing...' : 'Test Email'}
                  </button>
                </div>
                {emailTestMsg && (
                  <div style={{ fontSize: '11px', color: emailTestMsg.includes('✅') ? '#34d399' : '#f87171', marginTop: '4px' }}>
                    {emailTestMsg}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px' }}>Telegram / Discord Webhook URL</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="url" 
                    className="form-input mono" 
                    value={alertWebhook} 
                    onChange={e => setAlertWebhook(e.target.value)} 
                    placeholder="https://discord.com/api/webhooks/..." 
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={testWebhook}
                    disabled={!alertWebhook || testingWebhook}
                  >
                    <Send size={12} />
                    {testingWebhook ? 'Testing...' : 'Test Webhook'}
                  </button>
                </div>
                {webhookTestMsg && (
                  <div style={{ fontSize: '11px', color: 'var(--cyan-400)', marginTop: '4px' }}>
                    {webhookTestMsg}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pinned Footer (Always visible at 100% zoom) */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">
              <Check size={14} />
              {monitor ? 'Save Changes' : 'Create & Start Monitoring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
