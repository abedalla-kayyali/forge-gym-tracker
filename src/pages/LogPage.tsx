import { useState, useCallback } from 'react';
import { WorkoutTypeSelector, type WorkoutType } from '../features/workout';
import { MuscleGroupPicker } from '../features/workout';
import { ExerciseAutocomplete } from '../features/workout';
import { SetLogger } from '../features/workout';
import { RestTimer } from '../features/workout';
import { SaveWorkoutModal } from '../features/workout/components/SaveWorkoutModal';
import { useSessionStore } from '../stores/useSessionStore';
import { useToast } from '../components/ui/Toast';
import { useFX } from '../hooks/useFX';
import type { WorkoutSet, WorkoutExercise, MuscleGroup } from '../types/workout';

export function LogPage() {
  const [workoutType, setWorkoutType] = useState<WorkoutType>('weighted');
  const [currentSets, setCurrentSets] = useState<WorkoutSet[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const session = useSessionStore();
  const { toast } = useToast();
  const { play } = useFX();

  // Start session if not active
  const handleStartSession = useCallback(() => {
    session.start();
    play('tap');
  }, [session, play]);

  // Select muscle group
  const handleMuscleSelect = useCallback(
    (muscle: MuscleGroup) => {
      session.setMuscle(muscle);
      session.setExercise('');
      setCurrentSets([]);
    },
    [session],
  );

  // Select exercise
  const handleExerciseSelect = useCallback(
    (name: string) => {
      session.setExercise(name);
      setCurrentSets([]);
    },
    [session],
  );

  // Add a set to current exercise
  const handleAddSet = useCallback(
    (set: WorkoutSet) => {
      setCurrentSets((prev) => [...prev, set]);
      play('tap');
    },
    [play],
  );

  // Remove a set
  const handleRemoveSet = useCallback((index: number) => {
    setCurrentSets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Log the exercise (commit sets to session)
  const handleLogExercise = useCallback(() => {
    if (!session.selectedExercise || currentSets.length === 0) {
      toast('Add at least one set!', 'error');
      return;
    }

    const exercise: WorkoutExercise = {
      name: session.selectedExercise,
      muscle: session.selectedMuscle ?? '',
      sets: currentSets,
    };

    session.addExercise(exercise);
    play('save');
    toast(`${session.selectedExercise} logged — ${currentSets.length} sets`, 'success');
    setCurrentSets([]);
    session.setExercise('');
  }, [session, currentSets, play, toast]);

  // Not started yet — show start button
  if (!session.active) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-4">
        <div className="text-6xl">🏋️</div>
        <h2 className="text-forge-green font-display text-3xl">Ready to train?</h2>
        <p className="text-forge-muted text-center text-sm max-w-xs">
          Start a session to log your exercises, sets, and track your progress.
        </p>
        <button
          onClick={handleStartSession}
          className="bg-forge-green text-forge-bg px-10 py-3.5 rounded-xl font-condensed font-bold text-lg"
        >
          Start Workout
        </button>
      </div>
    );
  }

  // Active session
  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Workout type */}
      <WorkoutTypeSelector value={workoutType} onChange={setWorkoutType} />

      {workoutType === 'weighted' && (
        <>
          {/* Muscle group */}
          <div>
            <label className="text-forge-muted text-xs font-condensed block mb-2">MUSCLE GROUP</label>
            <MuscleGroupPicker
              selected={session.selectedMuscle}
              onSelect={handleMuscleSelect}
            />
          </div>

          {/* Exercise */}
          <div>
            <label className="text-forge-muted text-xs font-condensed block mb-2">EXERCISE</label>
            <ExerciseAutocomplete
              muscle={session.selectedMuscle}
              value={session.selectedExercise ?? ''}
              onChange={handleExerciseSelect}
            />
          </div>

          {/* Set Logger — only when exercise is selected */}
          {session.selectedExercise && (
            <div>
              <label className="text-forge-muted text-xs font-condensed block mb-2">
                SETS — {session.selectedExercise}
              </label>
              <SetLogger
                exerciseName={session.selectedExercise}
                sets={currentSets}
                onAddSet={handleAddSet}
                onRemoveSet={handleRemoveSet}
              />
              {currentSets.length > 0 && (
                <button
                  onClick={handleLogExercise}
                  className="w-full mt-3 bg-forge-green/20 text-forge-green border border-forge-green/30 py-2.5 rounded-lg font-condensed font-semibold text-sm"
                >
                  Log Exercise ({currentSets.length} sets)
                </button>
              )}
            </div>
          )}

          {/* Rest Timer */}
          <RestTimer />

          {/* Logged exercises summary */}
          {session.exercises.length > 0 && (
            <div className="space-y-2">
              <label className="text-forge-muted text-xs font-condensed block">
                LOGGED ({session.exercises.length} exercises)
              </label>
              {session.exercises.map((ex, i) => (
                <div
                  key={i}
                  className="bg-forge-surface border border-forge-border rounded-lg px-3 py-2 flex items-center justify-between"
                >
                  <div>
                    <div className="text-forge-text text-sm font-body">{ex.name}</div>
                    <div className="text-forge-muted text-xs font-mono">
                      {ex.sets.length} sets —{' '}
                      {ex.sets.reduce((a, s) => a + s.reps * s.weight, 0).toLocaleString()} kg volume
                    </div>
                  </div>
                  <span className="text-forge-green/50 text-xs font-condensed">{ex.muscle}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {workoutType === 'bodyweight' && (
        <div className="flex flex-col items-center justify-center py-12 text-forge-muted">
          <span className="text-4xl mb-3">💪</span>
          <p className="font-condensed">Bodyweight mode — Phase 7</p>
        </div>
      )}

      {workoutType === 'cardio' && (
        <div className="flex flex-col items-center justify-center py-12 text-forge-muted">
          <span className="text-4xl mb-3">🏃</span>
          <p className="font-condensed">Cardio mode — Phase 7</p>
        </div>
      )}

      {/* End Workout button */}
      {session.exercises.length > 0 && (
        <button
          onClick={() => setShowSaveModal(true)}
          className="w-full bg-red-600/20 text-red-400 border border-red-600/30 py-3 rounded-xl font-condensed font-semibold text-sm"
        >
          End Workout
        </button>
      )}

      {/* Save Modal */}
      <SaveWorkoutModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSaved={() => setWorkoutType('weighted')}
      />
    </div>
  );
}
