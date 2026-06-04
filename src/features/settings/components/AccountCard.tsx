import { useState } from 'react';
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
    const name = (user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? 'Athlete';
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
              <Badge variant="success" dot>Signed in</Badge>
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
              toast('Signed out — data saved locally', 'info');
            }}
            loading={busy}
          >
            <LogOut size={14} /> Sign out
          </Button>
        </div>
      </Card>
    );
  }

  // ── Logged-out / Guest view ──────────────────────────────────────────────
  const handleEmailSubmit = async () => {
    if (!email.trim() || !password) {
      toast('Enter email and password', 'error');
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
      toast('Signed in — syncing to cloud', 'success');
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
        toast('Check your email to verify your account', 'success');
        return;
      }
      play('success');
      toast('Welcome to FORGE — syncing your data', 'success');
      await mergeGuestIntoAccount();
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast('Enter your email first', 'error');
      return;
    }
    setBusy(true);
    const res = await resetPassword(email.trim());
    setBusy(false);
    if (res.error) { toast(res.error, 'error'); return; }
    toast('Password reset email sent', 'success');
  };

  if (needsConfirm) {
    return (
      <Card variant="luxury" className="p-5 space-y-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-forge-green/20 border border-forge-green/30 flex items-center justify-center mx-auto">
          <Mail size={22} className="text-forge-green" />
        </div>
        <div>
          <div className="text-forge-text font-condensed font-semibold text-[16px]">Check your inbox</div>
          <div className="text-forge-muted text-[12px] mt-1">
            We sent a verification link to <span className="text-forge-green">{email}</span>. After confirming,
            sign in here and your current workouts will auto-sync.
          </div>
        </div>
        <Button variant="secondary" onClick={() => { setNeedsConfirm(false); setMode('signin'); }} fullWidth>
          Back to sign in
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
            <span className="text-forge-text font-condensed font-semibold text-[15px]">Your Account</span>
            {isGuest && <Badge variant="warning" dot>Guest mode</Badge>}
          </div>
          <div className="text-forge-muted text-[12px] leading-snug">
            {isGuest
              ? 'Sign in to back up your data to the cloud and sync across devices.'
              : 'Sign in or create a FORGE account.'}
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <TabPills
        tabs={[
          { id: 'signin', label: 'Sign In',  Icon: LogIn },
          { id: 'signup', label: 'Sign Up',  Icon: UserIcon },
        ]}
        value={mode}
        onChange={(m) => setMode(m as Mode)}
        size="sm"
        ariaLabel="Authentication mode"
      />

      <div className="space-y-2.5">
        {mode === 'signup' && (
          <Input
            label="Display Name (optional)"
            placeholder="Ahmed"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            leftIcon={<UserIcon size={14} />}
            autoComplete="name"
          />
        )}
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail size={14} />}
          autoComplete="email"
          inputMode="email"
        />
        <Input
          label="Password"
          type="password"
          placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock size={14} />}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={handleEmailSubmit}
          loading={busy}
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : (
            mode === 'signin' ? <><LogIn size={14} /> Sign In</> : <><CheckCircle2 size={14} /> Create Account</>
          )}
        </Button>
      </div>

      {mode === 'signin' && (
        <button
          onClick={handleForgotPassword}
          className="block mx-auto text-[12px] font-condensed text-forge-muted hover:text-forge-green cursor-pointer transition-colors duration-150"
          disabled={busy}
        >
          Forgot password?
        </button>
      )}
    </Card>
  );
}

// ─── Sync status pill ────────────────────────────────────────────────────────

function SyncPill({ state }: { state: 'idle' | 'pulling' | 'pushing' | 'error' | 'unavailable' }) {
  const config: Record<typeof state, { Icon: typeof Cloud; label: string; color: string; bg: string; border: string }> = {
    idle:        { Icon: Cloud,      label: 'Cloud synced',          color: '#58d68d', bg: 'rgba(46,204,113,0.1)',  border: 'rgba(46,204,113,0.25)' },
    pulling:     { Icon: Wifi,       label: 'Downloading data…',     color: '#58d68d', bg: 'rgba(46,204,113,0.1)',  border: 'rgba(46,204,113,0.25)' },
    pushing:     { Icon: Wifi,       label: 'Uploading changes…',    color: '#58d68d', bg: 'rgba(46,204,113,0.1)',  border: 'rgba(46,204,113,0.25)' },
    error:       { Icon: AlertCircle,label: 'Sync error — saved locally',color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
    unavailable: { Icon: CloudOff,   label: 'Local only — cloud DB not set up', color: '#7a8289', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)' },
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
