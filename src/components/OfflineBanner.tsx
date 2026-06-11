import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { syncQueueSize } from '../lib/syncQueue';

type Tone = 'warn' | 'info' | 'ok';

const TONE_STYLES: Record<Tone, { color: string; border: string }> = {
  warn: { color: '#ffd089', border: 'rgba(255,170,60,0.55)' },
  info: { color: '#9cf2bf', border: 'rgba(57,255,143,0.45)' },
  ok: { color: '#9cf2bf', border: 'rgba(57,255,143,0.55)' },
};

export function OfflineBanner() {
  const { t } = useTranslation();
  const { offlineEmail } = useAuth();
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queueSize, setQueueSize] = useState(() => syncQueueSize());
  const [flashSynced, setFlashSynced] = useState(false);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onQueue = () => setQueueSize(syncQueueSize());
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('forge:sync-queue-changed', onQueue as EventListener);
    const t = window.setInterval(() => setQueueSize(syncQueueSize()), 5000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('forge:sync-queue-changed', onQueue as EventListener);
      window.clearInterval(t);
    };
  }, []);

  // Brief "✓ Synced" flash when the queue empties while online
  useEffect(() => {
    if (!(online && !offlineEmail && queueSize === 0)) return;
    // We may have just drained — surface a brief OK flash (deferred a tick so
    // the effect itself never sets state synchronously).
    const onId = window.setTimeout(() => setFlashSynced(true), 0);
    const offId = window.setTimeout(() => setFlashSynced(false), 1800);
    return () => { window.clearTimeout(onId); window.clearTimeout(offId); };
  }, [queueSize, online, offlineEmail]);

  let text: string | null = null;
  let tone: Tone = 'warn';

  if (!online) {
    text = t('offline.offline');
    tone = 'warn';
  } else if (offlineEmail) {
    text = t('offline.cachedLogin');
    tone = 'warn';
  } else if (queueSize > 0) {
    text = t('offline.syncing', { count: queueSize });
    tone = 'info';
  } else if (flashSynced) {
    text = t('offline.synced');
    tone = 'ok';
  }

  if (!text) return null;
  const palette = TONE_STYLES[tone];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10001,
        background: 'rgba(14,18,15,0.94)',
        border: `1px solid ${palette.border}`,
        color: palette.color,
        padding: '6px 14px',
        borderRadius: 999,
        fontFamily: '"DM Mono", monospace',
        fontSize: '0.7rem',
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        maxWidth: '92vw',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        transition: 'opacity .25s, transform .32s cubic-bezier(.22,1,.36,1)',
      }}
    >
      {text}
    </div>
  );
}
