const PLAIN_STRING_KEYS = new Set([
  'forge_theme',
  'forge_accent',
  'forge_lang',
  'forge_sound',
  'forge_haptic',
  'forge_dnn',
  'forge_custom_bg',
  'forge_guest',
  'forge_onboarding_v238_done',
  'forge_schema_version',
  'forge_last_debrief',
  'forge_progress_card_last_sunday',
  'forge_ditto_tip_shown',
  'forge_reengagement_shown',
  'forge_step_goal',
  'forge_name',
  'forge_username',
  'forge_profile_name',
]);

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    if (PLAIN_STRING_KEYS.has(key)) {
      return raw as unknown as T;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  const serialized = PLAIN_STRING_KEYS.has(key) ? String(value) : JSON.stringify(value);
  try {
    localStorage.setItem(key, serialized);
  } catch (e) {
    // Storage full — surface it instead of silently losing the write (common
    // on cheap/older devices). Don't stamp/mutate when the write failed.
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      try { window.dispatchEvent(new CustomEvent('forge:storage-full', { detail: { key } })); } catch { /* noop */ }
    }
    return;
  }
  // Stamp local mutation timestamp for cloud-sync last-writer-wins
  try {
    localStorage.setItem(`forge:sync:updated:${key}`, String(Date.now()));
    window.dispatchEvent(new CustomEvent('forge:mutated', { detail: { key } }));
  } catch { /* SSR / restricted env */ }
}

export function removeStorage(key: string): void {
  localStorage.removeItem(key);
  try {
    window.dispatchEvent(new CustomEvent('forge:mutated', { detail: { key, removed: true } }));
  } catch { /* noop */ }
}

/**
 * Defensive normalizer for persisted workout-like records. Data written by the
 * legacy app (or any older schema) may be missing array fields; this guarantees
 * every record has an `exercises` array (each exercise with a `sets` array) and
 * a string `date`, so consumers that iterate them can't crash on bad data.
 * Non-object entries are dropped.
 */
export function normalizeWorkoutList<T>(raw: unknown): T[] {
  if (!Array.isArray(raw)) return [];
  const out: T[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const exercises = (Array.isArray(rec.exercises) ? rec.exercises : [])
      .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
      .map((e) => ({ ...e, sets: Array.isArray(e.sets) ? e.sets : [] }));
    out.push({
      ...rec,
      date: typeof rec.date === 'string' ? rec.date : '',
      exercises,
    } as unknown as T);
  }
  return out;
}
