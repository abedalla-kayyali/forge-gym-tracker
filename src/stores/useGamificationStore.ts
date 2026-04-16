import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { Achievement } from '../types/gamification';

interface LevelInfo {
  level: number;
  name: string;
  progress: number;
}

interface GamificationState {
  achievements: Achievement[];
  experience: number;
  hydrate: () => void;
  addAchievement: (a: Achievement) => void;
  addXP: (amount: number) => void;
  getLevel: () => LevelInfo;
}

const LEVEL_TABLE: Array<{ level: number; name: string; minXP: number }> = [
  { level: 1, name: 'ROOKIE',    minXP: 0 },
  { level: 2, name: 'IRON',      minXP: 100 },
  { level: 3, name: 'BRONZE',    minXP: 300 },
  { level: 4, name: 'SILVER',    minXP: 600 },
  { level: 5, name: 'GOLD',      minXP: 1000 },
  { level: 6, name: 'PLATINUM',  minXP: 1500 },
  { level: 7, name: 'DIAMOND',   minXP: 2200 },
  { level: 8, name: 'LEGEND',    minXP: 3000 },
];

export const useGamificationStore = create<GamificationState>((set, get) => ({
  achievements: readStorage<Achievement[]>(STORAGE_KEYS.ACHIEVEMENTS, []),
  experience: readStorage<number>(STORAGE_KEYS.EXPERIENCE, 0),

  hydrate: () => {
    set({
      achievements: readStorage<Achievement[]>(STORAGE_KEYS.ACHIEVEMENTS, []),
      experience: readStorage<number>(STORAGE_KEYS.EXPERIENCE, 0),
    });
  },

  addAchievement: (a) => {
    const updated = [...get().achievements, a];
    writeStorage(STORAGE_KEYS.ACHIEVEMENTS, updated);
    set({ achievements: updated });
  },

  addXP: (amount) => {
    const updated = get().experience + amount;
    writeStorage(STORAGE_KEYS.EXPERIENCE, updated);
    set({ experience: updated });
  },

  getLevel: (): LevelInfo => {
    const xp = get().experience;
    let currentIdx = 0;
    for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
      const entry = LEVEL_TABLE[i];
      if (entry !== undefined && xp >= entry.minXP) {
        currentIdx = i;
        break;
      }
    }
    const current = LEVEL_TABLE[currentIdx];
    const next = LEVEL_TABLE[currentIdx + 1];
    if (current === undefined) {
      return { level: 1, name: 'ROOKIE', progress: 0 };
    }
    let progress = 100;
    if (next !== undefined) {
      const range = next.minXP - current.minXP;
      const earned = xp - current.minXP;
      progress = Math.min(100, Math.round((earned / range) * 100));
    }
    return { level: current.level, name: current.name, progress };
  },
}));
