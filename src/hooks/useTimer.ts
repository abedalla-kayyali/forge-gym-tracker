import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionStore } from '../stores/useSessionStore';
import { useFX } from './useFX';

interface TimerState {
  sessionElapsed: string; // "MM:SS"
  sessionSeconds: number;
  restRemaining: number; // seconds remaining
  restTotal: number; // total rest time in seconds
  restActive: boolean;
  startRest: () => void;
  cancelRest: () => void;
  setRestPreset: (seconds: number) => void;
}

export function useTimer(): TimerState {
  const session = useSessionStore();
  const { play } = useFX();
  const [tick, setTick] = useState(0);

  // Tick every second when session is active or rest is running
  useEffect(() => {
    if (!session.active && !session.restTimerStart) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [session.active, session.restTimerStart]);

  // Session elapsed
  const sessionSeconds = session.active && session.startTime
    ? Math.floor((Date.now() - session.startTime) / 1000)
    : 0;

  const mins = Math.floor(sessionSeconds / 60).toString().padStart(2, '0');
  const secs = (sessionSeconds % 60).toString().padStart(2, '0');
  const sessionElapsed = `${mins}:${secs}`;

  // Rest timer
  const restElapsed = session.restTimerStart
    ? Math.floor((Date.now() - session.restTimerStart) / 1000)
    : 0;
  const restRemaining = Math.max(0, session.restTimerTarget - restElapsed);
  const restActive = session.restTimerStart !== null && restRemaining > 0;

  // Auto-play sound when rest finishes
  useEffect(() => {
    if (session.restTimerStart !== null && restRemaining === 0) {
      play('timer');
      session.clearRestTimer();
    }
  }, [restRemaining, session.restTimerStart, play, session]);

  // 3-2-1 countdown tick (deduped per second value)
  const lastTick = useRef(-1);
  useEffect(() => {
    if (restActive && restRemaining > 0 && restRemaining <= 3) {
      if (lastTick.current !== restRemaining) {
        play('tick');
        lastTick.current = restRemaining;
      }
    } else if (!restActive) {
      lastTick.current = -1;
    }
  }, [restRemaining, restActive, play]);

  const startRest = useCallback(() => {
    session.startRestTimer();
  }, [session]);

  const cancelRest = useCallback(() => {
    session.clearRestTimer();
  }, [session]);

  const setRestPreset = useCallback((seconds: number) => {
    session.setRestTimer(seconds);
  }, [session]);

  // Force re-render to consume tick
  void tick;

  return {
    sessionElapsed,
    sessionSeconds,
    restRemaining,
    restTotal: session.restTimerTarget,
    restActive,
    startRest,
    cancelRest,
    setRestPreset,
  };
}
