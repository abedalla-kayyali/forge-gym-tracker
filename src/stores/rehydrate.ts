import { useWorkoutStore } from './useWorkoutStore';
import { useBwWorkoutStore } from './useBwWorkoutStore';
import { useCardioStore } from './useCardioStore';
import { useBodyStore } from './useBodyStore';
import { useProfileStore } from './useProfileStore';
import { useSettingsStore } from './useSettingsStore';
import { useNutritionStore } from './useNutritionStore';
import { useStepsStore } from './useStepsStore';
import { useGamificationStore } from './useGamificationStore';
import { useCustomExercisesStore } from './useCustomExercisesStore';

/**
 * Re-read every persisted store from localStorage. Call this after a cloud pull
 * has mutated localStorage (see `forge:pulled` in lib/cloudSync) so the
 * in-memory zustand stores reflect the newly-synced data without requiring a
 * full page reload.
 *
 * `useSessionStore` is intentionally excluded — it is in-memory session state,
 * not persisted, and has no `hydrate()`.
 */
export function rehydrateAllStores(): void {
  useWorkoutStore.getState().hydrate();
  useBwWorkoutStore.getState().hydrate();
  useCardioStore.getState().hydrate();
  useBodyStore.getState().hydrate();
  useProfileStore.getState().hydrate();
  useSettingsStore.getState().hydrate();
  useNutritionStore.getState().hydrate();
  useStepsStore.getState().hydrate();
  useGamificationStore.getState().hydrate();
  useCustomExercisesStore.getState().hydrate();
}
