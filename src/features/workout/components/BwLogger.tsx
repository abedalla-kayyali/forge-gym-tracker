import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus, Trash2, Timer } from 'lucide-react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useToast } from '../../../components/ui/Toast';
import { useFX } from '../../../hooks/useFX';
import { Input } from '../../../components/ui/Input';
import { MuscleGroupPicker } from './MuscleGroupPicker';
import type { BwExerciseSet, BwWorkoutExercise } from '../../../types/workout';

// Curated calisthenics exercise list — auto-suggests by muscle group.
const BW_LIBRARY: Record<string, string[]> = {
  chest:     ['Push-up', 'Incline Push-up', 'Decline Push-up', 'Diamond Push-up', 'Archer Push-up', 'Pseudo Planche Push-up', 'Wide Push-up', 'Dips'],
  back:      ['Pull-up', 'Chin-up', 'Wide-Grip Pull-up', 'Archer Pull-up', 'Muscle-up', 'Australian Row', 'Inverted Row', 'One-Arm Pull-up Progressions'],
  shoulders: ['Pike Push-up', 'Handstand Push-up', 'Wall Handstand Hold', 'Handstand Hold (free)', 'Elevated Pike Push-up', 'Shoulder Shrugs (BW)'],
  biceps:    ['Chin-up', 'Close-Grip Pull-up', 'Bodyweight Curl (ring/bar)', 'Tucked Front-Lever Hold'],
  triceps:   ['Dips', 'Bench Dips', 'Diamond Push-up', 'Triceps Extension (ring)', 'Triceps Kickback (BW)'],
  forearms:  ['Bar Hang', 'Towel Hang', 'Farmer Hold', 'Fingertip Push-up'],
  core:      ['Plank', 'Side Plank', 'Hollow Body Hold', 'L-Sit', 'V-Sit', 'Dragon Flag', 'Hanging Leg Raise', 'Toes-to-Bar', 'Russian Twist'],
  legs:      ['Pistol Squat', 'Bulgarian Split Squat (BW)', 'Jump Squat', 'Shrimp Squat', 'Wall Sit', 'Sissy Squat', 'Step-Up'],
  glutes:    ['Glute Bridge', 'Single-Leg Glute Bridge', 'Hip Thrust (BW)', 'Donkey Kick'],
  calves:    ['Calf Raise', 'Single-Leg Calf Raise', 'Jump Rope', 'Box Jump'],
};

// Common "hold" exercises (static) — disables reps, enables hold time
const HOLD_EXERCISES = new Set(['L-Sit', 'V-Sit', 'Plank', 'Side Plank', 'Hollow Body Hold', 'Wall Sit', 'Wall Handstand Hold', 'Handstand Hold (free)', 'Bar Hang', 'Towel Hang', 'Farmer Hold', 'Dragon Flag', 'Tucked Front-Lever Hold']);

interface Props {
  onLogged?: (exercise: BwWorkoutExercise) => void;
}

