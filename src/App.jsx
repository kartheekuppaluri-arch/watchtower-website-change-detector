import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MonitorCard from './components/MonitorCard';
import AddMonitorModal from './components/AddMonitorModal';
import VisualPickerModal from './components/VisualPickerModal';
import DiffModal from './components/DiffModal';
import TimelineModal from './components/TimelineModal';
import ArchitecturalQnModal from './components/ArchitecturalQnModal';
import AlertSettingsModal from './components/AlertSettingsModal';
import TestStudio from './components/TestStudio';
import { Plus, Globe, RefreshCw } from 'lucide-react';

export default function App() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [testStudioOpen, setTestStudioOpen] = useState(true); // Open by default for instant testing

  // Modals
  const [activeModal, setActiveModal] = useState(null); // 'add', 'diff', 'picker', 'timeline', 'faq', 'alerts', 'digest'
  const [selectedMonitor, setSelectedMonitor] = useState(null);

  // Fetch monitors
  const loadMonitors = () => {
    return fetch('/api/monitors')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        if (data && Array.isArray(data.monitors)) {
          setMonitors(data.monitors);
        }
      })
      .catch(err => console.error('Failed to load monitors:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMonitors();
    // Poll every 15 seconds to reflect background checks
    const interval = setInterval(loadMonitors, 15000);
    return () => clearInterval(interval);
  }, []);

  // Check single monitor
  const handleCheckNow = async (monitorId) => {
    try {
      const res = await fetch(`/api/monitors/${monitorId}/check`, { method: 'POST' });
      const data = await res.json();
      await loadMonitors();
      return data;
    } catch (e) {
      console.error('Check failed:', e);
    }
  };

  // Run all checks
  const handleRunAll = async () => {
    setIsRunningAll(true);
    try {
      await fetch('/api/monitors/check-all', { method: 'POST' });
      await loadMonitors();
    } catch (e) {
      console.error('Run all failed:', e);
    } finally {
      setIsRunningAll(false);
    }
  };

  // Save monitor (create or update)
  const handleSaveMonitor = async (data) => {
    if (selectedMonitor) {
      // Update
      await fetch(`/api/monitors/${selectedMonitor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } else {
      // Create
      await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    await loadMonitors();
  };

  // Delete monitor
  const handleDeleteMonitor = async (id) => {
    if (!window.confirm('Are you sure you want to delete this monitor?')) return;
    await fetch(`/api/monitors/${id}`, { method: 'DELETE' });
    await loadMonitors();
  };

  // Open modals helper
  const openModal = (type, monitor = null) => {
    setSelectedMonitor(monitor);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedMonitor(null);
  };

  return (
    <div className="app-container">
      {/* Top Header & Metrics */}
      <Header 
        monitors={monitors}
        onAddMonitor={() => openModal('add')}
        onRunAllChecks={handleRunAll}
        isRunningAll={isRunningAll}
        onOpenFaq={() => openModal('faq')}
        onOpenDigest={() => openModal('digest')}
        onOpenAlerts={() => openModal('alerts')}
        testStudioOpen={testStudioOpen}
        setTestStudioOpen={setTestStudioOpen}
      />

      {/* Main Content Area */}
      <main style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', color: '#f8fafc' }}>
              Monitored Target Pages
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              Headless browser rendering with SHA-256 content hashes, visual diffs and noise filters
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={loadMonitors}>
              <RefreshCw size={12} /> Refresh Grid
            </button>
          </div>
        </div>

        {/* Monitors Grid */}
        <div className="monitors-grid">
          {monitors.map(m => (
            <MonitorCard 
              key={m.id}
              monitor={m}
              onCheckNow={handleCheckNow}
              onOpenDiff={(mon) => openModal('diff', mon)}
              onOpenTimeline={(mon) => openModal('timeline', mon)}
              onOpenVisualPicker={(mon) => openModal('picker', mon)}
              onEdit={(mon) => openModal('add', mon)}
              onDelete={handleDeleteMonitor}
            />
          ))}
        </div>

        {/* Empty State */}
        {monitors.length === 0 && !loading && (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
            <Globe size={48} color="var(--cyan-400)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No Monitors Configured</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px', maxWidth: '420px', margin: '0 auto 18px' }}>
              Add a target website URL to begin automated change detection, noise scrubbing, and alert delivery.
            </p>
            <button className="btn btn-primary" onClick={() => openModal('add')}>
              <Plus size={16} /> Create Your First Monitor
            </button>
          </div>
        )}

        {/* Interactive Testing Studio Drawer / Section */}
        {testStudioOpen && (
          <TestStudio 
            monitors={monitors} 
            onCheckNow={handleCheckNow} 
          />
        )}
      </main>

      {/* MODALS */}
      {activeModal === 'add' && (
        <AddMonitorModal 
          monitor={selectedMonitor}
          onClose={closeModal}
          onSave={handleSaveMonitor}
        />
      )}

      {activeModal === 'picker' && selectedMonitor && (
        <VisualPickerModal 
          monitor={selectedMonitor}
          onClose={closeModal}
          onSave={async (patch) => {
            await fetch(`/api/monitors/${selectedMonitor.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(patch)
            });
            await loadMonitors();
          }}
        />
      )}

      {activeModal === 'diff' && selectedMonitor && (
        <DiffModal 
          monitor={selectedMonitor}
          onClose={closeModal}
        />
      )}

      {activeModal === 'timeline' && selectedMonitor && (
        <TimelineModal 
          monitor={selectedMonitor}
          onClose={closeModal}
          onOpenDiff={(mon) => openModal('diff', mon)}
        />
      )}

      {activeModal === 'faq' && (
        <ArchitecturalQnModal 
          onClose={closeModal}
        />
      )}

      {activeModal === 'alerts' && (
        <AlertSettingsModal 
          defaultTab="alerts"
          onClose={closeModal}
        />
      )}

      {activeModal === 'digest' && (
        <AlertSettingsModal 
          defaultTab="digest"
          onClose={closeModal}
        />
      )}
    </div>
  );
}
