import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { BodyWeightEntry, Measurement, InBodyEntry } from '../types/body';

interface BodyState {
  bodyWeight: BodyWeightEntry[];
  measurements: Measurement[];
  inbody: InBodyEntry[];
  hydrate: () => void;
  addWeightEntry: (entry: BodyWeightEntry) => void;
  addMeasurement: (m: Measurement) => void;
  addInBody: (entry: InBodyEntry) => void;
  deleteWeightEntry: (date: string) => void;
}

export const useBodyStore = create<BodyState>((set, get) => ({
  bodyWeight: readStorage<BodyWeightEntry[]>(STORAGE_KEYS.BODY_WEIGHT, []),
  measurements: readStorage<Measurement[]>(STORAGE_KEYS.MEASUREMENTS, []),
  inbody: readStorage<InBodyEntry[]>(STORAGE_KEYS.INBODY, []),

  hydrate: () => {
    set({
      bodyWeight: readStorage<BodyWeightEntry[]>(STORAGE_KEYS.BODY_WEIGHT, []),
      measurements: readStorage<Measurement[]>(STORAGE_KEYS.MEASUREMENTS, []),
      inbody: readStorage<InBodyEntry[]>(STORAGE_KEYS.INBODY, []),
    });
  },

  addWeightEntry: (entry) => {
    const updated = [...get().bodyWeight, entry];
    writeStorage(STORAGE_KEYS.BODY_WEIGHT, updated);
    set({ bodyWeight: updated });
  },

  addMeasurement: (m) => {
    const updated = [...get().measurements, m];
    writeStorage(STORAGE_KEYS.MEASUREMENTS, updated);
    set({ measurements: updated });
  },

  addInBody: (entry) => {
    const updated = [...get().inbody, entry];
    writeStorage(STORAGE_KEYS.INBODY, updated);
    set({ inbody: updated });
  },

  deleteWeightEntry: (date) => {
    const updated = get().bodyWeight.filter((e) => e.date !== date);
    writeStorage(STORAGE_KEYS.BODY_WEIGHT, updated);
    set({ bodyWeight: updated });
  },
}));
