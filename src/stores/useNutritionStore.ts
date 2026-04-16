import { create } from 'zustand';
import { readStorage, writeStorage } from '../lib/storage';
import { STORAGE_KEYS } from '../lib/constants';
import type { Meal, MealsLog, MealLibrary, MacroTargets, WaterHistory } from '../types/nutrition';

const DEFAULT_MACRO_TARGETS: MacroTargets = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 250,
  fat_g: 65,
};

interface NutritionState {
  meals: MealsLog;
  mealLibrary: MealLibrary;
  macroTargets: MacroTargets;
  water: WaterHistory;
  hydrate: () => void;
  addMeal: (date: string, meal: Meal) => void;
  deleteMeal: (date: string, index: number) => void;
  saveMealToLibrary: (name: string, meal: Meal) => void;
  setMacroTargets: (targets: MacroTargets) => void;
  addWater: (date: string) => void;
  undoWater: (date: string) => void;
  setWaterGoal: (date: string, goal: number) => void;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  meals: readStorage<MealsLog>(STORAGE_KEYS.MEALS, {}),
  mealLibrary: readStorage<MealLibrary>(STORAGE_KEYS.MEAL_LIBRARY, {}),
  macroTargets: readStorage<MacroTargets>(STORAGE_KEYS.MACRO_TARGETS, DEFAULT_MACRO_TARGETS),
  water: readStorage<WaterHistory>(STORAGE_KEYS.WATER, {}),

  hydrate: () => {
    set({
      meals: readStorage<MealsLog>(STORAGE_KEYS.MEALS, {}),
      mealLibrary: readStorage<MealLibrary>(STORAGE_KEYS.MEAL_LIBRARY, {}),
      macroTargets: readStorage<MacroTargets>(STORAGE_KEYS.MACRO_TARGETS, DEFAULT_MACRO_TARGETS),
      water: readStorage<WaterHistory>(STORAGE_KEYS.WATER, {}),
    });
  },

  addMeal: (date, meal) => {
    const current = get().meals;
    const dayMeals = current[date] ?? { meals: [] };
    const updated: MealsLog = {
      ...current,
      [date]: { meals: [...dayMeals.meals, meal] },
    };
    writeStorage(STORAGE_KEYS.MEALS, updated);
    set({ meals: updated });
  },

  deleteMeal: (date, index) => {
    const current = get().meals;
    const dayMeals = current[date];
    if (!dayMeals) return;
    const updatedMeals = dayMeals.meals.filter((_, i) => i !== index);
    const updated: MealsLog = { ...current, [date]: { meals: updatedMeals } };
    writeStorage(STORAGE_KEYS.MEALS, updated);
    set({ meals: updated });
  },

  saveMealToLibrary: (name, meal) => {
    const updated = { ...get().mealLibrary, [name]: meal };
    writeStorage(STORAGE_KEYS.MEAL_LIBRARY, updated);
    set({ mealLibrary: updated });
  },

  setMacroTargets: (targets) => {
    writeStorage(STORAGE_KEYS.MACRO_TARGETS, targets);
    set({ macroTargets: targets });
  },

  addWater: (date) => {
    const current = get().water;
    const day = current[date] ?? { cups_drunk: 0, goal_cups: 8 };
    const updated: WaterHistory = {
      ...current,
      [date]: { ...day, cups_drunk: day.cups_drunk + 1 },
    };
    writeStorage(STORAGE_KEYS.WATER, updated);
    set({ water: updated });
  },

  undoWater: (date) => {
    const current = get().water;
    const day = current[date] ?? { cups_drunk: 0, goal_cups: 8 };
    const cups_drunk = Math.max(0, day.cups_drunk - 1);
    const updated: WaterHistory = { ...current, [date]: { ...day, cups_drunk } };
    writeStorage(STORAGE_KEYS.WATER, updated);
    set({ water: updated });
  },

  setWaterGoal: (date, goal) => {
    const current = get().water;
    const day = current[date] ?? { cups_drunk: 0, goal_cups: 8 };
    const updated: WaterHistory = { ...current, [date]: { ...day, goal_cups: goal } };
    writeStorage(STORAGE_KEYS.WATER, updated);
    set({ water: updated });
  },
}));
