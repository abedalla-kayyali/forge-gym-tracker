import { useCallback } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { sounds, haptics, createRipple, prefersReducedMotion } from '../lib/fx';

type FXEvent = 'tap' | 'tick' | 'save' | 'success' | 'pr' | 'levelUp' | 'error' | 'timer';

export function useFX() {
  const soundEnabled = useSettingsStore((s) => s.settings.sound);
  const hapticEnabled = useSettingsStore((s) => s.settings.haptic);

  const play = useCallback(
    (event: FXEvent) => {
      if (soundEnabled) sounds[event]();
      if (hapticEnabled) haptics[event]();
    },
    [soundEnabled, hapticEnabled],
  );

  const ripple = useCallback(
    (element: HTMLElement, color?: string) => {
      if (!prefersReducedMotion()) createRipple(element, color);
      play('tap');
    },
    [play],
  );

  return { play, ripple };
}
