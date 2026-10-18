import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  FileCode, 
  SlidersHorizontal, 
  Layers, 
  TrendingUp, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  ArrowRight 
} from 'lucide-react';
import { apiFetch, apiUrl } from '../api';

export default function DiffModal({ monitor, onClose }) {
  const [snapshots, setSnapshots] = useState([]);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('text'); // 'text', 'slider', 'highlight', 'chart'
  const [sliderPos, setSliderPos] = useState(50); // percentage 0-100 for curtain slider
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  // Fetch snapshots for monitor
  useEffect(() => {
    if (!monitor) return;
    setLoading(true);
    apiFetch(`/api/monitors/${monitor.id}/snapshots`)
      .then(r => r.json())
      .then(data => {
        const list = data.snapshots || [];
        setSnapshots(list);
        if (list.length >= 2) {
          setSelectedA(list[0].id); // latest
          setSelectedB(list[1].id); // previous
        } else if (list.length === 1) {
          setSelectedA(list[0].id);
          setSelectedB(list[0].id);
        }
      })
      .catch(err => console.error('Failed to load snapshots:', err))
      .finally(() => setLoading(false));
  }, [monitor]);

  // Fetch diff comparison whenever selection changes
  useEffect(() => {
    if (!selectedA || !selectedB) return;
    apiFetch('/api/diff/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshotIdA: selectedB, snapshotIdB: selectedA })
    })
      .then(r => r.json())
      .then(data => {
        setDiffData(data);
      })
      .catch(err => console.error('Failed to compare diff:', err));
  }, [selectedA, selectedB]);

  // Handle visual curtain slider drag
  const handleSliderMove = (e) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPos(percent);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDragging) handleSliderMove(e);
    };
    const onMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [isDragging]);

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

  const snapA = diffData?.snapA;
  const snapB = diffData?.snapB;
  const stats = diffData?.textDiff?.stats || { addedLines: 0, removedLines: 0, changedPercent: 0 };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content wide" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">Diff & Version Comparison Engine</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {monitor.name} • <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>{monitor.url}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close dialog"><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Version Selector Bar */}
          <div className="diff-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>Base Version (Old):</label>
                <select 
                  className="form-select" 
                  style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
                  value={selectedB} 
                  onChange={e => setSelectedB(e.target.value)}
                >
                  {snapshots.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      v{snapshots.length - idx} • {new Date(s.timestamp).toLocaleTimeString()} ({s.contentHash.slice(0, 6)})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ color: 'var(--text-dim)', alignSelf: 'flex-end', paddingBottom: '6px' }}>
                <ArrowRight size={16} />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block' }}>Target Version (New):</label>
                <select 
                  className="form-select" 
                  style={{ padding: '6px 10px', fontSize: '12px', width: 'auto' }}
                  value={selectedA} 
                  onChange={e => setSelectedA(e.target.value)}
                >
                  {snapshots.map((s, idx) => (
                    <option key={s.id} value={s.id}>
                      v{snapshots.length - idx} • {new Date(s.timestamp).toLocaleTimeString()} ({s.contentHash.slice(0, 6)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="diff-tabs">
              <button 
                className={`diff-tab ${activeTab === 'text' ? 'active' : ''}`}
                onClick={() => setActiveTab('text')}
              >
                <FileCode size={13} style={{ display: 'inline', marginRight: 4 }} />
                Text Diff
              </button>
              <button 
                className={`diff-tab ${activeTab === 'slider' ? 'active' : ''}`}
                onClick={() => setActiveTab('slider')}
              >
                <SlidersHorizontal size={13} style={{ display: 'inline', marginRight: 4 }} />
                Visual Slider
              </button>
              <button 
                className={`diff-tab ${activeTab === 'highlight' ? 'active' : ''}`}
                onClick={() => setActiveTab('highlight')}
              >
                <Layers size={13} style={{ display: 'inline', marginRight: 4 }} />
                Pixel Diff
              </button>
              {(monitor.numberTracking || snapshots.some(s => typeof s.numberValue === 'number')) && (
                <button 
                  className={`diff-tab ${activeTab === 'chart' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chart')}
                >
                  <TrendingUp size={13} style={{ display: 'inline', marginRight: 4 }} />
                  Metric Trend
                </button>
              )}
            </div>
          </div>

          {/* AI One-line Change Summary Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(139, 92, 246, 0.15))',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            padding: '14px 18px',
            margin: '16px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, var(--cyan-500), var(--violet-500))', 
                color: 'white', 
                padding: '6px', 
                borderRadius: '8px' 
              }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cyan-400)', fontWeight: 700 }}>
                  AI Change Summary
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                  {diffData?.summary || 'Comparing baseline snapshots...'}
                </div>
              </div>
            </div>

            {/* Quick Diff Stats Pill */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ 
                background: 'rgba(16, 185, 129, 0.15)', 
                color: '#34d399', 
                padding: '4px 10px', 
                borderRadius: '6px', 
                fontSize: '12px',
                fontWeight: 600 
              }}>
                +{stats.addedLines} lines
              </span>
              <span style={{ 
                background: 'rgba(239, 68, 68, 0.15)', 
                color: '#f87171', 
                padding: '4px 10px', 
                borderRadius: '6px', 
                fontSize: '12px',
                fontWeight: 600 
              }}>
                -{stats.removedLines} lines
              </span>
              <span style={{ 
                background: 'rgba(255, 255, 255, 0.08)', 
                color: '#e2e8f0', 
                padding: '4px 10px', 
                borderRadius: '6px', 
                fontSize: '12px',
                fontWeight: 600 
              }}>
                {stats.changedPercent}% changed
              </span>
            </div>
          </div>

          {/* TAB 1: TEXT DIFF */}
          {activeTab === 'text' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
                <span>Line Diff View (Green = Added, Red = Removed)</span>
                <span>Algorithm: jsdiff Myers line & word parser</span>
              </div>
              <div className="diff-text-box">
                {diffData?.textDiff?.lineDiff?.map((part, idx) => {
                  if (part.added) {
                    return <span key={idx} className="diff-line-added">+ {part.value}</span>;
                  }
                  if (part.removed) {
                    return <span key={idx} className="diff-line-removed">- {part.value}</span>;
                  }
                  return <span key={idx} className="diff-line-normal">  {part.value}</span>;
                })}
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL SWIPE SLIDER */}
          {activeTab === 'slider' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
                <span>Drag the vertical cyan slider left/right to compare Base (Old) vs Target (New)</span>
                <span>Split Position: {sliderPos}%</span>
              </div>

              {snapshots.length < 2 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center', background: '#090d16', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ color: 'var(--cyan-400)', fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
                    Only 1 Snapshot Recorded (Baseline)
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: '13px', maxWidth: '440px', margin: '0 auto' }}>
                    A visual comparison requires at least two versions. Modify the target webpage (or use the Live Test Lab below) and trigger another check to compare screenshots.
                  </p>
                </div>
              ) : selectedA === selectedB ? (
                <div style={{ padding: '60px 24px', textAlign: 'center', background: '#090d16', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ color: 'var(--amber-400)', fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
                    Identical Version Selected
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: '13px', maxWidth: '440px', margin: '0 auto' }}>
                    Base Version and Target Version are the same. Please select two different versions from the dropdowns above to compare.
                  </p>
                </div>
              ) : (snapA?.screenshotSignedUrl || snapA?.screenshotUrl) && (snapB?.screenshotSignedUrl || snapB?.screenshotUrl) ? (
                <div 
                  className="visual-slider-container" 
                  ref={sliderRef}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                  onClick={handleSliderMove}
                >
                  {/* Base Screenshot (Before / Old) */}
                  <img 
                    src={snapA.screenshotSignedUrl || apiUrl(snapA.screenshotUrl)} 
                    alt="Base Version Screenshot" 
                    className="visual-image" 
                  />

                  {/* Target Screenshot (After / New) - Clipped via CSS clip-path */}
                  <img 
                    src={snapB.screenshotSignedUrl || apiUrl(snapB.screenshotUrl)} 
                    alt="Target Version Screenshot" 
                    className="visual-image"
                    style={{
                      clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                      WebkitClipPath: `inset(0 ${100 - sliderPos}% 0 0)`
                    }}
                  />

                  {/* Divider Line */}
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${sliderPos}%`,
                      width: '2px',
                      background: 'var(--cyan-400)',
                      boxShadow: '0 0 10px rgba(56, 189, 248, 0.9)',
                      pointerEvents: 'none',
                      zIndex: 8
                    }}
                  />

                  {/* Drag Handle */}
                  <div 
                    className="visual-slider-handle" 
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="visual-slider-button">
                      <SlidersHorizontal size={16} />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '60px 24px', textAlign: 'center', background: '#090d16', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>
                    Screenshots not available for one or both selected versions.
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                    Ensure the crawler is capturing screenshots or check Supabase Storage connection.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HIGHLIGHTED PIXEL DIFF OVERLAY */}
          {activeTab === 'highlight' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
                <span>Pixelmatch Diff Engine: Neon Magenta highlights represent visual change clusters</span>
                <span>Visual Difference: {diffData?.visualDiff?.diffPercentage || 0}% pixels</span>
              </div>

              {diffData?.visualDiff?.diffSignedUrl || diffData?.visualDiff?.diffImageUrl ? (
                <div style={{ 
                  borderRadius: '10px', 
                  overflow: 'hidden', 
                  border: '1px solid var(--border-subtle)', 
                  background: '#090d16',
                  textAlign: 'center',
                  padding: '10px'
                }}>
                  <img 
                    src={diffData.visualDiff.diffSignedUrl || apiUrl(diffData.visualDiff.diffImageUrl)} 
                    alt="Pixel Diff Highlight" 
                    style={{ maxHeight: '520px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px' }}
                  />
                </div>
              ) : (
                <div style={{ padding: '60px 24px', textAlign: 'center', background: '#090d16', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>
                    {snapshots.length < 2 
                      ? 'Pixel diff requires at least two snapshots to compare.' 
                      : 'Pixel diff image generating or screenshots not available.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: METRIC TREND CHART */}
          {activeTab === 'chart' && (() => {
            // Sort chronologically (oldest v1 on the left, newest on the right)
            const chronologicalSnaps = [...snapshots]
              .reverse()
              .map((s, i) => ({ ...s, versionNumber: i + 1 }));

            const metricSnaps = chronologicalSnaps.filter(
              s => typeof s.numberValue === 'number' && !isNaN(s.numberValue)
            );

            if (metricSnaps.length === 0) {
              return (
                <div style={{ padding: '60px 24px', textAlign: 'center', background: '#090d16', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                  <TrendingUp size={36} color="var(--accent-primary)" style={{ margin: '0 auto 12px' }} />
                  <div style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>
                    No Numeric Metric Data Recorded
                  </div>
                  <p style={{ color: 'var(--text-dim)', fontSize: '13px', maxWidth: '440px', margin: '0 auto' }}>
                    Enable <strong>"Number/Price Tracking"</strong> in monitor settings and trigger checks to record numeric changes (prices, inventory counts, or metric values) over time.
                  </p>
                </div>
              );
            }

            const values = metricSnaps.map(s => s.numberValue);
            const minVal = Math.min(...values);
            const maxVal = Math.max(...values);
            const valRange = maxVal - minVal;

            const baseSnap = snapshots.find(s => s.id === selectedB);
            const targetSnap = snapshots.find(s => s.id === selectedA);
            const baseVal = typeof baseSnap?.numberValue === 'number' ? baseSnap.numberValue : null;
            const targetVal = typeof targetSnap?.numberValue === 'number' ? targetSnap.numberValue : null;
            const hasDelta = baseVal !== null && targetVal !== null && baseSnap?.id !== targetSnap?.id;
            const diffVal = hasDelta ? targetVal - baseVal : null;
            const diffPct = hasDelta && baseVal !== 0 ? ((diffVal / baseVal) * 100).toFixed(1) : null;

            // Check if currency detected in text
            const isCurrency = metricSnaps.some(s => /[$€£¥]/.test(s.filteredText || s.rawText || s.textSnippet || ''));
            const formatMetric = (val) => isCurrency ? `$${Number(val).toFixed(2)}` : String(val);

            return (
              <div>
                {/* Metric Summary Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '14px', 
                  flexWrap: 'wrap', 
                  gap: '10px' 
                }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                      Metric Timeline ({metricSnaps.length} {metricSnaps.length === 1 ? 'record' : 'records'})
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)', marginLeft: '10px' }}>
                      Range: {formatMetric(minVal)} — {formatMetric(maxVal)}
                    </span>
                  </div>

                  {hasDelta && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: diffVal < 0 ? 'rgba(52, 211, 153, 0.1)' : diffVal > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                      border: `1px solid ${diffVal < 0 ? 'rgba(52, 211, 153, 0.3)' : diffVal > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(148, 163, 184, 0.3)'}`,
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: 'var(--text-dim)' }}>Base vs Target:</span>
                      <strong style={{ color: diffVal < 0 ? 'var(--emerald-400)' : diffVal > 0 ? 'var(--rose-400)' : 'var(--text-main)' }}>
                        {diffVal > 0 ? `+${formatMetric(diffVal)}` : formatMetric(diffVal)} ({diffPct > 0 ? `+${diffPct}%` : `${diffPct}%`})
                      </strong>
                    </div>
                  )}
                </div>

                {/* Trend Chart Area */}
                <div style={{ 
                  background: '#090d16', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '10px', 
                  padding: '28px 24px 20px',
                  minHeight: '260px',
                  position: 'relative'
                }}>
                  {/* Visual Chart Bars */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    gap: metricSnaps.length > 8 ? '8px' : '24px', 
                    height: '180px', 
                    paddingBottom: '26px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    {metricSnaps.map((s) => {
                      const isBase = s.id === selectedB;
                      const isTarget = s.id === selectedA;
                      const isSelected = isBase || isTarget;

                      const heightPercent = valRange === 0
                        ? 50
                        : Math.max(16, Math.min(100, Math.round(((s.numberValue - minVal) / valRange) * 80 + 18)));

                      return (
                        <div 
                          key={s.id} 
                          onClick={() => {
                            setSelectedA(s.id);
                          }}
                          style={{ 
                            flex: 1, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'transform 0.2s ease',
                            transform: isSelected ? 'scale(1.05)' : 'none'
                          }}
                          title={`Version v${s.versionNumber} • ${new Date(s.timestamp).toLocaleString()} • ${formatMetric(s.numberValue)}`}
                        >
                          {/* Value Tag */}
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: 700, 
                            color: isTarget ? 'var(--cyan-400)' : isBase ? 'var(--violet-400)' : 'var(--emerald-400)',
                            whiteSpace: 'nowrap'
                          }}>
                            {formatMetric(s.numberValue)}
                          </span>

                          {/* Bar */}
                          <div style={{ 
                            width: '100%', 
                            maxWidth: '44px', 
                            height: `${heightPercent}%`, 
                            background: isTarget
                              ? 'linear-gradient(180deg, var(--cyan-400), var(--cyan-600))'
                              : isBase
                                ? 'linear-gradient(180deg, var(--violet-400), var(--violet-600))'
                                : 'linear-gradient(180deg, rgba(56, 189, 248, 0.6), rgba(14, 165, 233, 0.2))', 
                            borderRadius: '5px 5px 0 0',
                            boxShadow: isSelected 
                              ? `0 0 12px ${isTarget ? 'rgba(56, 189, 248, 0.5)' : 'rgba(139, 92, 246, 0.5)'}` 
                              : 'none',
                            transition: 'all 0.3s ease'
                          }} />

                          {/* Version Label */}
                          <div style={{ textAlign: 'center', marginTop: '4px' }}>
                            <div style={{ 
                              fontSize: '11px', 
                              fontWeight: isSelected ? 700 : 500,
                              color: isTarget ? 'var(--cyan-400)' : isBase ? 'var(--violet-400)' : 'var(--text-muted)' 
                            }}>
                              v{s.versionNumber}
                            </div>
                            <div style={{ fontSize: '9.5px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                              {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chart Legend */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '20px', 
                    marginTop: '14px', 
                    fontSize: '11.5px', 
                    color: 'var(--text-dim)' 
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--violet-400)' }} />
                      Base Version (Old): v{baseSnap ? (snapshots.length - snapshots.indexOf(baseSnap)) : '?'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--cyan-400)' }} />
                      Target Version (New): v{targetSnap ? (snapshots.length - snapshots.indexOf(targetSnap)) : '?'}
                    </span>
                    <span style={{ color: 'var(--text-dim)' }}>
                      • Click any bar to select as Target
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
