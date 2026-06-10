import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, LogOut, Mail, Lock, User as UserIcon, Loader2, CheckCircle2, Cloud, CloudOff, Wifi, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { TabPills } from '../../../components/ui/TabPills';
import { useAuth } from '../../../hooks/useAuth';
import { useCloudSync } from '../../../hooks/useCloudSync';
import { useToast } from '../../../components/ui/Toast';
import { useFX } from '../../../hooks/useFX';
import { mergeGuestIntoAccount } from '../../../lib/cloudSync';

type Mode = 'signin' | 'signup';

export function AccountCard() {
  const { t } = useTranslation();
  const {
    user, isGuest,
    signInWithEmail, signUpWithEmail, resetPassword, signOut,
  } = useAuth();
  const { state: syncState } = useCloudSync();
  const { toast } = useToast();
  const { play } = useFX();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  // ── Logged-in view ───────────────────────────────────────────────────────
  if (user) {
    const name = (user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? t('account.defaultName');
    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    return (
      <Card variant="luxury" className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forge-green to-forge-green-dark flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(46,204,113,0.3)] overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={22} className="text-forge-bg-deep" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-forge-text font-condensed font-semibold text-[15px] truncate">{name}</span>
              <Badge variant="success" dot>{t('account.signedIn')}</Badge>
            </div>
            <div className="text-forge-muted text-[12px] font-mono truncate">{user.email}</div>
          </div>
        </div>

        <SyncPill state={syncState} />

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={async () => {
              setBusy(true);
              await signOut();
              setBusy(false);
              play('tap');
              toast(t('account.signedOutToast'), 'info');
            }}
            loading={busy}
          >
            <LogOut size={14} /> {t('auth.signOut')}
          </Button>
        </div>
      </Card>
    );
  }

  // ── Logged-out / Guest view ──────────────────────────────────────────────
  const handleEmailSubmit = async () => {
    if (!email.trim() || !password) {
      toast(t('account.enterEmailPassword'), 'error');
      return;
    }
    setBusy(true);
    if (mode === 'signin') {
      const res = await signInWithEmail(email.trim(), password);
      setBusy(false);
      if (res.error) {
        toast(res.error, 'error');
        play('error');
        return;
      }
      play('success');
      toast(t('account.signedInToast'), 'success');
      // Trigger guest-to-account data merge
      await mergeGuestIntoAccount();
    } else {
      const res = await signUpWithEmail(email.trim(), password, displayName.trim() || undefined);
      setBusy(false);
      if (res.error) {
        toast(res.error, 'error');
        play('error');
        return;
      }
      if (res.needsConfirm) {
        setNeedsConfirm(true);
        play('success');
        toast(t('account.verifyEmailToast'), 'success');
        return;
      }
      play('success');
      toast(t('account.welcomeToast'), 'success');
      await mergeGuestIntoAccount();
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast(t('account.enterEmailFirst'), 'error');
      return;
    }
    setBusy(true);
    const res = await resetPassword(email.trim());
    setBusy(false);
    if (res.error) { toast(res.error, 'error'); return; }
    toast(t('account.resetEmailSent'), 'success');
  };

  if (needsConfirm) {
    return (
      <Card variant="luxury" className="p-5 space-y-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-forge-green/20 border border-forge-green/30 flex items-center justify-center mx-auto">
          <Mail size={22} className="text-forge-green" />
        </div>
        <div>
          <div className="text-forge-text font-condensed font-semibold text-[16px]">{t('account.checkInbox')}</div>
          <div className="text-forge-muted text-[12px] mt-1">
            {t('account.verificationLinkSentPrefix')} <span className="text-forge-green">{email}</span>{t('account.verificationLinkSentSuffix')}
          </div>
        </div>
        <Button variant="secondary" onClick={() => { setNeedsConfirm(false); setMode('signin'); }} fullWidth>
          {t('account.backToSignIn')}
        </Button>
      </Card>
    );
  }

  return (
    <Card variant="luxury" className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center shrink-0">
          <UserIcon size={20} className="text-forge-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-forge-text font-condensed font-semibold text-[15px]">{t('account.title')}</span>
            {isGuest && <Badge variant="warning" dot>{t('account.guestMode')}</Badge>}
          </div>
          <div className="text-forge-muted text-[12px] leading-snug">
            {isGuest
              ? t('account.guestHelper')
              : t('account.signInHelper')}
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <TabPills
        tabs={[
          { id: 'signin', label: t('auth.signIn'),    Icon: LogIn },
          { id: 'signup', label: t('account.signUp'),  Icon: UserIcon },
        ]}
        value={mode}
        onChange={(m) => setMode(m as Mode)}
        size="sm"
        ariaLabel={t('account.authModeAria')}
      />

      {/* Real form so password managers/autofill recognize the credential fields */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleEmailSubmit(); }}
        className="space-y-4"
      >
        <div className="space-y-2.5">
          {mode === 'signup' && (
            <Input
              label={t('account.displayNameLabel')}
              placeholder={t('account.displayNamePlaceholder')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              leftIcon={<UserIcon size={14} />}
              autoComplete="name"
            />
          )}
          <Input
            label={t('account.emailLabel')}
            type="email"
            placeholder={t('account.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail size={14} />}
            autoComplete="email"
            inputMode="email"
          />
          <Input
            label={t('account.passwordLabel')}
            type="password"
            placeholder={mode === 'signup' ? t('account.passwordHintSignup') : '••••••••'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock size={14} />}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={busy}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : (
              mode === 'signin' ? <><LogIn size={14} /> {t('auth.signIn')}</> : <><CheckCircle2 size={14} /> {t('account.createAccount')}</>
            )}
          </Button>
        </div>
      </form>

      {mode === 'signin' && (
        <button
          onClick={handleForgotPassword}
          className="block mx-auto text-[12px] font-condensed text-forge-muted hover:text-forge-green cursor-pointer transition-colors duration-150"
          disabled={busy}
        >
          {t('account.forgotPassword')}
        </button>
      )}
    </Card>
  );
}

// ─── Sync status pill ────────────────────────────────────────────────────────

function SyncPill({ state }: { state: 'idle' | 'pulling' | 'pushing' | 'error' | 'unavailable' }) {
  const { t } = useTranslation();
  const config: Record<typeof state, { Icon: typeof Cloud; label: string; color: string; bg: string; border: string }> = {
    idle:        { Icon: Cloud,      label: t('account.syncIdle'),       color: '#58d68d', bg: 'rgba(46,204,113,0.1)',  border: 'rgba(46,204,113,0.25)' },
    pulling:     { Icon: Wifi,       label: t('account.syncPulling'),    color: '#58d68d', bg: 'rgba(46,204,113,0.1)',  border: 'rgba(46,204,113,0.25)' },
    pushing:     { Icon: Wifi,       label: t('account.syncPushing'),    color: '#58d68d', bg: 'rgba(46,204,113,0.1)',  border: 'rgba(46,204,113,0.25)' },
    error:       { Icon: AlertCircle,label: t('account.syncError'),      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    unavailable: { Icon: CloudOff,   label: t('account.syncUnavailable'),color: '#7a8289', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
  };
  const c = config[state];
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 w-fit"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
      role="status"
      aria-live="polite"
    >
      <c.Icon size={12} className={state === 'pulling' || state === 'pushing' ? 'animate-pulse' : ''} />
      <span className="text-[11px] font-condensed uppercase tracking-wider">{c.label}</span>
    </div>
  );
}
