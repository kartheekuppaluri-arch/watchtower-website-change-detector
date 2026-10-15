import React from 'react';
import { 
  X, 
  HelpCircle, 
  ShieldAlert, 
  Layers, 
  Sliders, 
  Clock, 
  CheckCircle2, 
  Code 
} from 'lucide-react';

export default function ArchitecturalQnModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--cyan-500)', padding: '6px', borderRadius: '8px', color: 'white' }}>
              <HelpCircle size={18} />
            </div>
            <div>
              <div className="modal-title">Core Architecture & Design Decisions</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Engineering solutions for the 4 core system design questions
              </div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Question 1 */}
          <div style={{ 
            background: '#131c2e', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            borderRadius: '12px', 
            padding: '18px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <ShieldAlert size={20} color="var(--rose-400)" />
              <h3 style={{ fontSize: '16px', color: '#f8fafc' }}>
                1. Is a site outage or CAPTCHA a change?
              </h3>
            </div>
            <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
              <p><strong>Answer: Absolutely NOT.</strong> Treating an outage (503/500/timeout) or a Cloudflare/Turnstile/reCAPTCHA challenge screen as a page change causes disastrous false positive alerts and corrupts clean baseline snapshots.</p>
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '12px', 
                borderRadius: '8px', 
                marginTop: '10px',
                borderLeft: '3px solid var(--rose-400)' 
              }}>
                <span style={{ fontWeight: 600, color: 'var(--rose-400)' }}>WatchTower Implementation:</span>
                <ul style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '12.5px' }}>
                  <li>Our crawler runs <code>inspectForOutageOrCaptcha(status, html)</code> before processing DOM.</li>
                  <li>HTTP 5xx and connection timeouts are classified as <code>OUTAGE</code> incidents.</li>
                  <li>Challenge indicators (<code>cf-browser-verification</code>, Turnstile, 403 blocks) are classified as <code>CAPTCHA / BLOCKED</code>.</li>
                  <li><strong>Zero dirty snapshots are stored</strong> and content change alerts are suppressed. The monitor enters an <code>ERROR</code> or <code>BLOCKED</code> state with an incident logged.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Question 2 */}
          <div style={{ 
            background: '#131c2e', 
            border: '1px solid rgba(14, 165, 233, 0.3)', 
            borderRadius: '12px', 
            padding: '18px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Layers size={20} color="var(--cyan-400)" />
              <h3 style={{ fontSize: '16px', color: '#f8fafc' }}>
                2. If 200 users watch the same URL, is it fetched 200 times?
              </h3>
            </div>
            <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
              <p><strong>Answer: No, it is fetched ONCE via Shared Request Coalescing.</strong></p>
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '12px', 
                borderRadius: '8px', 
                marginTop: '10px',
                borderLeft: '3px solid var(--cyan-400)' 
              }}>
                <span style={{ fontWeight: 600, color: 'var(--cyan-400)' }}>WatchTower Implementation:</span>
                <ul style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '12.5px' }}>
                  <li>The scheduler implements <code>FetchDeduplicator</code>.</li>
                  <li>When 200 users trigger checks for <code>https://target.com/page</code>, the worker launches a single headless browser crawl job and stores the in-flight Promise in a deduplication map.</li>
                  <li>All 200 subscriptions await the same render promise, sharing the single network round-trip and screenshot.</li>
                  <li>Each user's specific CSS watch/ignore selector filters are subsequently evaluated in-memory from the single rendered DOM.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Question 3 */}
          <div style={{ 
            background: '#131c2e', 
            border: '1px solid rgba(245, 158, 11, 0.3)', 
            borderRadius: '12px', 
            padding: '18px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Sliders size={20} color="var(--amber-400)" />
              <h3 style={{ fontSize: '16px', color: '#f8fafc' }}>
                3. How to avoid endless alerts on pages that differ on every load?
              </h3>
            </div>
            <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
              <p><strong>Answer: A 4-Layer Noise Scrubbing & Sensitivity Hierarchy.</strong></p>
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '12px', 
                borderRadius: '8px', 
                marginTop: '10px',
                borderLeft: '3px solid var(--amber-400)' 
              }}>
                <span style={{ fontWeight: 600, color: 'var(--amber-400)' }}>WatchTower Implementation:</span>
                <ul style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '12.5px' }}>
                  <li><strong>Layer 1 (Ignore CSS Selectors):</strong> Strips headers, footers, live clocks (<code>#live-clock</code>), rotating ads (<code>.ad-banner</code>), and view counters before text extraction.</li>
                  <li><strong>Layer 2 (Regex Scrubbing):</strong> Strips ISO timestamps, 12h/24h clocks, relative dates ("5 mins ago"), CSRF tokens, session IDs, and user custom regexes.</li>
                  <li><strong>Layer 3 (Similarity Thresholding):</strong> Word-level Jaccard similarity gating (High: 0.5%, Medium: 4%, Low: 15%). Changes below the threshold are discarded as noise.</li>
                  <li><strong>Layer 4 (Alert Deduplication):</strong> Keyed by <code>monitorId-contentHash</code> ensuring no duplicate alerts ever fire for identical states.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Question 4 */}
          <div style={{ 
            background: '#131c2e', 
            border: '1px solid rgba(16, 185, 129, 0.3)', 
            borderRadius: '12px', 
            padding: '18px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Clock size={20} color="var(--emerald-400)" />
              <h3 style={{ fontSize: '16px', color: '#f8fafc' }}>
                4. How to avoid hammering a site with requests?
              </h3>
            </div>
            <div style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
              <p><strong>Answer: Domain Concurrency Token-Bucket Queue & Polite Delays.</strong></p>
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '12px', 
                borderRadius: '8px', 
                marginTop: '10px',
                borderLeft: '3px solid var(--emerald-400)' 
              }}>
                <span style={{ fontWeight: 600, color: 'var(--emerald-400)' }}>WatchTower Implementation:</span>
                <ul style={{ paddingLeft: '20px', marginTop: '6px', fontSize: '12.5px' }}>
                  <li><code>DomainRateLimiter</code> isolates traffic by hostname (e.g. <code>api.github.com</code> vs <code>store.example.com</code>).</li>
                  <li>Strict concurrency cap of <strong>1 active crawler per domain</strong> with mutex locking.</li>
                  <li>Enforces a polite crawl delay (minimum 1.5 to 2.0 seconds between successive hits to the same domain).</li>
                  <li>Exponential backoff with randomized jitter on transient network errors, preventing thundering herds.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Understood</button>
        </div>
      </div>
    </div>
  );
}
