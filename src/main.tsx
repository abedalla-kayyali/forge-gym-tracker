import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/i18n';
import App from './App';
import './index.css';
import { ToastProvider } from './components/ui/Toast';
import { readStorage } from './lib/storage';
import { STORAGE_KEYS } from './lib/constants';

// Set document direction based on language
const lang = readStorage<string>(STORAGE_KEYS.LANG, 'en');
document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = lang;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
