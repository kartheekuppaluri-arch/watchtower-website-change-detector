import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Crosshair, 
  EyeOff, 
  Check, 
  Trash2, 
  RefreshCw, 
  Eye,
  Code,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiFetch, apiUrl } from '../api';

export default function VisualPickerModal({ monitor, onClose, onSave }) {
  const [url, setUrl] = useState(monitor?.url || '');
  const [watchSelector, setWatchSelector] = useState(monitor?.watchSelector || '');
  const [ignoreSelectors, setIgnoreSelectors] = useState(monitor?.ignoreSelectors || []);
  const [hoveredSelector, setHoveredSelector] = useState('');
  const [selectedSelector, setSelectedSelector] = useState('');
  const [lastSelectedText, setLastSelectedText] = useState('');
  const [pageHtml, setPageHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [screenshotUrl, setScreenshotUrl] = useState(
    monitor?.latestSnapshot?.screenshotSignedUrl || monitor?.latestSnapshot?.screenshotUrl || ''
  );
  const [viewMode, setViewMode] = useState('interactive'); // 'interactive' | 'screenshot'
  const [targetType, setTargetType] = useState('watch'); // 'watch' | 'ignore'

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
    setErrorNotice(null);

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
        if (!data.html && !data.screenshotUrl && data.error) {
          setErrorNotice(data.error);
        }
      })
      .catch(err => {
        console.error('Inspection failed:', err);
        setErrorNotice(err.message || 'Inspection failed');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    inspectPage();
  }, [url]);

  // Listen for hover and selection messages from the sandboxed iframe inspector
  useEffect(() => {
    const handleInspectorMessage = (event) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'WT_PICKER_HOVER') {
        setHoveredSelector(event.data.selector || '');
      } else if (event.data.type === 'WT_PICKER_SELECT') {
        const sel = event.data.selector;
        const text = event.data.text || '';
        setSelectedSelector(sel);
        setLastSelectedText(text);

        if (targetType === 'watch') {
          setWatchSelector(sel);
        } else {
          setIgnoreSelectors(prev => prev.includes(sel) ? prev : [...prev, sel]);
        }
      }
    };

    window.addEventListener('message', handleInspectorMessage);
    return () => window.removeEventListener('message', handleInspectorMessage);
  }, [targetType]);

  // Build the instrumented HTML document injected into the preview iframe
  const interactiveSrcDoc = useMemo(() => {
    if (!pageHtml) return '';

    // Strip existing script tags to avoid unintended redirect loops or analytics
    const cleanHtml = pageHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Set base href so relative images, fonts, and stylesheets load properly
    let baseTag = '';
    if (url) {
      const baseOrigin = url.startsWith('/')
        ? (window.location.origin)
        : url;
      baseTag = `<base href="${baseOrigin}">`;
    }

    const inspectorStyles = `
      <style id="wt-inspector-injected-styles">
        * { cursor: crosshair !important; }
        .wt-inspector-hover {
          outline: 2px dashed #00e5ff !important;
          background-color: rgba(0, 229, 255, 0.15) !important;
          box-shadow: 0 0 12px rgba(0, 229, 255, 0.4) !important;
          transition: outline 0.1s ease;
        }
        .wt-inspector-selected {
          outline: 3px solid #10b981 !important;
          background-color: rgba(16, 185, 129, 0.25) !important;
          box-shadow: 0 0 16px rgba(16, 185, 129, 0.5) !important;
        }
      </style>
    `;

    const inspectorScript = `
      <script id="wt-inspector-injected-script">
        (function() {
          function computeSelector(el) {
            if (!el || el.nodeType !== 1) return '';
            if (el.id) return '#' + el.id;
            const tag = el.tagName.toLowerCase();
            if (el.className && typeof el.className === 'string') {
              const classes = el.className.split(/\\s+/)
                .filter(function(c) { return c && !c.startsWith('wt-inspector-'); })
                .slice(0, 2);
              if (classes.length > 0) {
                var candidate = tag + '.' + classes.join('.');
                try {
                  if (document.querySelectorAll(candidate).length === 1) return candidate;
                } catch(_) {}
              }
            }
            var parent = el.parentElement;
            if (parent && parent.tagName.toLowerCase() !== 'html') {
              var siblings = Array.from(parent.children).filter(function(c) { return c.tagName === el.tagName; });
              if (siblings.length > 1) {
                var idx = siblings.indexOf(el) + 1;
                return tag + ':nth-of-type(' + idx + ')';
              }
            }
            return tag;
          }

          document.addEventListener('mouseover', function(e) {
            var el = e.target;
            if (!el || el === document.body || el === document.documentElement) return;
            document.querySelectorAll('.wt-inspector-hover').forEach(function(node) {
              node.classList.remove('wt-inspector-hover');
            });
            el.classList.add('wt-inspector-hover');
            var sel = computeSelector(el);
            window.parent.postMessage({ type: 'WT_PICKER_HOVER', selector: sel }, '*');
          });

          document.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var el = e.target;
            if (!el || el === document.body || el === document.documentElement) return;
            document.querySelectorAll('.wt-inspector-selected').forEach(function(node) {
              node.classList.remove('wt-inspector-selected');
            });
            el.classList.add('wt-inspector-selected');
            var sel = computeSelector(el);
            var text = (el.innerText || el.textContent || '').slice(0, 80).trim();
            window.parent.postMessage({ type: 'WT_PICKER_SELECT', selector: sel, text: text }, '*');
          }, true);
        })();
      </script>
    `;

    if (cleanHtml.includes('<head>')) {
      return cleanHtml.replace('<head>', `<head>${baseTag}${inspectorStyles}`).replace('</body>', `${inspectorScript}</body>`);
    }
    return `${baseTag}${inspectorStyles}${cleanHtml}${inspectorScript}`;
  }, [pageHtml, url]);

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

  const resolvedScreenshotSrc = screenshotUrl
    ? (screenshotUrl.startsWith('http') ? screenshotUrl : apiUrl(screenshotUrl))
    : '';

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content wide" onClick={e => e.stopPropagation()} style={{ maxWidth: '1100px' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Crosshair size={18} color="var(--cyan-400)" />
              Interactive Visual Region Picker
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Point and click directly on any element in the live DOM canvas below to tag CSS watch & ignore selectors.
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
            {/* Visual Preview / Sandbox Canvas */}
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
                {/* Canvas Control Header */}
                <div style={{ 
                  background: '#162032', 
                  padding: '8px 12px', 
                  fontSize: '11.5px', 
                  color: 'var(--text-dim)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {/* View Mode Toggle */}
                  <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px' }}>
                    <button
                      className="btn btn-sm"
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        background: viewMode === 'interactive' ? 'var(--cyan-500)' : 'transparent',
                        color: viewMode === 'interactive' ? '#000' : 'var(--text-dim)',
                        fontWeight: viewMode === 'interactive' ? 700 : 500
                      }}
                      onClick={() => setViewMode('interactive')}
                    >
                      <Code size={11} style={{ marginRight: 4 }} /> Interactive Live DOM
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        background: viewMode === 'screenshot' ? 'var(--cyan-500)' : 'transparent',
                        color: viewMode === 'screenshot' ? '#000' : 'var(--text-dim)',
                        fontWeight: viewMode === 'screenshot' ? 700 : 500
                      }}
                      onClick={() => setViewMode('screenshot')}
                    >
                      <Eye size={11} style={{ marginRight: 4 }} /> Screenshot
                    </button>
                  </div>

                  {/* Target Action Mode Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Tag clicks as:</span>
                    <button
                      className="btn btn-sm"
                      style={{
                        padding: '2px 8px',
                        fontSize: '10.5px',
                        background: targetType === 'watch' ? 'rgba(14, 165, 233, 0.25)' : 'transparent',
                        color: targetType === 'watch' ? 'var(--cyan-400)' : 'var(--text-dim)',
                        border: targetType === 'watch' ? '1px solid var(--cyan-500)' : '1px solid rgba(255,255,255,0.1)'
                      }}
                      onClick={() => setTargetType('watch')}
                    >
                      <Crosshair size={10} style={{ marginRight: 3 }} /> Watch Region
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{
                        padding: '2px 8px',
                        fontSize: '10.5px',
                        background: targetType === 'ignore' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                        color: targetType === 'ignore' ? 'var(--amber-400)' : 'var(--text-dim)',
                        border: targetType === 'ignore' ? '1px solid var(--amber-500)' : '1px solid rgba(255,255,255,0.1)'
                      }}
                      onClick={() => setTargetType('ignore')}
                    >
                      <EyeOff size={10} style={{ marginRight: 3 }} /> Ignore Region
                    </button>
                  </div>
                </div>

                {/* Hover/Selection Status Bar */}
                <div style={{
                  background: 'rgba(0,0,0,0.5)',
                  padding: '5px 12px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <span style={{ color: 'var(--text-dim)' }}>Hover:</span>
                  <code style={{ color: 'var(--cyan-400)', fontSize: '11px' }}>
                    {hoveredSelector || 'Move cursor over any element inside the canvas...'}
                  </code>
                </div>

                {/* Canvas Display */}
                <div style={{ flex: 1, overflow: 'auto', position: 'relative', background: '#ffffff' }}>
                  {loading && (
                    <div style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      background: 'rgba(9, 13, 22, 0.85)', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      zIndex: 10,
                      color: 'var(--text-main)',
                      gap: '10px'
                    }}>
                      <RefreshCw size={24} className="animate-spin" color="var(--cyan-400)" />
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Inspecting remote page structure...</div>
                    </div>
                  )}

                  {viewMode === 'interactive' ? (
                    interactiveSrcDoc ? (
                      <iframe 
                        srcDoc={interactiveSrcDoc}
                        title="Interactive Live DOM Inspector"
                        style={{ width: '100%', height: '100%', border: 'none', minHeight: '440px', background: '#fff' }}
                        sandbox="allow-same-origin allow-scripts"
                      />
                    ) : (
                      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', background: '#090d16', height: '100%' }}>
                        <Code size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {errorNotice ? 'Could not load live DOM' : 'Live DOM not loaded yet'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: 4 }}>
                          {errorNotice || 'Click "Reload Page" or choose a Quick Semantic Preset below.'}
                        </div>
                      </div>
                    )
                  ) : (
                    resolvedScreenshotSrc ? (
                      <div style={{ textAlign: 'center', padding: '16px', background: '#090d16', height: '100%', overflow: 'auto' }}>
                        <img 
                          src={resolvedScreenshotSrc} 
                          alt="Target Screenshot" 
                          style={{ maxWidth: '100%', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </div>
                    ) : (
                      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b', background: '#090d16', height: '100%' }}>
                        <Eye size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                        <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                          No screenshot available for this URL yet.
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Selected Element Action Pill */}
                {selectedSelector && (
                  <div style={{
                    background: '#0d1829',
                    borderTop: '1px solid rgba(14, 165, 233, 0.4)',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    fontSize: '11.5px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <CheckCircle2 size={13} color="var(--emerald-400)" />
                      <span style={{ color: 'var(--text-dim)' }}>Selected:</span>
                      <code style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>{selectedSelector}</code>
                      {lastSelectedText && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                          ("{lastSelectedText}")
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '10.5px', padding: '2px 8px' }}
                        onClick={() => setWatchSelector(selectedSelector)}
                      >
                        Set as Watch
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '10.5px', padding: '2px 8px' }}
                        onClick={() => {
                          if (!ignoreSelectors.includes(selectedSelector)) {
                            setIgnoreSelectors([...ignoreSelectors, selectedSelector]);
                          }
                        }}
                      >
                        Add to Ignore
                      </button>
                    </div>
                  </div>
                )}
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
                <div className="form-helper" style={{ marginTop: '6px' }}>
                  Only content inside this CSS selector will be tracked for changes. Leave blank for full page.
                </div>
                {watchSelector && (
                  <button 
                    className="btn btn-sm btn-secondary" 
                    style={{ marginTop: '8px', fontSize: '11px' }}
                    onClick={() => setWatchSelector('')}
                  >
                    Clear Watch Selector
                  </button>
                )}
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
                        title="Remove selector"
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
                        const val = e.target.value.trim();
                        if (!ignoreSelectors.includes(val)) {
                          setIgnoreSelectors([...ignoreSelectors, val]);
                        }
                        e.target.value = '';
                      }
                    }}
                  />
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const input = document.getElementById('new-ignore-input');
                      if (input && input.value.trim()) {
                        const val = input.value.trim();
                        if (!ignoreSelectors.includes(val)) {
                          setIgnoreSelectors([...ignoreSelectors, val]);
                        }
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
