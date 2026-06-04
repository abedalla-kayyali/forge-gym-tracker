import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuth } from './hooks/useAuth';
import { useCloudSync } from './hooks/useCloudSync';
import { useSettingsStore } from './stores/useSettingsStore';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { OfflineBanner } from './components/OfflineBanner';
import { TabPills } from './components/ui/TabPills';
import { Input } from './components/ui/Input';
import { useToast } from './components/ui/Toast';
import { useFX } from './hooks/useFX';
import { mergeGuestIntoAccount } from './lib/cloudSync';
import {
  Sparkles, Dumbbell, Activity, TrendingUp, Mail, Lock, LogIn, UserIcon,
  Loader2, User as UserLucide, CheckCircle2,
} from 'lucide-react';

// Router basename derived from Vite's base URL
// ('/forge-gym-tracker/' in a production Pages build, '/' in dev).
const ROUTER_BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

// Lazy-loaded pages
const LogPage = lazy(() => import('./pages/LogPage').then((m) => ({ default: m.LogPage })));
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const SocialPage = lazy(() => import('./pages/SocialPage').then((m) => ({ default: m.SocialPage })));
const CoachPage = lazy(() => import('./pages/CoachPage').then((m) => ({ default: m.CoachPage })));
const MorePage = lazy(() => import('./pages/MorePage').then((m) => ({ default: m.MorePage })));

function PageLoader() {
  return (
    <div className="p-4 space-y-3 page-enter" role="status" aria-live="polite" aria-label="Loading">
      <div className="h-7 w-24 skeleton" />
      <div className="grid grid-cols-3 gap-2">
        <div className="h-20 skeleton" />
        <div className="h-20 skeleton" />
        <div className="h-20 skeleton" />
      </div>
      <div className="h-10 skeleton rounded-full" />
      <div className="space-y-2">
        <div className="h-16 skeleton rounded-2xl" />
        <div className="h-16 skeleton rounded-2xl" />
        <div className="h-16 skeleton rounded-2xl" />
      </div>
      <span className="sr-only">Loading content…</span>
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-forge-bg-deep relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(46,204,113,0.18) 0%, transparent 60%)' }}
      />
      <div className="relative flex flex-col items-center gap-5">
        <div className="brand-mark text-[4rem] leading-none animate-pulse">FORGE</div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-forge-green animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-forge-green animate-bounce [animation-delay:140ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-forge-green animate-bounce [animation-delay:280ms]" />
        </div>
      </div>
    </div>
  );
}

type AuthMode = 'signin' | 'signup';

