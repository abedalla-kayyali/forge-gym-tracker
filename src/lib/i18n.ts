import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../i18n/en.json';
import ar from '../i18n/ar.json';
import { readStorage } from './storage';
import { STORAGE_KEYS } from './constants';

const savedLang = readStorage<string>(STORAGE_KEYS.LANG, 'en');

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

/**
 * Switch the active language AND keep <html dir/lang> in sync. Call this
 * anywhere the language changes (settings toggle, cloud rehydrate). Previously
 * the toggle only set <html dir>, so Arabic just right-aligned English — this
 * is what actually drives i18next so every translated string switches.
 */
export function applyLanguage(lng: string): void {
  if (i18n.language !== lng) i18n.changeLanguage(lng);
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  }
}

// Apply the saved language's direction at boot.
applyLanguage(savedLang);

export default i18n;
