import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useProfileStore } from '../stores/useProfileStore';
import { readStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isGuest = readStorage<string>(STORAGE_KEYS.GUEST, '0') === '1';
  const updateProfile = useProfileStore((s) => s.updateProfile);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.full_name) {
        updateProfile({ name: session.user.user_metadata.full_name as string });
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [updateProfile]);

  const signInWithGoogle = useCallback(async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const continueAsGuest = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.GUEST, '1');
    setLoading(false);
  }, []);

  return { user, loading, isGuest, signInWithGoogle, signOut, continueAsGuest };
}
