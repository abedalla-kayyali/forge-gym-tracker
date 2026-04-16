import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { CardioEntry } from '../types/workout';

interface CardioState {
  entries: CardioEntry[];
  hydrate: () => void;
  addEntry: (e: CardioEntry) => void;
  deleteEntry: (id: string) => void;
  getByDate: (isoDate: string) => CardioEntry[];
  getByType: (type: string) => CardioEntry[];
}

export const useCardioStore = create<CardioState>((set, get) => ({
  entries: readStorage<CardioEntry[]>(STORAGE_KEYS.CARDIO, []),

  hydrate: () => {
    set({ entries: readStorage<CardioEntry[]>(STORAGE_KEYS.CARDIO, []) });
  },

  addEntry: (e) => {
    const updated = [...get().entries, e];
    writeStorage(STORAGE_KEYS.CARDIO, updated);
    set({ entries: updated });
  },

  deleteEntry: (id) => {
    const updated = get().entries.filter((e) => e.id !== id);
    writeStorage(STORAGE_KEYS.CARDIO, updated);
    set({ entries: updated });
  },

  getByDate: (isoDate) => {
    return get().entries.filter((e) => e.date.startsWith(isoDate));
  },

  getByType: (type) => {
    return get().entries.filter((e) => e.type === type);
  },
}));
