import React, { useState, useEffect } from 'react';
import { 
  X, 
  Crosshair, 
  EyeOff, 
  Check, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { apiFetch, apiUrl } from '../api';

export default function VisualPickerModal({ monitor, onClose, onSave }) {
  const [url, setUrl] = useState(monitor?.url || '');
  const [watchSelector, setWatchSelector] = useState(monitor?.watchSelector || '');
  const [ignoreSelectors, setIgnoreSelectors] = useState(monitor?.ignoreSelectors || []);
  const [hoveredSelector, setHoveredSelector] = useState('');
  const [selectedSelector, setSelectedSelector] = useState('');
  const [pageHtml, setPageHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState('');

  // Sample presets for mock websites
  const presets = [
    { label: 'E-commerce Price Box', selector: '#product-details', type: 'watch' },
    { label: 'Live Viewer Counter (Noise)', selector: '.live-viewers-count', type: 'ignore' },
    { label: 'Promo Flash Ticker (Noise)', selector: '.promo-ticker', type: 'ignore' },
    { label: 'News Main Article', selector: 'main article', type: 'watch' },
    { label: 'Live Ticking Clock (Noise)', selector: '#live-clock', type: 'ignore' },
    { label: 'Sponsored Banner Ad (Noise)', selector: '.ad-banner', type: 'ignore' }
  ];

  const inspectPage = () => {
    if (!url) return;
    setLoading(true);
    apiFetch('/api/picker/inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
      .then(r => r.json())
      .then(data => {
        if (data.html) {
          setPageHtml(data.html);
        }
        if (data.screenshotUrl) {
          setScreenshotUrl(data.screenshotUrl);
        }
      })
      .catch(err => console.error('Inspection failed:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    inspectPage();
  }, [url]);

  const handleApplyPreset = (preset) => {
    if (preset.type === 'watch') {
      setWatchSelector(preset.selector);
    } else {
      if (!ignoreSelectors.includes(preset.selector)) {
        setIgnoreSelectors([...ignoreSelectors, preset.selector]);
      }
    }
  };

  const removeIgnore = (sel) => {
    setIgnoreSelectors(ignoreSelectors.filter(s => s !== sel));
  };

  const handleSave = () => {
    onSave({
      watchSelector,
      ignoreSelectors
    });
    onClose();
  };

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

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content wide" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Interactive Visual Region Picker</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Point-and-click to select regions to watch (CSS selector) and regions to ignore (noise elements)
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Top Control Bar */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
            <input 
              type="text" 
              className="form-input mono" 
              value={url} 
              onChange={e => setUrl(e.target.value)} 
              placeholder="Enter public URL to inspect..."
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary" onClick={inspectPage} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Inspecting DOM...' : 'Reload Page'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
            {/* Visual Preview / Sandbox */}
            <div>
              <div style={{ 
                border: '1px solid var(--border-subtle)', 
                borderRadius: '10px', 
                background: '#090d16', 
                height: '520px', 
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ 
                  background: '#162032', 
                  padding: '8px 12px', 
                  fontSize: '11px', 
                  color: 'var(--text-dim)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)'
                }}>
                  <span>Visual Inspector Canvas</span>
                  <span>Click any element or preset below to tag selector</span>
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: '16px', position: 'relative' }}>
                  {screenshotUrl ? (
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={apiUrl(screenshotUrl)} 
                        alt="Target Screenshot" 
                        style={{ maxWidth: '100%', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </div>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                      Loading page screenshot...
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Preset Selector Chips */}
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
                  ⚡ Quick Semantic Selector Presets:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px' }}
                      onClick={() => handleApplyPreset(p)}
                    >
                      {p.type === 'watch' ? <Crosshair size={10} color="var(--cyan-400)" /> : <EyeOff size={10} color="var(--amber-400)" />}
                      {p.label} <code style={{ color: p.type === 'watch' ? 'var(--cyan-400)' : 'var(--amber-400)' }}>{p.selector}</code>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selector Configuration Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Watch Region */}
              <div style={{ 
                background: '#131c2e', 
                border: '1px solid rgba(14, 165, 233, 0.3)', 
                borderRadius: '10px', 
                padding: '16px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Crosshair size={16} color="var(--cyan-400)" />
                  <label className="form-label" style={{ margin: 0, color: 'var(--cyan-400)' }}>
                    Watch Region (CSS Selector)
                  </label>
                </div>
                <input 
                  type="text" 
                  className="form-input mono"
                  value={watchSelector} 
                  onChange={e => setWatchSelector(e.target.value)}
                  placeholder="e.g. #product-details, main article"
                />
                <div className="form-helper">
                  Only content inside this CSS selector will be tracked for changes. Leave blank for full page.
                </div>
              </div>

              {/* Ignore Regions */}
              <div style={{ 
                background: '#131c2e', 
                border: '1px solid rgba(245, 158, 11, 0.3)', 
                borderRadius: '10px', 
                padding: '16px',
                flex: 1
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <EyeOff size={16} color="var(--amber-400)" />
                  <label className="form-label" style={{ margin: 0, color: 'var(--amber-400)' }}>
                    Ignore Regions ({ignoreSelectors.length})
                  </label>
                </div>
                <div className="form-helper" style={{ marginBottom: '10px' }}>
                  Elements stripped out before computing hash (live clocks, dynamic ads, counters):
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {ignoreSelectors.map((sel, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}>
                      <code style={{ color: 'var(--amber-400)' }}>{sel}</code>
                      <button 
                        onClick={() => removeIgnore(sel)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--rose-400)', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  {ignoreSelectors.length === 0 && (
                    <div style={{ color: 'var(--text-dim)', fontSize: '12px', fontStyle: 'italic' }}>
                      No ignore selectors added yet.
                    </div>
                  )}
                </div>

                {/* Add Custom Ignore Selector */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input 
                    type="text" 
                    id="new-ignore-input" 
                    className="form-input mono" 
                    placeholder="e.g. .ad-banner, footer"
                    style={{ fontSize: '12px' }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        setIgnoreSelectors([...ignoreSelectors, e.target.value.trim()]);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const input = document.getElementById('new-ignore-input');
                      if (input && input.value.trim()) {
                        setIgnoreSelectors([...ignoreSelectors, input.value.trim()]);
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Check size={14} />
            Apply Selectors to Monitor
          </button>
        </div>
      </div>
    </div>
  );
}
