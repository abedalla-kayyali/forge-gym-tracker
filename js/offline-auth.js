// FORGE Offline Auth
// Stores a PBKDF2 hash of (email + password) on the device so the user can
// "log in" and access their LOCAL data even when Supabase is unreachable.
//
// Security model:
//   • We NEVER store the plaintext password.
//   • PBKDF2(password, perDeviceSalt, 100k, SHA-256) → 32-byte hash.
//   • Salt is generated once per device (random 16 bytes).
//   • Verification is constant-time against the stored hash.
//
// On successful ONLINE login/signup, auth-ui calls saveFingerprint().
// On Supabase failure during login, auth-ui calls verify() and — on match —
// flips to offline mode (forge_guest=1 with forge_offline_user remembered).

(function () {
  'use strict';

  const KEY = 'forge_offline_auth';

  async function pbkdf2(password, salt, iterations) {
    const enc = new TextEncoder();
    const km = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
      km,
      256
    );
    return new Uint8Array(bits);
  }

  function toB64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  function fromB64(s) {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function constantTimeEq(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }

  function normalizeEmail(e) { return String(e || '').trim().toLowerCase(); }

  async function saveFingerprint(email, password) {
    if (!email || !password) return false;
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iterations = 100000;
      const hash = await pbkdf2(password, salt, iterations);
      const fp = {
        v: 1,
        email: normalizeEmail(email),
        salt: toB64(salt),
        hash: toB64(hash),
        iterations,
        savedAt: Date.now(),
      };
      localStorage.setItem(KEY, JSON.stringify(fp));
      return true;
    } catch (e) {
      console.warn('[FORGE offline-auth] saveFingerprint failed', e?.message || e);
      return false;
    }
  }

  async function verify(email, password) {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return false;
      const fp = JSON.parse(raw);
      if (!fp || fp.email !== normalizeEmail(email)) return false;
      const salt = fromB64(fp.salt);
      const expected = fromB64(fp.hash);
      const actual = await pbkdf2(password, salt, fp.iterations || 100000);
      return constantTimeEq(actual, expected);
    } catch (e) {
      return false;
    }
  }

  function getStoredEmail() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const fp = JSON.parse(raw);
      return fp?.email || null;
    } catch { return null; }
  }

  function hasFingerprint() { return !!getStoredEmail(); }

  function clear() {
    try { localStorage.removeItem(KEY); } catch {}
    try { localStorage.removeItem('forge_offline_user'); } catch {}
  }

  function markOfflineSession(email) {
    try {
      localStorage.setItem('forge_offline_user', JSON.stringify({
        email: normalizeEmail(email),
        ts: Date.now(),
      }));
    } catch {}
  }

  function getOfflineSession() {
    try {
      const raw = localStorage.getItem('forge_offline_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function isLikelyNetworkError(e) {
    if (!navigator.onLine) return true;
    if (!window._sb) return true; // SDK not initialized → treat as offline
    const msg = String(e?.message || e || '').toLowerCase();
    const status = e?.status || e?.statusCode;
    if (status === 503 || status === 502 || status === 504 || status === 0) return true;
    return msg.includes('failed to fetch')
      || msg.includes('networkerror')
      || msg.includes('load failed')
      || msg.includes('err_name_not_resolved')
      || msg.includes('err_internet_disconnected')
      || msg.includes('err_connection_refused')
      || msg.includes('timeout')
      || msg.includes('sb_not_configured')
      || msg.includes('503')
      || msg.includes('502');
  }

  window._forgeOfflineAuth = {
    saveFingerprint,
    verify,
    getStoredEmail,
    hasFingerprint,
    clear,
    markOfflineSession,
    getOfflineSession,
    isLikelyNetworkError,
  };
})();