function AuthScreen({
  signInWithEmail,
  signUpWithEmail,
  resetPassword,
  continueAsGuest,
}: {
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<{ error?: string; needsConfirm?: boolean }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  continueAsGuest: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const { toast } = useToast();
  const { play } = useFX();

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      toast('Enter email and password', 'error');
      play('error');
      return;
    }
    setBusy(true);
    if (mode === 'signin') {
      const res = await signInWithEmail(email.trim(), password);
      setBusy(false);
      if (res.error) { toast(res.error, 'error'); play('error'); return; }
      play('success');
      toast('Welcome back', 'success');
      await mergeGuestIntoAccount();
    } else {
      const res = await signUpWithEmail(email.trim(), password, displayName.trim() || undefined);
      setBusy(false);
      if (res.error) { toast(res.error, 'error'); play('error'); return; }
      if (res.needsConfirm) { setNeedsConfirm(true); play('success'); return; }
      play('success');
      toast('Welcome to FORGE', 'success');
      await mergeGuestIntoAccount();
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) { toast('Enter your email first', 'error'); return; }
    setBusy(true);
    const res = await resetPassword(email.trim());
    setBusy(false);
    if (res.error) toast(res.error, 'error');
    else toast('Reset email sent', 'success');
  };

  if (needsConfirm) {
    return (
      <div className="min-h-dvh bg-forge-bg-deep relative overflow-hidden flex items-center justify-center px-6">
        <AmbientWash />
        <div className="relative card-elevated card-luxury-border rounded-3xl p-6 max-w-sm w-full text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-forge-green/15 border border-forge-green/30 flex items-center justify-center mx-auto">
            <Mail size={24} className="text-forge-green" />
          </div>
          <div>
            <div className="text-forge-text font-display text-[22px] tracking-wide">Check your inbox</div>
            <p className="text-forge-muted text-[13px] mt-1.5 leading-relaxed">
              We sent a verification link to <span className="text-forge-green">{email}</span>.
              Confirm, then sign in here.
            </p>
          </div>
          <button
            onClick={() => { setNeedsConfirm(false); setMode('signin'); }}
            className="inline-flex items-center justify-center w-full rounded-2xl min-h-[48px] px-6 border border-white/10 text-forge-text-soft font-condensed uppercase tracking-wider text-[13px] hover:bg-white/5 press-scale cursor-pointer transition-all duration-200"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-forge-bg-deep relative overflow-hidden">
      <AmbientWash />

      <div className="relative min-h-dvh flex flex-col max-w-md mx-auto px-6 py-8 safe-area-top safe-area-bottom">
        {/* Brand lockup */}
        <div className="flex flex-col items-center gap-2 mt-6 mb-5">
          <div className="brand-mark text-[3.2rem] leading-none tracking-[0.22em]">FORGE</div>
          <p className="label-cap text-forge-green/90">Your Gym Operating System</p>
        </div>

        {/* Feature bullets (compact) */}
        <div className="space-y-2 mb-5">
          <MiniFeature Icon={Dumbbell}    title="Every rep counted" />
          <MiniFeature Icon={Activity}    title="Signals, not noise" />
          <MiniFeature Icon={TrendingUp}  title="Progressive overload" />
          <MiniFeature Icon={Sparkles}    title="Luxury, not loud" />
        </div>

        {/* Auth card */}
        <div className="card-elevated card-luxury-border rounded-3xl p-5 space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forge-green/25 to-forge-green/5 border border-forge-green/20 flex items-center justify-center">
              <LogIn size={16} className="text-forge-green" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-forge-text font-condensed font-semibold text-[15px]">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </div>
              <div className="text-forge-muted text-[11px] font-condensed">
                {mode === 'signin' ? 'Sign in to your FORGE account' : 'Free · no ads · your data, your control'}
              </div>
            </div>
          </div>

          <TabPills
            tabs={[
              { id: 'signin', label: 'Sign In',  Icon: LogIn },
              { id: 'signup', label: 'Sign Up',  Icon: UserLucide },
            ]}
            value={mode}
            onChange={(m) => setMode(m as AuthMode)}
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
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={busy}
            className="sheen relative w-full inline-flex items-center justify-center gap-2 rounded-2xl min-h-[52px] px-6
              bg-gradient-to-br from-forge-green via-forge-green to-forge-green-dark text-forge-bg-deep
              font-condensed font-semibold uppercase tracking-wider text-[15px]
              shadow-[0_10px_28px_rgba(46,204,113,0.42),0_1px_0_rgba(255,255,255,0.18)_inset]
              hover:brightness-110 press-scale cursor-pointer transition-all duration-200
              disabled:opacity-60 disabled:pointer-events-none"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> :
              mode === 'signin' ? <><LogIn size={15} /> Sign In</> : <><CheckCircle2 size={15} /> Create Account</>
            }
          </button>

          {mode === 'signin' && (
            <button
              onClick={handleForgot}
              disabled={busy}
              className="block mx-auto text-[12px] font-condensed text-forge-muted hover:text-forge-green cursor-pointer transition-colors duration-150"
            >
              Forgot password?
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <span className="flex-1 h-px bg-white/10" />
          <span className="label-cap text-[10px]">or</span>
          <span className="flex-1 h-px bg-white/10" />
        </div>

        {/* Guest */}
        <button
          onClick={() => { play('tap'); continueAsGuest(); }}
          className="inline-flex items-center justify-center w-full rounded-2xl min-h-[48px] px-6
            border border-white/10 text-forge-text-soft font-condensed uppercase tracking-wider text-[13px]
            hover:bg-white/5 hover:text-forge-text press-scale cursor-pointer transition-all duration-200"
        >
          Continue as Guest
        </button>

        <p className="text-center text-[11px] text-forge-dim mt-3 font-condensed tracking-wide">
          No ads · No tracking · Built for athletes
        </p>
      </div>
    </div>
  );
}

function AmbientWash() {
  return (
    <>
      <div aria-hidden className="absolute inset-0 pointer-events-none hero-wash" />
      <div
        aria-hidden
        className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(46,204,113,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}
      />
    </>
  );
}

function MiniFeature({ Icon, title }: { Icon: typeof Dumbbell; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-forge-green/20 to-forge-green/5 flex items-center justify-center border border-forge-green/15 shrink-0">
        <Icon size={14} className="text-forge-green" />
      </div>
      <span className="text-forge-text-soft text-[13px] font-condensed font-semibold">{title}</span>
    </div>
  );
}

export default function App() {
  const {
    user, loading, isGuest,
    signInWithEmail, signUpWithEmail, resetPassword, continueAsGuest,
  } = useAuth();
  useCloudSync();

  // Keep document direction/lang in sync with the language setting at runtime
  // (initial value is set in main.tsx before React mounts to avoid a flash).
  const language = useSettingsStore((s) => s.settings.language);
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  if (loading) return <SplashScreen />;

  if (!user && !isGuest) {
    return (
      <>
        <AuthScreen
          signInWithEmail={signInWithEmail}
          signUpWithEmail={signUpWithEmail}
          resetPassword={resetPassword}
          continueAsGuest={continueAsGuest}
        />
        <OfflineBanner />
      </>
    );
  }

  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <div className="min-h-dvh bg-forge-bg flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-forge-green focus:text-forge-bg-deep focus:px-4 focus:py-2 focus:rounded-lg focus:z-[70] font-condensed font-semibold"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="flex-1 overflow-y-auto pb-28 page-enter" role="main">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/log" element={<LogPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/social" element={<SocialPage />} />
              <Route path="/coach" element={<CoachPage />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="*" element={<Navigate to="/log" replace />} />
            </Routes>
          </Suspense>
        </main>
        <BottomNav />
        <OfflineBanner />
      </div>
    </BrowserRouter>
  );
}
