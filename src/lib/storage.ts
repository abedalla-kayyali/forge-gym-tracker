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
  if (PLAIN_STRING_KEYS.has(key)) {
    localStorage.setItem(key, String(value));
  } else {
    localStorage.setItem(key, JSON.stringify(value));
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
