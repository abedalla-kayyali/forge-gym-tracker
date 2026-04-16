import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { AppSettings, DashboardLayout } from '../types/profile';

interface SettingsState {
  settings: AppSettings;
  hydrate: () => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  setTheme: (theme: AppSettings['theme']) => void;
  setLanguage: (lang: AppSettings['language']) => void;
  toggleSound: () => void;
  toggleHaptic: () => void;
  setLayout: (layout: DashboardLayout) => void;
}

function readSettings(): AppSettings {
  return {
    theme: readStorage<AppSettings['theme']>(STORAGE_KEYS.THEME, 'dark'),
    accent: readStorage<string>(STORAGE_KEYS.ACCENT, '#00ff88'),
    sound: (readStorage<string>(STORAGE_KEYS.SOUND, 'on') as string) !== 'off',
    haptic: (readStorage<string>(STORAGE_KEYS.HAPTIC, 'on') as string) !== 'off',
    language: readStorage<AppSettings['language']>(STORAGE_KEYS.LANG, 'en'),
    customBg: readStorage<string | undefined>(STORAGE_KEYS.CUSTOM_BG, undefined),
    layout: readStorage<DashboardLayout | undefined>(STORAGE_KEYS.LAYOUT, undefined),
  };
}

function writeSettings(updates: Partial<AppSettings>): void {
  if (updates.theme !== undefined) writeStorage(STORAGE_KEYS.THEME, updates.theme);
  if (updates.accent !== undefined) writeStorage(STORAGE_KEYS.ACCENT, updates.accent);
  if (updates.sound !== undefined) writeStorage(STORAGE_KEYS.SOUND, updates.sound ? 'on' : 'off');
  if (updates.haptic !== undefined) writeStorage(STORAGE_KEYS.HAPTIC, updates.haptic ? 'on' : 'off');
  if (updates.language !== undefined) writeStorage(STORAGE_KEYS.LANG, updates.language);
  if (updates.customBg !== undefined) writeStorage(STORAGE_KEYS.CUSTOM_BG, updates.customBg);
  if (updates.layout !== undefined) writeStorage(STORAGE_KEYS.LAYOUT, updates.layout);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: readSettings(),

  hydrate: () => {
    set({ settings: readSettings() });
  },

  updateSettings: (updates) => {
    const updated = { ...get().settings, ...updates };
    writeSettings(updates);
    set({ settings: updated });
  },

  setTheme: (theme) => {
    const updated = { ...get().settings, theme };
    writeStorage(STORAGE_KEYS.THEME, theme);
    set({ settings: updated });
  },

  setLanguage: (lang) => {
    const updated = { ...get().settings, language: lang };
    writeStorage(STORAGE_KEYS.LANG, lang);
    set({ settings: updated });
  },

  toggleSound: () => {
    const next = !get().settings.sound;
    const updated = { ...get().settings, sound: next };
    writeStorage(STORAGE_KEYS.SOUND, next ? 'on' : 'off');
    set({ settings: updated });
  },

  toggleHaptic: () => {
    const next = !get().settings.haptic;
    const updated = { ...get().settings, haptic: next };
    writeStorage(STORAGE_KEYS.HAPTIC, next ? 'on' : 'off');
    set({ settings: updated });
  },

  setLayout: (layout) => {
    const updated = { ...get().settings, layout };
    writeStorage(STORAGE_KEYS.LAYOUT, layout);
    set({ settings: updated });
  },
}));
