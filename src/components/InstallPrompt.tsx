import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * "Add to home screen" prompt. Appears only when the browser fires
 * `beforeinstallprompt` (Android/Chromium) and the app isn't already running
 * standalone. Dismissible; self-hides after install.
 */
export function InstallPrompt() {
  const { t } = useTranslation();
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setEvt(null);
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const standalone =
    typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true);

  if (!evt || dismissed || standalone) return null;

  const install = async () => {
    try {
      await evt.prompt();
      await evt.userChoice;
    } catch {
      /* user/agent dismissed */
    }
    setEvt(null);
  };

  return (
    <div
      className="fixed inset-x-0 z-[60] flex justify-center px-3 pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}
    >
      <div className="pointer-events-auto flex items-center gap-3 max-w-md w-full nav-pill rounded-2xl px-4 py-3 shadow-[0_8px_28px_rgba(0,0,0,0.45)] animate-fade-in">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forge-green to-forge-green-dark flex items-center justify-center shrink-0">
          <Download size={18} className="text-forge-bg-deep" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-forge-text text-sm font-condensed font-semibold">{t('install.title')}</div>
          <div className="text-forge-muted text-[11px] leading-snug">{t('install.subtitle')}</div>
        </div>
        <button
          onClick={install}
          className="shrink-0 bg-forge-green text-forge-bg-deep text-[13px] font-condensed font-semibold px-3.5 py-2 rounded-xl cursor-pointer press-scale min-h-[40px]"
        >
          {t('install.action')}
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label={t('common.close')}
          className="shrink-0 text-forge-muted hover:text-forge-text cursor-pointer p-1"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
