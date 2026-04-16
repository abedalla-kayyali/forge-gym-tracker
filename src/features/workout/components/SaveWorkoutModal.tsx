import { useMemo, useState, useRef } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { SessionPoster } from '../../poster/components/SessionPoster';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { useGamificationStore } from '../../../stores/useGamificationStore';
import { useToast } from '../../../components/ui/Toast';
import { useFX } from '../../../hooks/useFX';
import type { Workout } from '../../../types/workout';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function SaveWorkoutModal({ open, onClose, onSaved }: Props) {
  const session = useSessionStore();
  const addWorkout = useWorkoutStore((s) => s.addWorkout);
  const addXP = useGamificationStore((s) => s.addXP);
  const { toast } = useToast();
  const { play } = useFX();
  const [saved, setSaved] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const savedWorkoutRef = useRef<Workout | null>(null);

  const summary = useMemo(() => {
    const totalSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const totalVolume = session.exercises.reduce(
      (acc, ex) => acc + ex.sets.reduce((setAcc, s) => setAcc + s.reps * s.weight, 0),
      0,
    );
    const duration = session.startTime ? Math.floor((Date.now() - session.startTime) / 60000) : 0;
    const muscles = [...new Set(session.exercises.map((e) => e.muscle))];
    return { totalSets, totalVolume, duration, muscles, exerciseCount: session.exercises.length };
  }, [session.exercises, session.startTime]);

  const handleSave = () => {
    if (session.exercises.length === 0) {
      toast('Add at least one exercise!', 'error');
      return;
    }

    const workout: Workout = {
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
      name: summary.muscles.join(' + ') || 'Workout',
      exercises: session.exercises,
      duration: summary.duration,
    };

    addWorkout(workout);
    savedWorkoutRef.current = workout;
    addXP(summary.totalSets * 5 + summary.exerciseCount * 10);
    play('success');
    toast('Workout saved!', 'success');
    session.reset();
    setSaved(true);
  };

  const handleDone = () => {
    setSaved(false);
    savedWorkoutRef.current = null;
    onSaved();
    onClose();
  };

  // Reset state when modal closes
  const handleClose = () => {
    if (saved) {
      handleDone();
    } else {
      onClose();
    }
  };

  return (
    <>
      <Modal open={open} onClose={handleClose} title={saved ? 'Workout Saved!' : 'End Workout'}>
        {!saved ? (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-forge-bg rounded-lg p-3 text-center">
                <div className="text-forge-green text-2xl font-display">{summary.duration}</div>
                <div className="text-forge-muted text-xs font-condensed">Minutes</div>
              </div>
              <div className="bg-forge-bg rounded-lg p-3 text-center">
                <div className="text-forge-green text-2xl font-display">{summary.exerciseCount}</div>
                <div className="text-forge-muted text-xs font-condensed">Exercises</div>
              </div>
              <div className="bg-forge-bg rounded-lg p-3 text-center">
                <div className="text-forge-green text-2xl font-display">{summary.totalSets}</div>
                <div className="text-forge-muted text-xs font-condensed">Sets</div>
              </div>
              <div className="bg-forge-bg rounded-lg p-3 text-center">
                <div className="text-forge-green text-2xl font-display">
                  {Math.round(summary.totalVolume).toLocaleString()}
                </div>
                <div className="text-forge-muted text-xs font-condensed">Volume (kg)</div>
              </div>
            </div>

            {/* Muscles worked */}
            {summary.muscles.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {summary.muscles.map((m) => (
                  <span
                    key={m}
                    className="bg-forge-green/10 text-forge-green text-xs px-2 py-0.5 rounded-full font-condensed"
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 bg-forge-surface text-forge-muted border border-forge-border py-2.5 rounded-lg font-condensed"
              >
                Keep Going
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-forge-green text-forge-bg py-2.5 rounded-lg font-condensed font-semibold"
              >
                Save Workout
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div className="text-4xl">🎉</div>
            <p className="text-forge-text font-condensed">Great session!</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPoster(true)}
                className="flex-1 bg-forge-surface text-forge-green border border-forge-green/30 py-2.5 rounded-lg font-condensed font-semibold text-sm"
              >
                View Poster
              </button>
              <button
                onClick={handleDone}
                className="flex-1 bg-forge-green text-forge-bg py-2.5 rounded-lg font-condensed font-semibold text-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      <SessionPoster
        workout={savedWorkoutRef.current}
        open={showPoster}
        onClose={() => setShowPoster(false)}
      />
    </>
  );
}
