/**
 * Offline auth — PBKDF2 fingerprint so users can access their LOCAL data
 * when Supabase is unreachable.
 *
 * We never store the plaintext password. On successful online login we save
 * { email, salt, hash, iterations }. On Supabase failure we verify against
 * that hash and flip the app into "offline mode" (guest with cached identity).
 */

const KEY = 'forge_offline_auth';
const OFFLINE_USER_KEY = 'forge_offline_user';

interface Fingerprint {
  v: 1;
  email: string;
  salt: string;
  hash: string;
  iterations: number;
  savedAt: number;
}

interface OfflineSession {
  email: string;
  ts: number;
}

function normalizeEmail(e: string): string {
  return String(e || '').trim().toLowerCase();
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const passBytes = enc.encode(password) as unknown as BufferSource;
  const saltBuf = salt as unknown as BufferSource;
  const km = await crypto.subtle.importKey('raw', passBytes, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuf, iterations, hash: 'SHA-256' },
    km,
    256,
  );
  return new Uint8Array(bits);
}

function toB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i] ?? 0);
  return btoa(s);
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function constantTimeEq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export async function saveFingerprint(email: string, password: string): Promise<boolean> {
  if (!email || !password) return false;
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iterations = 100000;
    const hash = await pbkdf2(password, salt, iterations);
    const fp: Fingerprint = {
      v: 1,
      email: normalizeEmail(email),
      salt: toB64(salt),
      hash: toB64(hash),
      iterations,
      savedAt: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify(fp));
    return true;
  } catch {
    return false;
  }
}

export async function verifyOfflineCredentials(email: string, password: string): Promise<boolean> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const fp = JSON.parse(raw) as Fingerprint;
    if (!fp || fp.email !== normalizeEmail(email)) return false;
    const salt = fromB64(fp.salt);
    const expected = fromB64(fp.hash);
    const actual = await pbkdf2(password, salt, fp.iterations || 100000);
    return constantTimeEq(actual, expected);
  } catch {
    return false;
  }
}

export function getStoredOfflineEmail(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const fp = JSON.parse(raw) as Fingerprint;
    return fp?.email ?? null;
  } catch {
    return null;
  }
}

export function hasOfflineFingerprint(): boolean {
  return getStoredOfflineEmail() !== null;
}

export function clearOfflineAuth(): void {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
  try { localStorage.removeItem(OFFLINE_USER_KEY); } catch { /* noop */ }
}

export function markOfflineSession(email: string): void {
  try {
    const session: OfflineSession = { email: normalizeEmail(email), ts: Date.now() };
    localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(session));
  } catch {
    /* noop */
  }
}

export function getOfflineSession(): OfflineSession | null {
  try {
    const raw = localStorage.getItem(OFFLINE_USER_KEY);
    return raw ? (JSON.parse(raw) as OfflineSession) : null;
  } catch {
    return null;
  }
}

export function clearOfflineSession(): void {
  try { localStorage.removeItem(OFFLINE_USER_KEY); } catch { /* noop */ }
}

export function isLikelyNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const e = err as { message?: string; status?: number; statusCode?: number; code?: string };
  const status = e?.status ?? e?.statusCode;
  if (status === 503 || status === 502 || status === 504 || status === 0) return true;
  const msg = String(e?.message ?? err ?? '').toLowerCase();
  return msg.includes('failed to fetch')
    || msg.includes('networkerror')
    || msg.includes('load failed')
    || msg.includes('err_name_not_resolved')
    || msg.includes('err_internet_disconnected')
    || msg.includes('err_connection_refused')
    || msg.includes('timeout')
    || msg.includes('503')
    || msg.includes('502');
}