export function BwLogger({ onLogged }: Props) {
  const { t } = useTranslation();
  const session = useSessionStore();
  const { toast } = useToast();
  const { play } = useFX();

  const [currentSets, setCurrentSets] = useState<BwExerciseSet[]>([]);
  const [reps, setReps] = useState<number>(10);
  const [holdSeconds, setHoldSeconds] = useState<number>(30);
  const [addedWeight, setAddedWeight] = useState<number>(0);
  const [variation, setVariation] = useState<'regular' | 'assisted' | 'weighted'>('regular');

  const isHold = session.selectedExercise ? HOLD_EXERCISES.has(session.selectedExercise) : false;

  const suggestions = useMemo(() => {
    if (!session.selectedMuscle) return [];
    return BW_LIBRARY[session.selectedMuscle] ?? [];
  }, [session.selectedMuscle]);

  const handleAddSet = () => {
    const weight = variation === 'weighted' ? addedWeight : undefined;
    if (isHold) {
      setCurrentSets((prev) => [...prev, { reps: holdSeconds, variation, assisted: variation === 'assisted', addedWeight: weight }]);
    } else {
      setCurrentSets((prev) => [...prev, { reps, variation, assisted: variation === 'assisted', addedWeight: weight }]);
    }
    play('tap');
  };

  const handleRemoveSet = (i: number) =>
    setCurrentSets((prev) => prev.filter((_, idx) => idx !== i));

  const handleLogExercise = () => {
    if (!session.selectedExercise || currentSets.length === 0) {
      toast(t('bwLogger.addAtLeastOneSet'), 'error');
      return;
    }
    const exercise: BwWorkoutExercise = {
      name: session.selectedExercise,
      muscle: session.selectedMuscle ?? '',
      sets: currentSets,
    };
    // Detect rep PR — sound pops a celebration if this set exceeds any prior
    const maxRep = Math.max(...currentSets.map((s) => s.reps));
    session.addBwExercise(exercise);
    onLogged?.(exercise);
    if (maxRep >= 20 && !isHold) play('pr');
    else play('save');
    toast(
      isHold
        ? t('bwLogger.loggedHolds', { name: session.selectedExercise, count: currentSets.length })
        : t('bwLogger.loggedSets', { name: session.selectedExercise, count: currentSets.length }),
      'success',
    );
    setCurrentSets([]);
    session.setExercise('');
  };

  return (
    <div className="space-y-4">
      {/* Muscle picker */}
      <div>
        <label className="label-cap block mb-2">{t('bwLogger.targetMuscle')}</label>
        <MuscleGroupPicker
          selected={session.selectedMuscle}
          onSelect={(m) => {
            session.setMuscle(m);
            session.setExercise('');
            setCurrentSets([]);
          }}
        />
      </div>

      {/* Exercise suggestions */}
      {session.selectedMuscle && (
        <div>
          <label className="label-cap block mb-2">{t('bwLogger.exercise')}</label>
          <div className="scroll-hint overflow-x-auto -mx-1 px-1">
            <div className="flex gap-2">
              {suggestions.map((name) => {
                const sel = session.selectedExercise === name;
                return (
                  <button
                    key={name}
                    onClick={() => { session.setExercise(name); setCurrentSets([]); }}
                    className={[
                      'shrink-0 rounded-full px-3.5 py-2 min-h-[38px] cursor-pointer press-scale',
                      'font-condensed uppercase tracking-wider text-[12px]',
                      'transition-all duration-200',
                      sel
                        ? 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg-deep font-semibold shadow-[0_4px_14px_rgba(46,204,113,0.3)]'
                        : 'bg-white/[0.04] text-forge-text-soft border border-white/[0.06] hover:text-forge-text',
                    ].join(' ')}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Set entry */}
      {session.selectedExercise && (
        <div className="card-elevated rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-forge-text font-condensed font-semibold text-[14px]">
              {session.selectedExercise}
            </span>
            <div className="flex gap-1">
              {(['assisted', 'regular', 'weighted'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVariation(v)}
                  className={[
                    'px-2 py-1 rounded-full text-[10px] font-condensed uppercase tracking-wider cursor-pointer press-scale',
                    variation === v
                      ? 'bg-forge-green text-forge-bg-deep font-semibold'
                      : 'bg-white/[0.04] text-forge-muted',
                  ].join(' ')}
                >
                  {t('bwLogger.variation.' + v)}
                </button>
              ))}
            </div>
          </div>

          {isHold ? (
            <div className="grid grid-cols-[auto_1fr_auto] items-end gap-2">
              <button
                onClick={() => setHoldSeconds((s) => Math.max(5, s - 5))}
                className="w-11 h-11 rounded-xl card-elevated border border-forge-border-light flex items-center justify-center cursor-pointer press-scale"
                aria-label={t('bwLogger.decreaseHoldTime')}
              >
                <Minus size={16} className="text-forge-muted" />
              </button>
              <Input
                label={t('bwLogger.holdSeconds')}
                type="number"
                inputMode="numeric"
                value={holdSeconds}
                onChange={(e) => setHoldSeconds(Number(e.target.value) || 0)}
                leftIcon={<Timer size={14} />}
              />
              <button
                onClick={() => setHoldSeconds((s) => s + 5)}
                className="w-11 h-11 rounded-xl card-elevated border border-forge-border-light flex items-center justify-center cursor-pointer press-scale"
                aria-label={t('bwLogger.increaseHoldTime')}
              >
                <Plus size={16} className="text-forge-muted" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-[auto_1fr_auto] items-end gap-2">
              <button
                onClick={() => setReps((r) => Math.max(1, r - 1))}
                className="w-11 h-11 rounded-xl card-elevated border border-forge-border-light flex items-center justify-center cursor-pointer press-scale"
                aria-label={t('bwLogger.decreaseReps')}
              >
                <Minus size={16} className="text-forge-muted" />
              </button>
              <Input
                label={t('log.reps')}
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(Number(e.target.value) || 0)}
              />
              <button
                onClick={() => setReps((r) => r + 1)}
                className="w-11 h-11 rounded-xl card-elevated border border-forge-border-light flex items-center justify-center cursor-pointer press-scale"
                aria-label={t('bwLogger.increaseReps')}
              >
                <Plus size={16} className="text-forge-muted" />
              </button>
            </div>
          )}

          {variation === 'weighted' && (
            <Input
              label={t('bwLogger.addedWeight')}
              type="number"
              inputMode="decimal"
              value={addedWeight}
              onChange={(e) => setAddedWeight(Math.max(0, Number(e.target.value) || 0))}
            />
          )}

          <button
            onClick={handleAddSet}
            className="w-full py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-forge-green font-condensed uppercase tracking-wider text-[13px] cursor-pointer press-scale hover:bg-white/[0.08]"
          >
            {isHold ? t('bwLogger.addHold') : t('bwLogger.addSet')}
          </button>

          {/* Current working sets */}
          {currentSets.length > 0 && (
            <div className="space-y-1.5">
              <div className="label-cap">{t('bwLogger.workingSets')}</div>
              {currentSets.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-black/25 rounded-lg px-3 py-2"
                >
                  <span className="text-forge-muted text-[12px] font-condensed">#{i + 1}</span>
                  <span className="text-forge-text text-[14px] font-mono">
                    {isHold ? t('bwLogger.seconds', { count: s.reps }) : t('bwLogger.repsCount', { count: s.reps })}
                    {s.addedWeight ? <span className="text-forge-green ml-2 text-[12px]">+{s.addedWeight}{t('log.kgUnit')}</span> : null}
                    <span className="text-forge-muted ml-2 text-[11px]">
                      · {t('bwLogger.variation.' + (s.variation ?? 'regular'))}
                    </span>
                  </span>
                  <button
                    onClick={() => handleRemoveSet(i)}
                    className="text-forge-muted hover:text-red-400 cursor-pointer press-scale"
                    aria-label={t('log.removeSet')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={handleLogExercise}
                className="w-full mt-1 bg-gradient-to-br from-forge-green/20 to-forge-green/10 text-forge-green border border-forge-green/30 py-3 rounded-2xl font-condensed font-bold text-sm cursor-pointer press-scale min-h-[48px] hover:bg-forge-green/25 hover:border-forge-green/50 transition-all duration-200"
              >
                {isHold
                  ? t('bwLogger.logExerciseHolds', { count: currentSets.length })
                  : t('bwLogger.logExerciseSets', { count: currentSets.length })}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
