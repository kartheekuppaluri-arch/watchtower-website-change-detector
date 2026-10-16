const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = process.env.DATA_DIR || process.env.PERSISTENT_DATA_DIR || (isVercel ? path.join('/tmp', 'data') : path.join(__dirname, '..', 'data'));
const DB_PATH = path.join(DATA_DIR, 'db.json');

const defaultDb = {
  monitors: [
    {
      id: 'monitor-store-demo',
      name: 'TechGadget Headphones (Price & Stock)',
      url: '/mock/store',
      intervalMinutes: 15,
      watchSelector: '#product-details',
      ignoreSelectors: ['.live-viewers-count', '.promo-ticker'],
      sensitivity: 'medium', // 'high' (1%), 'medium' (5%), 'low' (15%)
      noiseFilterActive: true,
      customRegex: '',
      keywordAlerts: ['Price', 'In Stock', 'Out of Stock'],
      numberTracking: true,
      alertEmail: 'user@example.com',
      alertWebhook: 'https://discord.com/api/webhooks/demo/change-alert',
      status: 'OK', // 'OK', 'CHANGED', 'ERROR', 'BLOCKED', 'PAUSED'
      lastChecked: null,
      lastChanged: null,
      lastError: null,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'monitor-news-demo',
      name: 'Global Tech News Portal',
      url: '/mock/news',
      intervalMinutes: 30,
      watchSelector: 'main article',
      ignoreSelectors: ['#live-clock', '.ad-banner', '.view-counter'],
      sensitivity: 'medium',
      noiseFilterActive: true,
      customRegex: '\\d{1,2}:\\d{2}:\\d{2}\\s*(?:AM|PM)',
      keywordAlerts: ['Breaking', 'AI', 'Launch'],
      numberTracking: false,
      alertEmail: 'editor@example.com',
      alertWebhook: '',
      status: 'OK',
      lastChecked: null,
      lastChanged: null,
      lastError: null,
      active: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'monitor-status-demo',
      name: 'Cloud Infrastructure Status',
      url: '/mock/status',
      intervalMinutes: 60,
      watchSelector: '#status-board',
      ignoreSelectors: [],
      sensitivity: 'high',
      noiseFilterActive: true,
      customRegex: '',
      keywordAlerts: ['Degraded', 'Outage', 'Operational'],
      numberTracking: false,
      alertEmail: 'devops@example.com',
      alertWebhook: 'https://discord.com/api/webhooks/demo/ops-alerts',
      status: 'OK',
      lastChecked: null,
      lastChanged: null,
      lastError: null,
      active: true,
      createdAt: new Date().toISOString()
    }
  ],
  snapshots: [],
  incidents: [],
  alerts: []
};

class Database {
  constructor() {
    // In-memory cache ensures that operations never fail on serverless or read-only filesystems
    this.memoryDb = JSON.parse(JSON.stringify(defaultDb));
    this.init();
  }

