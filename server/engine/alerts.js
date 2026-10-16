const db = require('../db');
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (_) {}

/**
 * Mask sensitive tokens in URLs for secure logging
 */
function maskSecretUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.pathname.includes('/bot')) {
      parsed.pathname = parsed.pathname.replace(/\/bot[^/]+/, '/bot[REDACTED]');
    }
    if (parsed.pathname.includes('/api/webhooks/')) {
      const parts = parsed.pathname.split('/');
      if (parts.length > 4) {
        parts[parts.length - 1] = '[REDACTED]';
        parsed.pathname = parts.join('/');
      }
    }
    return parsed.toString();
  } catch {
    return '[INVALID_URL]';
  }
}

/**
 * Send notification to Discord / Telegram / Slack / Generic webhook
 * Returns: { success: boolean, status: number, error?: string }
 */
async function sendWebhookAlert(webhookUrl, payload) {
  if (!webhookUrl || !webhookUrl.trim()) {
    return { success: false, error: 'Webhook URL is missing or empty' };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(webhookUrl.trim());
  } catch (err) {
    return { success: false, error: `Invalid webhook URL format: ${err.message}` };
  }

  try {
    const isDiscord = parsedUrl.hostname.includes('discord.com');
    const isTelegram = parsedUrl.hostname.includes('api.telegram.org') || parsedUrl.pathname.includes('/bot');
    const isSlack = parsedUrl.hostname.includes('hooks.slack.com');

    let bodyData;
    let targetUrl = webhookUrl.trim();

    if (isDiscord) {
      bodyData = {
        username: 'WatchTower Change Detector',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        embeds: [
          {
            title: `🔔 Change Detected: ${payload.monitorName}`,
            description: payload.summary,
            url: payload.pageUrl,
            color: 3447003, // Neon blue
            fields: [
              { 
                name: 'Diff Stats', 
                value: `+${payload.diffStats?.addedLines || 0} / -${payload.diffStats?.removedLines || 0} lines (${payload.diffStats?.changedPercent || 0}% changed)`, 
                inline: true 
              },
              { 
                name: 'Timestamp', 
                value: new Date(payload.timestamp).toLocaleString(), 
                inline: true 
              },
              { 
                name: 'Direct Diff Link', 
                value: `[View Full Diff & Timeline](${payload.diffLink})` 
              }
            ],
            footer: { text: 'WatchTower Website Change Detector' }
          }
        ]
      };
    } else if (isTelegram) {
      // Telegram Bot API requires chat_id and text
      // Supports chat_id in query param: https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>
      const chatId = parsedUrl.searchParams.get('chat_id') || payload.chatId || process.env.TELEGRAM_CHAT_ID;
      if (!chatId) {
        return {
          success: false,
          error: 'Telegram webhook missing chat_id. Append ?chat_id=<YOUR_CHAT_ID> to the Telegram webhook URL or set TELEGRAM_CHAT_ID.'
        };
      }

      // Remove chat_id from query params so it's sent cleanly in POST body
      parsedUrl.searchParams.delete('chat_id');
      targetUrl = parsedUrl.toString();

      const messageText = `<b>🔔 Website Change Detected: ${escapeHtml(payload.monitorName)}</b>\n\n` +
        `<b>Target:</b> <a href="${escapeHtml(payload.pageUrl)}">${escapeHtml(payload.pageUrl)}</a>\n` +
        `<b>Summary:</b> ${escapeHtml(payload.summary)}\n` +
        `<b>Diff:</b> +${payload.diffStats?.addedLines || 0} / -${payload.diffStats?.removedLines || 0} lines (${payload.diffStats?.changedPercent || 0}%)\n\n` +
        `<a href="${escapeHtml(payload.diffLink)}">👉 View Full Diff & Timeline</a>`;

      bodyData = {
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: false
      };
    } else if (isSlack) {
      bodyData = {
        text: `🔔 Change Detected: ${payload.monitorName}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*🔔 Change Detected: <${payload.pageUrl}|${payload.monitorName}>*\n${payload.summary}\n*Diff Stats:* +${payload.diffStats?.addedLines || 0} / -${payload.diffStats?.removedLines || 0} lines\n<${payload.diffLink}|View Full Diff & Timeline>`
            }
          }
        ]
      };
    } else {
      // Generic Webhook format (Zapier, Make, n8n, Custom webhook)
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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (res.ok) {
      console.log(`[WEBHOOK SUCCESS] Delivered alert to ${maskSecretUrl(webhookUrl)}`);
      return { success: true, status: res.status };
    } else {
      const errorText = await res.text().catch(() => '');
      const errMsg = `HTTP ${res.status} ${res.statusText}: ${errorText.slice(0, 160)}`;
      console.error(`[WEBHOOK ERROR] ${maskSecretUrl(webhookUrl)} -> ${errMsg}`);
      return { success: false, status: res.status, error: errMsg };
    }
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    const errMsg = isTimeout ? 'Webhook request timed out after 12s' : err.message;
    console.error(`[WEBHOOK EXCEPTION] ${maskSecretUrl(webhookUrl)}:`, errMsg);
    return { success: false, error: errMsg };
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Send real email alert using Resend API or SMTP
 * Returns: { success: boolean, provider?: string, error?: string }
 */
async function sendEmailAlert(email, payload) {
  if (!email || !email.trim()) {
    return { success: false, error: 'Recipient email is missing' };
  }

  const recipient = email.trim();
  const subject = `🔔 WatchTower Alert: ${payload.monitorName} Changed`;
  const plainText = `
=========================================
WATCHTOWER WEBSITE CHANGE DETECTOR ALERT
Target: ${payload.monitorName}
URL: ${payload.pageUrl}
=========================================

Summary of detected change:
${payload.summary}

Diff Statistics:
- Lines Added: +${payload.diffStats?.addedLines || 0}
- Lines Removed: -${payload.diffStats?.removedLines || 0}
- Changed: ${payload.diffStats?.changedPercent || 0}%

View Full Diff & Timeline:
${payload.diffLink}

Sent by WatchTower at ${new Date(payload.timestamp).toLocaleString()}
=========================================
`;

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
      <div style="border-bottom: 2px solid #38bdf8; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #38bdf8; font-size: 20px;">🔔 Change Detected: ${escapeHtml(payload.monitorName)}</h2>
        <a href="${escapeHtml(payload.pageUrl)}" style="color: #94a3b8; font-size: 13px; text-decoration: none;">${escapeHtml(payload.pageUrl)}</a>
      </div>
      
      <div style="background: #1e293b; padding: 16px; border-radius: 6px; border-left: 4px solid #38bdf8; margin-bottom: 20px;">
        <strong style="color: #38bdf8; font-size: 12px; text-transform: uppercase;">AI Change Summary:</strong>
        <p style="margin: 6px 0 0 0; font-size: 14px; color: #f1f5f9;">${escapeHtml(payload.summary)}</p>
      </div>

      <div style="background: #1e293b; padding: 14px; border-radius: 6px; font-size: 13px; margin-bottom: 20px;">
        <span style="color: #34d399; font-weight: bold; margin-right: 14px;">+${payload.diffStats?.addedLines || 0} lines</span>
        <span style="color: #f87171; font-weight: bold; margin-right: 14px;">-${payload.diffStats?.removedLines || 0} lines</span>
        <span style="color: #94a3b8;">${payload.diffStats?.changedPercent || 0}% content changed</span>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${escapeHtml(payload.diffLink)}" style="background: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
          View Full Diff & Screenshots
        </a>
      </div>

      <div style="font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 12px;">
        WatchTower Autonomous Website Change Detector • ${new Date(payload.timestamp).toUTCString()}
      </div>
    </div>
  `;

  // 1. Transactional Provider: Resend (Recommended, zero extra dependencies)
  if (process.env.RESEND_API_KEY) {
    try {
      const fromEmail = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'WatchTower <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipient],
          subject,
          text: plainText,
          html: htmlContent
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`[RESEND SUCCESS] Email sent to ${recipient} (id: ${data.id})`);
        return { success: true, provider: 'resend', id: data.id };
      } else {
        const errMsg = data.message || `HTTP ${res.status}`;
        console.error(`[RESEND ERROR] Failed sending to ${recipient}: ${errMsg}`);
        return { success: false, provider: 'resend', error: errMsg };
      }
    } catch (err) {
      console.error(`[RESEND EXCEPTION] Failed sending to ${recipient}:`, err.message);
      return { success: false, provider: 'resend', error: err.message };
    }
  }

  // 2. Standard SMTP Provider (nodemailer)
  if (process.env.SMTP_HOST && nodemailer) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER;
      const info = await transporter.sendMail({
        from: fromAddress,
        to: recipient,
        subject,
        text: plainText,
        html: htmlContent
      });

      console.log(`[SMTP SUCCESS] Email sent to ${recipient} (id: ${info.messageId})`);
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error(`[SMTP ERROR] Failed sending to ${recipient}:`, err.message);
      return { success: false, provider: 'smtp', error: err.message };
    }
  }

  // 3. Fallback: Unconfigured
  const errMsg = 'Email delivery unconfigured. To enable real email delivery, configure RESEND_API_KEY or SMTP_HOST in server environment variables.';
  console.warn(`[EMAIL UNCONFIGURED] ${errMsg}`);
  return { success: false, error: errMsg, unconfigured: true };
}

/**
 * Trigger alerts for a monitor update with deduplication & provider isolation
 */
async function dispatchAlerts(monitor, snapshot, diffStats) {
  const dedupeKey = `${monitor.id}-${snapshot.contentHash}`;

  // Core Requirement 7: "no duplicates"
  if (db.hasAlertForDedupe(dedupeKey)) {
    console.log(`[ALERT DEDUPE] Alert already sent for ${monitor.name} (hash ${snapshot.contentHash.slice(0, 8)}). Skipping.`);
    return { deduplicated: true };
  }

  const frontendBase = process.env.FRONTEND_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://watchtower-website-change-detector.vercel.app');
  const diffLink = `${frontendBase}/?monitor=${monitor.id}&view=diff&snap=${snapshot.id}`;

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
  let webhookResult = null;
  let emailResult = null;

  // Provider isolation: One failed provider NEVER prevents other providers from running
  if (monitor.alertWebhook) {
    try {
      webhookResult = await sendWebhookAlert(monitor.alertWebhook, payload);
      webhookSuccess = Boolean(webhookResult?.success);
      db.addAlert({
        monitorId: monitor.id,
        channel: 'webhook',
        title: `Webhook: ${monitor.name}`,
        summary: snapshot.summary,
        dedupeKey,
        sentSuccessfully: webhookSuccess,
        details: webhookResult?.error || (webhookSuccess ? 'Delivered' : 'Delivery failed')
      });
    } catch (whErr) {
      console.error(`[ALERT DISPATCH ERROR] Webhook failed for ${monitor.name}:`, whErr.message);
      db.addAlert({
        monitorId: monitor.id,
        channel: 'webhook',
        title: `Webhook: ${monitor.name}`,
        summary: snapshot.summary,
        dedupeKey,
        sentSuccessfully: false,
        details: whErr.message
      });
    }
  }

  if (monitor.alertEmail) {
    try {
      emailResult = await sendEmailAlert(monitor.alertEmail, payload);
      emailSuccess = Boolean(emailResult?.success);
      db.addAlert({
        monitorId: monitor.id,
        channel: 'email',
        title: `Email to ${monitor.alertEmail}`,
        summary: snapshot.summary,
        dedupeKey,
        sentSuccessfully: emailSuccess,
        details: emailResult?.error || (emailSuccess ? 'Delivered' : 'Delivery unconfigured or failed')
      });
    } catch (emErr) {
      console.error(`[ALERT DISPATCH ERROR] Email failed for ${monitor.name}:`, emErr.message);
      db.addAlert({
        monitorId: monitor.id,
        channel: 'email',
        title: `Email to ${monitor.alertEmail}`,
        summary: snapshot.summary,
        dedupeKey,
        sentSuccessfully: false,
        details: emErr.message
      });
    }
  }

  return { 
    deduplicated: false, 
    webhookSuccess, 
    emailSuccess,
    webhookResult,
    emailResult
  };
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

