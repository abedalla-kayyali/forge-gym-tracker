import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuth } from './hooks/useAuth';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { LogPage } from './pages/LogPage';
import { DashboardPage } from './pages/DashboardPage';
import { CoachPage } from './pages/CoachPage';
import { BodyPage } from './pages/BodyPage';
import { SettingsPage } from './pages/SettingsPage';

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
        <Header />
        <main className="flex-1 overflow-y-auto pb-16">
          <Routes>
            <Route path="/log" element={<LogPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/coach" element={<CoachPage />} />
            <Route path="/body" element={<BodyPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/log" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
