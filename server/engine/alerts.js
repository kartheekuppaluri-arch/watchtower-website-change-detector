const db = require('../db');

/**
 * Send notification to Discord / Telegram webhook
 */
async function sendWebhookAlert(webhookUrl, payload) {
  if (!webhookUrl || !webhookUrl.trim()) return false;

  try {
    const isDiscord = webhookUrl.includes('discord.com/api/webhooks');
    let bodyData;

    if (isDiscord) {
      bodyData = {
        username: 'Website Change Detector',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        embeds: [
          {
            title: `🔔 Change Detected: ${payload.monitorName}`,
            description: payload.summary,
            url: payload.pageUrl,
            color: 3447003, // Neon blue
            fields: [
              { name: 'Diff Stats', value: `+${payload.diffStats?.addedLines || 0} / -${payload.diffStats?.removedLines || 0} lines (${payload.diffStats?.changedPercent || 0}% changed)`, inline: true },
              { name: 'Timestamp', value: new Date(payload.timestamp).toLocaleString(), inline: true },
              { name: 'Direct Diff Link', value: `[View Full Diff & Timeline](${payload.diffLink})` }
            ],
            footer: { text: 'Website Change Detector Alert Engine' }
          }
        ]
      };
    } else {
      // Generic Webhook format (Telegram / Slack / Custom)
      bodyData = {
        event: 'WEBSITE_CHANGE_DETECTED',
        monitorId: payload.monitorId,
        monitorName: payload.monitorName,
        pageUrl: payload.pageUrl,
        summary: payload.summary,
        diffStats: payload.diffStats,
        diffLink: payload.diffLink,
        timestamp: payload.timestamp
      };
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    return res.ok;
  } catch (err) {
    console.error('Webhook dispatch failed:', err.message);
    return false;
  }
}

/**
 * Format and simulate sending an email alert
 */
function sendEmailAlert(email, payload) {
  if (!email || !email.trim()) return false;

  const emailContent = `
=========================================
WEBSITE CHANGE ALERT: ${payload.monitorName}
URL: ${payload.pageUrl}
=========================================
SUMMARY: ${payload.summary}

DIFF STATS:
- Added Lines: ${payload.diffStats?.addedLines || 0}
- Removed Lines: ${payload.diffStats?.removedLines || 0}
- Change Percentage: ${payload.diffStats?.changedPercent || 0}%

View Full Diff & Screenshots:
${payload.diffLink}

Sent at: ${new Date(payload.timestamp).toLocaleString()}
=========================================
`;

  console.log(`[EMAIL SIMULATOR -> ${email}]`, emailContent);
  return true;
}

/**
 * Trigger alerts for a monitor update with deduplication
 */
async function dispatchAlerts(monitor, snapshot, diffStats) {
  const dedupeKey = `${monitor.id}-${snapshot.contentHash}`;

  // Core Requirement 7: "no duplicates"
  if (db.hasAlertForDedupe(dedupeKey)) {
    console.log(`[ALERT DEDUPE] Alert already sent for ${monitor.name} (hash ${snapshot.contentHash.slice(0, 8)}). Skipping.`);
    return { deduplicated: true };
  }

  const diffLink = `http://localhost:5173/?monitor=${monitor.id}&view=diff&snap=${snapshot.id}`;

  const payload = {
    monitorId: monitor.id,
    monitorName: monitor.name,
    pageUrl: monitor.url,
    summary: snapshot.summary,
    diffStats,
    diffLink,
    timestamp: snapshot.timestamp
  };

  let webhookSuccess = false;
  let emailSuccess = false;

  if (monitor.alertWebhook) {
    webhookSuccess = await sendWebhookAlert(monitor.alertWebhook, payload);
    db.addAlert({
      monitorId: monitor.id,
      channel: 'webhook',
      title: `Webhook: ${monitor.name}`,
      summary: snapshot.summary,
      dedupeKey,
      sentSuccessfully: webhookSuccess
    });
  }

  if (monitor.alertEmail) {
    emailSuccess = sendEmailAlert(monitor.alertEmail, payload);
    db.addAlert({
      monitorId: monitor.id,
      channel: 'email',
      title: `Email to ${monitor.alertEmail}`,
      summary: snapshot.summary,
      dedupeKey,
      sentSuccessfully: emailSuccess
    });
  }

  return { deduplicated: false, webhookSuccess, emailSuccess };
}

/**
 * Compile Daily Digest
 * Core Requirement 7: "optional daily digest"
 */
function generateDailyDigest() {
  const monitors = db.getMonitors();
  const allSnapshots = db.getSnapshots();
  const now = Date.now();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const recentSnapshots = allSnapshots.filter(s => s.timestamp >= oneDayAgo);
  const incidents = db.getIncidents().filter(i => i.timestamp >= oneDayAgo);

  const digestItems = monitors.map(m => {
    const changes = recentSnapshots.filter(s => s.monitorId === m.id);
    const mIncidents = incidents.filter(i => i.monitorId === m.id);
    return {
      monitorId: m.id,
      monitorName: m.name,
      url: m.url,
      changesCount: changes.length,
      lastSummary: changes[0]?.summary || 'No changes in past 24 hours',
      incidentsCount: mIncidents.length,
      status: m.status
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totalMonitors: monitors.length,
    totalChanges24h: recentSnapshots.length,
    totalIncidents24h: incidents.length,
    items: digestItems
  };
}

module.exports = {
  sendWebhookAlert,
  sendEmailAlert,
  dispatchAlerts,
  generateDailyDigest
};
