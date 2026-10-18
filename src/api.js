/**
 * Shared API Helper for WatchTower
 * 
 * Prefixes relative API paths with import.meta.env.VITE_API_BASE_URL or import.meta.env.API_BASE_URL.
 * Defaults to an empty string for local development (which uses Vite's local dev server proxy).
 */

export const API_BASE_URL = (
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    (import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL)) ||
  ''
).trim().replace(/\/+$/, '');

/**
 * Returns a fully qualified API URL when API_BASE_URL is set, or returns the relative path.
 * Leaves data:, http://, and https:// URLs untouched.
 *
 * @param {string} path - Relative endpoint path (e.g. '/api/monitors', '/mock/store')
 * @returns {string} Fully qualified URL or relative path
 */
export function apiUrl(path = '') {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalized}` : normalized;
}

/**
 * Drop-in wrapper around fetch that automatically routes relative paths through apiUrl().
 *
 * @param {string} endpoint - Relative API endpoint or external URL
 * @param {RequestInit} [options] - Standard fetch options
 * @returns {Promise<Response>}
 */
export function apiFetch(endpoint, options = {}) {
  // Default to a 45-second AbortSignal timeout to prevent requests from hanging indefinitely
  if (!options.signal && typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    options = { ...options, signal: AbortSignal.timeout(45000) };
  }
  return fetch(apiUrl(endpoint), options);
}

export default apiUrl;
