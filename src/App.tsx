import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';

// Lazy-loaded pages
const LogPage = lazy(() => import('./pages/LogPage').then((m) => ({ default: m.LogPage })));
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const CoachPage = lazy(() => import('./pages/CoachPage').then((m) => ({ default: m.CoachPage })));
const MorePage = lazy(() => import('./pages/MorePage').then((m) => ({ default: m.MorePage })));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-forge-green font-display text-xl animate-pulse">Loading...</div>
    </div>
  );
}

export default function App() {
  const { user, loading, isGuest, signInWithGoogle, continueAsGuest } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forge-bg">
        <div className="text-forge-green text-2xl font-display animate-pulse">FORGE</div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-forge-bg p-8">
        <h1 className="text-forge-green text-5xl font-display">FORGE</h1>
        <p className="text-forge-muted text-center">Your personal gym operating system</p>
        <button
          onClick={signInWithGoogle}
          className="bg-forge-green text-forge-bg px-8 py-3 rounded-lg font-condensed font-semibold text-lg"
        >
          Sign in with Google
        </button>
        <button
          onClick={continueAsGuest}
          className="text-forge-muted underline text-sm"
        >
          Continue as guest
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-forge-bg flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-forge-green focus:text-forge-bg focus:px-4 focus:py-2 focus:rounded focus:z-50"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content" className="flex-1 overflow-y-auto pb-16" role="main">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/log" element={<LogPage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/coach" element={<CoachPage />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="*" element={<Navigate to="/log" replace />} />
            </Routes>
          </Suspense>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
