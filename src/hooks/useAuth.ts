import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useProfileStore } from '../stores/useProfileStore';
import { readStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import {
  saveFingerprint,
  verifyOfflineCredentials,
  hasOfflineFingerprint,
  markOfflineSession,
  clearOfflineSession,
  getOfflineSession,
  isLikelyNetworkError,
} from '../lib/offlineAuth';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  offlineEmail: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string; offline?: boolean }>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<{ error?: string; needsConfirm?: boolean }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuest: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(
    () => readStorage<string>(STORAGE_KEYS.GUEST, '0') === '1',
  );
  const [offlineEmail, setOfflineEmail] = useState<string | null>(
    () => getOfflineSession()?.email ?? null,
  );
  const updateProfile = useProfileStore((s) => s.updateProfile);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.full_name) {
        updateProfile({ name: session.user.user_metadata.full_name as string });
      }
      if (session?.user) {
        localStorage.setItem(STORAGE_KEYS.GUEST, '0');
        setIsGuest(false);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        localStorage.setItem(STORAGE_KEYS.GUEST, '0');
        setIsGuest(false);
        if (session.user.user_metadata?.full_name) {
          updateProfile({ name: session.user.user_metadata.full_name as string });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [updateProfile]);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // If this looks like Supabase being unreachable, try offline fallback
        if (isLikelyNetworkError(error) && hasOfflineFingerprint()) {
          const ok = await verifyOfflineCredentials(email, password);
          if (ok) {
            markOfflineSession(email);
            setOfflineEmail(email.toLowerCase());
            localStorage.setItem(STORAGE_KEYS.GUEST, '1');
            setIsGuest(true);
            return { offline: true };
          }
        }
        return { error: error.message };
      }
      // Online success — cache fingerprint for future offline logins
      void saveFingerprint(email, password);
      return {};
    } catch (e) {
      // Network throw (fetch failed). Try offline fallback.
      if (isLikelyNetworkError(e) && hasOfflineFingerprint()) {
        const ok = await verifyOfflineCredentials(email, password);
        if (ok) {
          markOfflineSession(email);
          setOfflineEmail(email.toLowerCase());
          localStorage.setItem(STORAGE_KEYS.GUEST, '1');
          setIsGuest(true);
          return { offline: true };
        }
      }
      return { error: (e as Error).message || 'Network error' };
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: displayName ? { full_name: displayName } : undefined,
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) return { error: error.message };
      // Cache fingerprint even before confirmation so they can offline-login after first online login
      void saveFingerprint(email, password);
      const needsConfirm = !data.session;
      return { needsConfirm };
    } catch (e) {
      return { error: (e as Error).message || 'Network error' };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch { /* offline */ }
    clearOfflineSession();
    setOfflineEmail(null);
    setUser(null);
  }, []);

  const continueAsGuest = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.GUEST, '1');
    setIsGuest(true);
    setLoading(false);
  }, []);

  const exitGuest = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.GUEST, '0');
    setIsGuest(false);
  }, []);

  return {
    user, loading, isGuest, offlineEmail,
    signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword,
    signOut, continueAsGuest, exitGuest,
  };
}
