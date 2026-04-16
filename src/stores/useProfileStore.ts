import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { UserProfile, Readiness, ReadinessLog } from '../types/profile';

interface ProfileState {
  profile: UserProfile;
  readiness: ReadinessLog;
  readinessToday: Readiness | null;
  hydrate: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setReadinessToday: (r: Readiness) => void;
}

const DEFAULT_PROFILE: UserProfile = { name: '' };

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: readStorage<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE),
  readiness: readStorage<ReadinessLog>(STORAGE_KEYS.READINESS, {}),
  readinessToday: readStorage<Readiness | null>(STORAGE_KEYS.READINESS_TODAY, null),

  hydrate: () => {
    set({
      profile: readStorage<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE),
      readiness: readStorage<ReadinessLog>(STORAGE_KEYS.READINESS, {}),
      readinessToday: readStorage<Readiness | null>(STORAGE_KEYS.READINESS_TODAY, null),
    });
  },

  updateProfile: (updates) => {
    const updated = { ...get().profile, ...updates };
    writeStorage(STORAGE_KEYS.PROFILE, updated);
    set({ profile: updated });
  },

  setReadinessToday: (r) => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const updatedLog = { ...get().readiness, [todayKey]: r };
    writeStorage(STORAGE_KEYS.READINESS_TODAY, r);
    writeStorage(STORAGE_KEYS.READINESS, updatedLog);
    set({ readinessToday: r, readiness: updatedLog });
  },
}));