  init() {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf-8');
      } else {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        this.memoryDb = JSON.parse(fileContent);
      }
    } catch (e) {
      console.warn('[DB] Filesystem init note (using in-memory fallback):', e.message);
    }
  }

  read() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        this.memoryDb = JSON.parse(data);
      }
    } catch (e) {
      // Fallback silently to in-memory store
    }
    return this.memoryDb || defaultDb;
  }

  write(data) {
    this.memoryDb = data;
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('[DB] Filesystem write skipped (running in-memory):', e.message);
    }
  }

  // --- Monitors ---
  getMonitors() {
    const db = this.read();
    return db.monitors || [];
  }

  getMonitor(id) {
    const db = this.read();
    return (db.monitors || []).find(m => m.id === id);
  }

  createMonitor(monitor) {
    const db = this.read();
    const newMonitor = {
      id: monitor.id || `mon-${uuidv4().slice(0, 8)}`,
      name: monitor.name || 'Untitled Monitor',
      url: monitor.url,
      intervalMinutes: Number(monitor.intervalMinutes) || 15,
      watchSelector: monitor.watchSelector || '',
      ignoreSelectors: Array.isArray(monitor.ignoreSelectors) ? monitor.ignoreSelectors : [],
      sensitivity: monitor.sensitivity || 'medium',
      noiseFilterActive: monitor.noiseFilterActive !== false,
      customRegex: monitor.customRegex || '',
      keywordAlerts: Array.isArray(monitor.keywordAlerts) ? monitor.keywordAlerts : [],
      numberTracking: Boolean(monitor.numberTracking),
      alertEmail: monitor.alertEmail || '',
      alertWebhook: monitor.alertWebhook || '',
      status: 'OK',
      lastChecked: null,
      lastChanged: null,
      lastError: null,
      active: monitor.active !== false,
      createdAt: new Date().toISOString()
    };
    db.monitors.push(newMonitor);
    this.write(db);
    return newMonitor;
  }

  updateMonitor(id, updates) {
    const db = this.read();
    const index = db.monitors.findIndex(m => m.id === id);
    if (index === -1) return null;
    db.monitors[index] = { ...db.monitors[index], ...updates };
    this.write(db);
    return db.monitors[index];
  }

  deleteMonitor(id) {
    const db = this.read();
    db.monitors = db.monitors.filter(m => m.id !== id);
    db.snapshots = db.snapshots.filter(s => s.monitorId !== id);
    db.incidents = db.incidents.filter(i => i.monitorId !== id);
    db.alerts = db.alerts.filter(a => a.monitorId !== id);
    this.write(db);
    return true;
  }

  // --- Snapshots ---
  getSnapshots(monitorId) {
    const db = this.read();
    const list = db.snapshots || [];
    if (!monitorId) return list;
    return list.filter(s => s.monitorId === monitorId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getSnapshot(id) {
    const db = this.read();
    return (db.snapshots || []).find(s => s.id === id);
  }

  getLatestSnapshot(monitorId) {
    const list = this.getSnapshots(monitorId);
    return list.length > 0 ? list[0] : null;
  }

  addSnapshot(snapshot) {
    const db = this.read();
    const newSnapshot = {
      id: snapshot.id || `snap-${uuidv4().slice(0, 8)}`,
      monitorId: snapshot.monitorId,
      timestamp: snapshot.timestamp || new Date().toISOString(),
      contentHash: snapshot.contentHash,
      textLength: snapshot.textLength || 0,
      textSnippet: snapshot.textSnippet || '',
      rawText: snapshot.rawText || '',
      filteredText: snapshot.filteredText || '',
      screenshotUrl: snapshot.screenshotUrl || '',
      diffStats: snapshot.diffStats || { addedLines: 0, removedLines: 0, changedPercent: 0 },
      summary: snapshot.summary || 'Initial snapshot recorded',
      numberValue: snapshot.numberValue !== undefined ? snapshot.numberValue : null
    };
    db.snapshots.push(newSnapshot);
    // Keep max 50 snapshots per monitor to avoid bloated files
    const monitorSnapshots = db.snapshots.filter(s => s.monitorId === snapshot.monitorId);
    if (monitorSnapshots.length > 50) {
      const oldestId = monitorSnapshots.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0].id;
      db.snapshots = db.snapshots.filter(s => s.id !== oldestId);
    }
    this.write(db);
    return newSnapshot;
  }

  // --- Incidents (Outages, CAPTCHA, 403, 503) ---
  addIncident(incident) {
    const db = this.read();
    const newIncident = {
      id: `inc-${uuidv4().slice(0, 8)}`,
      monitorId: incident.monitorId,
      timestamp: new Date().toISOString(),
      type: incident.type, // 'OUTAGE', 'CAPTCHA', 'BLOCKED', 'TIMEOUT'
      message: incident.message,
      httpStatus: incident.httpStatus || 0
    };
    db.incidents.push(newIncident);
    this.write(db);
    return newIncident;
  }

  getIncidents(monitorId) {
    const db = this.read();
    const list = db.incidents || [];
    if (!monitorId) return list;
    return list.filter(i => i.monitorId === monitorId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // --- Alerts ---
  addAlert(alert) {
    const db = this.read();
    const newAlert = {
      id: `alt-${uuidv4().slice(0, 8)}`,
      monitorId: alert.monitorId,
      timestamp: new Date().toISOString(),
      channel: alert.channel, // 'webhook', 'email'
      title: alert.title,
      summary: alert.summary,
      dedupeKey: alert.dedupeKey,
      sentSuccessfully: alert.sentSuccessfully !== false,
      details: alert.details || null
    };
    db.alerts.push(newAlert);
    this.write(db);
    return newAlert;
  }

  hasAlertForDedupe(dedupeKey) {
    const db = this.read();
    return (db.alerts || []).some(a => a.dedupeKey === dedupeKey);
  }

  getAlerts(limit = 20) {
    const db = this.read();
    return (db.alerts || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }
}

module.exports = new Database();
