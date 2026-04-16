import { useAuth } from './hooks/useAuth';

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
    <div className="min-h-screen bg-forge-bg">
      <p className="text-forge-green text-center pt-10 font-display text-3xl">
        FORGE — Logged in as {user?.email ?? 'Guest'}
      </p>
      <p className="text-forge-muted text-center mt-2">Shell + navigation coming in Phase 2</p>
    </div>
  );
}
