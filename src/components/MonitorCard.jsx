import React, { useState } from 'react';
import { 
  ExternalLink, 
  Play, 
  Eye, 
  History, 
  Rss, 
  Edit2, 
  Trash2, 
  Crosshair, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Tag 
} from 'lucide-react';

export default function MonitorCard({ 
  monitor, 
  onCheckNow, 
  onOpenDiff, 
  onOpenTimeline, 
  onOpenVisualPicker, 
  onEdit, 
  onDelete 
}) {
  const [isChecking, setIsChecking] = useState(false);

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      await onCheckNow(monitor.id);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CHANGED':
        return <span className="status-badge changed"><span className="status-dot"></span> Changed</span>;
      case 'ERROR':
        return <span className="status-badge error"><span className="status-dot"></span> Error</span>;
      case 'BLOCKED':
        return <span className="status-badge blocked"><span className="status-dot"></span> Captcha / Blocked</span>;
      case 'PAUSED':
        return <span className="status-badge paused"><span className="status-dot"></span> Paused</span>;
      default:
        return <span className="status-badge ok"><span className="status-dot"></span> OK (Watching)</span>;
    }
  };

  const latestSnap = monitor.latestSnapshot;
  const lastCheckedText = monitor.lastChecked 
    ? new Date(monitor.lastChecked).toLocaleTimeString() 
    : 'Never';

  const lastChangedText = monitor.lastChanged
    ? new Date(monitor.lastChanged).toLocaleTimeString()
    : 'Never';

  return (
    <div className="glass-panel monitor-card">
      <div>
        <div className="monitor-top">
          <div>
            <div className="monitor-name">{monitor.name}</div>
            <a 
              href={monitor.url} 
              target="_blank" 
              rel="noreferrer" 
              className="monitor-url"
              title={monitor.url}
            >
              {monitor.url.replace(/^https?:\/\//, '').slice(0, 42)}
              {monitor.url.length > 45 ? '...' : ''}
              <ExternalLink size={12} />
            </a>
          </div>
          <div>{getStatusBadge(monitor.status)}</div>
        </div>

        {/* Region Tags */}
        <div className="tags-row">
          {monitor.watchSelector ? (
            <span className="tag-badge watch" title="Watched CSS Selector">
              <Crosshair size={11} /> Watch: {monitor.watchSelector}
            </span>
          ) : (
            <span className="tag-badge" title="Watching entire page">
              <Eye size={11} /> Full Page
            </span>
          )}

          {monitor.ignoreSelectors && monitor.ignoreSelectors.length > 0 && (
            <span className="tag-badge ignore" title={`${monitor.ignoreSelectors.length} Ignore Selectors active`}>
              Ignore ({monitor.ignoreSelectors.length})
            </span>
          )}

          <span className="tag-badge" title="Diff Sensitivity">
            Sensitivity: {monitor.sensitivity}
          </span>

          {monitor.numberTracking && latestSnap?.numberValue !== null && latestSnap?.numberValue !== undefined && (
            <span className="tag-badge" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
              Metric: ${latestSnap.numberValue}
            </span>
          )}
        </div>

        {/* Latest AI Summary Snippet */}
        {latestSnap ? (
          <div className="summary-box">
            <span className="summary-badge">
              <Sparkles size={10} style={{ display: 'inline', marginRight: 3 }} /> AI Summary
            </span>
            <div style={{ flex: 1 }}>
              {latestSnap.summary || 'Initial snapshot established.'}
            </div>
          </div>
        ) : (
          <div className="summary-box" style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
            No snapshots captured yet. Click "Check Now" to capture initial baseline.
          </div>
        )}

        {/* Error notification if blocked or outage */}
        {monitor.lastError && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '6px', 
            padding: '8px 12px', 
            fontSize: '12px', 
            color: '#fca5a5', 
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <ShieldAlert size={14} style={{ flexShrink: 0 }} />
            <span>{monitor.lastError}</span>
          </div>
        )}
      </div>

      <div>
        {/* Metadata info */}
        <div className="monitor-meta">
          <div>
            <span>Checked: <strong>{lastCheckedText}</strong></span> • <span>Changed: <strong>{lastChangedText}</strong></span>
          </div>
          <div>
            <span>Every <strong>{monitor.intervalMinutes}m</strong></span> | <span><strong>{monitor.snapshotCount || 0}</strong> versions</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="monitor-actions">
          <button 
            className="btn btn-primary btn-sm" 
            onClick={handleCheck} 
            disabled={isChecking}
          >
            <Play size={12} />
            {isChecking ? 'Checking...' : 'Check Now'}
          </button>

          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => onOpenDiff(monitor)}
            disabled={!monitor.snapshotCount || monitor.snapshotCount < 1}
            title="Compare versions & visual diffs"
          >
            <Eye size={12} />
            Diff & Compare
          </button>

          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => onOpenVisualPicker(monitor)}
            title="Point-and-click to select watch & ignore regions"
          >
            <Crosshair size={12} />
            Visual Picker
          </button>

          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => onOpenTimeline(monitor)}
            title="Version timeline history"
          >
            <History size={12} />
            Timeline
          </button>

          <a 
            href={`/api/monitors/${monitor.id}/rss`} 
            target="_blank" 
            rel="noreferrer" 
            className="btn btn-secondary btn-sm"
            title="Per-page RSS Feed"
          >
            <Rss size={12} />
            RSS
          </a>

          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => onEdit(monitor)} 
            title="Edit settings"
          >
            <Edit2 size={12} />
          </button>

          <button 
            className="btn btn-danger-outline btn-sm" 
            onClick={() => onDelete(monitor.id)} 
            title="Delete monitor"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
