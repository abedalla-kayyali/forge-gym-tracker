import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dumbbell, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { WorkoutTypeSelector, type WorkoutType } from '../features/workout';
import { MuscleGroupPicker } from '../features/workout';
import { ExerciseAutocomplete } from '../features/workout';
import { SetLogger } from '../features/workout';
import { RestTimer } from '../features/workout';
import { BwLogger } from '../features/workout';
import { CardioLogger } from '../features/workout';
import { SaveWorkoutModal } from '../features/workout/components/SaveWorkoutModal';
import { TopExercisesCard } from '../features/workout/components/TopExercisesCard';
import { SessionStreakCard } from '../features/workout/components/SessionStreakCard';
import { ProgressGuide } from '../features/workout/components/ProgressGuide';
import { useSessionStore } from '../stores/useSessionStore';
import { useCustomExercisesStore } from '../stores/useCustomExercisesStore';
import { useToast } from '../components/ui/Toast';
import { useFX } from '../hooks/useFX';
import { searchExercises } from '../lib/exercises-db';
import { formatDate } from '../lib/format';
import type { WorkoutSet, WorkoutExercise, MuscleGroup } from '../types/workout';

function CircleRing({ size = 200 }: { size?: number }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="absolute inset-0 m-auto opacity-20 pointer-events-none" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="1.5" strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`} strokeLinecap="round" transform={`rotate(135 ${size / 2} ${size / 2})`} />
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2ecc71" stopOpacity="1" />
          <stop offset="100%" stopColor="#27ae60" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function LoggedExerciseCard({ ex, index }: { ex: WorkoutExercise; index: number }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const totalVol = ex.sets.reduce((a, s) => a + s.reps * s.weight, 0);

  return (
    <div className="card-elevated rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-forge-green/10 flex items-center justify-center">
            <span className="text-forge-green text-xs font-display">{index + 1}</span>
          </div>
          <div className="text-left">
            <div className="text-forge-text text-sm font-body font-medium">{ex.name}</div>
            <div className="text-forge-muted text-[11px] font-mono">
              {t('logPage.exerciseSummary', { count: ex.sets.length, vol: totalVol.toLocaleString() })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-forge-green/60 text-[10px] font-condensed uppercase">{ex.muscle ? t('muscles.' + String(ex.muscle).toLowerCase()) : ''}</span>
          {open ? <ChevronUp size={14} className="text-forge-dim" /> : <ChevronDown size={14} className="text-forge-dim" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-forge-border-light">
          <div className="grid grid-cols-4 px-4 py-2 text-[10px] font-condensed text-forge-dim uppercase tracking-wider">
            <span>{t('logPage.colSet')}</span><span className="text-center">{t('logPage.colReps')}</span><span className="text-center">{t('logPage.colWeight')}</span><span className="text-right">{t('logPage.colVol')}</span>
          </div>
          {ex.sets.map((s, si) => (
            <div key={si} className={`grid grid-cols-4 px-4 py-2 text-xs font-mono ${si % 2 === 0 ? 'bg-[rgba(255,255,255,0.015)]' : ''}`}>
              <span className="text-forge-muted">{si + 1}</span>
              <span className="text-center text-forge-text">{s.reps}</span>
              <span className="text-center text-forge-text">{s.weight}{t('log.kgUnit')}</span>
              <span className="text-right text-forge-green/70">{(s.reps * s.weight).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LogPage() {
  const { t } = useTranslation();
  const session = useSessionStore();
  // Initialise the mode from a restored session so resume keeps the right tab.
  const [workoutType, setWorkoutType] = useState<WorkoutType>(() => {
    const s = useSessionStore.getState();
    return s.active ? (s.type as WorkoutType) : 'weighted';
  });
  const [showSaveModal, setShowSaveModal] = useState(false);
  // In-progress sets now live in the session store so they survive a reload.
  const currentSets = session.currentSets;
  const customStore = useCustomExercisesStore();
  const { toast } = useToast();
  const { play } = useFX();

  // Sync local workoutType ↔ session.type so store knows the mode
  useEffect(() => {
    if (session.active && session.type !== workoutType) session.setType(workoutType);
  }, [workoutType, session]);

  // Start session if not active
  const handleStartSession = useCallback(() => {
    session.start(workoutType);
    play('tap');
  }, [session, workoutType, play]);

  // Select muscle group
  const handleMuscleSelect = useCallback(
    (muscle: MuscleGroup) => {
      session.setMuscle(muscle);
      session.setExercise('');
      session.clearCurrentSets();
    },
    [session],
  );

  // Select exercise
  const handleExerciseSelect = useCallback(
    (name: string) => {
      session.setExercise(name);
      session.clearCurrentSets();
    },
    [session],
  );

  // Add a set to current exercise
  const handleAddSet = useCallback(
    (set: WorkoutSet) => {
      session.addCurrentSet(set);
      play('tap');
    },
    [session, play],
  );

  // Remove a set
  const handleRemoveSet = useCallback((index: number) => {
    session.removeCurrentSet(index);
  }, [session]);

  // Log the exercise (commit sets to session)
  const handleLogExercise = useCallback(() => {
    if (!session.selectedExercise || currentSets.length === 0) {
      toast(t('logPage.addAtLeastOneSet'), 'error');
      return;
    }

    const exercise: WorkoutExercise = {
      name: session.selectedExercise,
      muscle: session.selectedMuscle ?? '',
      sets: currentSets,
    };

    // If the exercise isn't in the curated DB, save it as a custom one so future
    // sessions suggest it automatically.
    const muscleKey = session.selectedMuscle ?? '';
    if (muscleKey) {
      const name = session.selectedExercise;
      const inDb = searchExercises(name, muscleKey).some(
        (e) => e.name.toLowerCase() === name.toLowerCase(),
      );
      if (!inDb) customStore.addCustom(muscleKey, name);
    }

    session.addExercise(exercise);
    play('save');
    toast(t('logPage.exerciseLogged', { name: session.selectedExercise, count: currentSets.length }), 'success');
    session.clearCurrentSets();
    session.setExercise('');
  }, [session, currentSets, play, toast, customStore, t]);

  // Not started yet — Whoop-style start screen
  const today = formatDate(new Date(), { weekday: 'short', month: 'short', day: 'numeric' });

  const content = !session.active ? (
      <div className="page-enter flex flex-col items-center justify-center min-h-[80vh] gap-0 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-forge-green/5 blur-3xl pointer-events-none" />

        {/* Circular ring motif */}
        <div className="relative w-52 h-52 flex items-center justify-center mb-2">
          <CircleRing size={208} />
          <div className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-2xl bg-forge-green/10 border border-forge-green/20 flex items-center justify-center shadow-[0_0_24px_rgba(46,204,113,0.15)]">
              <Dumbbell size={30} className="text-forge-green" />
            </div>
            <span className="text-forge-green/60 text-[10px] font-condensed tracking-widest uppercase mt-1">{t('logPage.ready')}</span>
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-forge-green font-display text-4xl tracking-tight mb-1">FORGE</h2>
        <p className="text-forge-muted text-sm text-center max-w-[220px] mb-6 leading-relaxed">
          {t('logPage.startTagline')}
        </p>

        {/* Quick stat pills */}
        <div className="flex gap-2 mb-6">
          <div className="bg-[rgba(255,255,255,0.04)] border border-forge-border-light rounded-full px-3.5 py-1.5 flex items-center gap-1.5">
            <Zap size={11} className="text-forge-green" />
            <span className="text-forge-dim text-[11px] font-condensed">{today}</span>
          </div>
          <div className="bg-[rgba(255,255,255,0.04)] border border-forge-border-light rounded-full px-3.5 py-1.5 flex items-center gap-1.5">
            <span className="text-forge-muted text-[11px] font-condensed">{session.exercises.length > 0 ? t('logPage.pending', { count: session.exercises.length }) : t('logPage.noActiveSession')}</span>
          </div>
        </div>

        {/* Streak + last session */}
        <div className="w-full px-2 mb-3">
          <SessionStreakCard />
        </div>

        {/* Progress KPI guide — weekly goal · streak · next PR · recommended muscle */}
        <div className="w-full px-2 mb-5 max-w-md mx-auto">
          <ProgressGuide
            onPickMuscle={(m) => {
              // Start session + pre-pick the muscle for instant flow
              handleStartSession();
              setTimeout(() => session.setMuscle(m), 50);
            }}
          />
        </div>

        {/* CTA */}
        <button
          onClick={handleStartSession}
          className="relative bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg px-14 py-4 rounded-2xl font-condensed font-bold text-xl cursor-pointer press-scale min-h-[56px] shadow-[0_8px_32px_rgba(46,204,113,0.35)] tracking-wider transition-all duration-200 hover:shadow-[0_8px_40px_rgba(46,204,113,0.5)]"
        >
          {t('logPage.startSession')}
        </button>

        <p className="text-forge-dim text-[11px] mt-4 font-condensed">{t('logPage.tapToBegin')}</p>
      </div>
  ) : (
    <div className="page-enter p-4 space-y-4 pb-32">
      {/* Workout type */}
      <WorkoutTypeSelector value={workoutType} onChange={setWorkoutType} />

      {workoutType === 'weighted' && (
        <>
          {/* Muscle group */}
          <div>
            <label className="text-forge-muted text-[11px] font-condensed tracking-widest uppercase block mb-2.5">{t('logPage.muscleGroup')}</label>
            <MuscleGroupPicker
              selected={session.selectedMuscle}
              onSelect={handleMuscleSelect}
            />
          </div>

          {/* Top exercises for this muscle — shortcut to your favorites */}
          {session.selectedMuscle && (
            <TopExercisesCard
              muscle={session.selectedMuscle}
              onPick={handleExerciseSelect}
              scope="weighted"
            />
          )}

          {/* Exercise */}
          <div>
            <label className="text-forge-muted text-[11px] font-condensed tracking-widest uppercase block mb-2.5">{t('logPage.exercise')}</label>
            <ExerciseAutocomplete
              muscle={session.selectedMuscle}
              value={session.selectedExercise ?? ''}
              onChange={handleExerciseSelect}
            />
          </div>

          {/* Set Logger — only when exercise is selected */}
          {session.selectedExercise && (
            <div className="space-y-3">
              <label className="text-forge-muted text-[11px] font-condensed tracking-widest uppercase block">
                {t('logPage.setsLabel')} — <span className="text-forge-green/80">{session.selectedExercise}</span>
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
                  className="w-full mt-1 bg-gradient-to-br from-forge-green/20 to-forge-green/10 text-forge-green border border-forge-green/30 py-3 rounded-2xl font-condensed font-bold text-sm cursor-pointer press-scale min-h-[48px] hover:bg-forge-green/25 hover:border-forge-green/50 transition-all duration-200 shadow-[0_2px_12px_rgba(46,204,113,0.1)]"
                >
                  {t('logPage.logExercise', { count: currentSets.length })}
                </button>
              )}
            </div>
          )}

          {/* Rest Timer */}
          <RestTimer />

          {/* Logged exercises summary */}
          {session.exercises.length > 0 && (
            <div className="space-y-2">
              <label className="text-forge-muted text-[11px] font-condensed tracking-widest uppercase block">
                {t('logPage.loggedLabel')} · <span className="text-forge-green/80">{t('logPage.exerciseCount', { count: session.exercises.length })}</span>
              </label>
              {session.exercises.map((ex, i) => (
                <LoggedExerciseCard key={i} ex={ex} index={i} />
              ))}
            </div>
          )}
        </>
      )}

      {workoutType === 'bodyweight' && (
        <>
          <BwLogger />
          {session.bwExercises.length > 0 && (
            <div className="space-y-2">
              <label className="label-cap">
                {t('logPage.loggedLabel')} · <span className="text-forge-green/80">
                  {t('logPage.exerciseCount', { count: session.bwExercises.length })}
                </span>
              </label>
              {session.bwExercises.map((ex, i) => (
                <div key={i} className="card-elevated rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-forge-green/10 flex items-center justify-center">
                    <span className="text-forge-green text-xs font-display">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-forge-text text-[14px] font-condensed font-semibold truncate">{ex.name}</div>
                    <div className="text-forge-muted text-[11px] font-mono">
                      {t('logPage.bwSummary', { count: ex.sets.length, total: ex.sets.reduce((a, s) => a + s.reps, 0) })}
                    </div>
                  </div>
                  <span className="text-forge-green/60 text-[10px] font-condensed uppercase">{ex.muscle ? t('muscles.' + String(ex.muscle).toLowerCase()) : ''}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {workoutType === 'cardio' && <CardioLogger />}

      {/* End Workout — floating action button (enabled when any entries logged) */}
      {(session.exercises.length > 0 || session.bwExercises.length > 0 || session.cardioEntries.length > 0) && (
        <button
          onClick={() => setShowSaveModal(true)}
          className="fixed bottom-24 right-4 z-30 bg-gradient-to-br from-red-500 to-red-700 text-white px-6 py-3.5 rounded-2xl font-condensed font-bold text-sm cursor-pointer press-scale min-h-[48px] shadow-[0_4px_24px_rgba(239,68,68,0.4)] hover:shadow-[0_4px_32px_rgba(239,68,68,0.55)] transition-all duration-200 flex items-center gap-2"
          aria-label={t('logPage.endWorkout')}
        >
          <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
          {t('logPage.endSession')}
        </button>
      )}

    </div>
  );

  return (
    <>
      {content}
      {/* Single SaveWorkoutModal — survives session.active flips so the post-save celebration remains visible */}
      <SaveWorkoutModal
        open={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSaved={() => setWorkoutType('weighted')}
      />
    </>
  );
}
