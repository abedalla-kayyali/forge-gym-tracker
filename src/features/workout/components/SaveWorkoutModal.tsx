import { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Confetti } from '../../../components/ui/Confetti';
import { SessionPoster } from '../../poster/components/SessionPoster';
import { BodyMap } from '../../../components/body/BodyMap';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';
import { useBwWorkoutStore } from '../../../stores/useBwWorkoutStore';
import { useCardioStore } from '../../../stores/useCardioStore';
import { useGamificationStore } from '../../../stores/useGamificationStore';
import { useToast } from '../../../components/ui/Toast';
import { useFX } from '../../../hooks/useFX';
import { flagPRs } from '../../../lib/trainingScience';
import type { Workout, BwWorkout, CardioEntry, MuscleGroup } from '../../../types/workout';
import { Share2, Flame, Trophy, Zap, Clock, ChevronDown, ChevronUp, Award } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const VALID_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'legs', 'glutes', 'calves'];

export function SaveWorkoutModal({ open, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const session = useSessionStore();
  const addWorkout = useWorkoutStore((s) => s.addWorkout);
  const workoutHistory = useWorkoutStore((s) => s.workouts);
  const addBwWorkout = useBwWorkoutStore((s) => s.addWorkout);
  const addCardioEntry = useCardioStore((s) => s.addEntry);
  const addXP = useGamificationStore((s) => s.addXP);
  const { toast } = useToast();
  const { play } = useFX();

  const [saved, setSaved] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [expandedEx, setExpandedEx] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  // Celebration state captured at save time.
  const [levelUp, setLevelUp] = useState<{ level: number; name: string } | null>(null);
  const [prCount, setPrCount] = useState(0);
  const savedWorkoutRef = useRef<Workout | null>(null);
  // Frozen snapshot of summary taken BEFORE session.reset() so post-save stats render correctly
  const savedSummaryRef = useRef<ReturnType<typeof buildSummary> | null>(null);

  const liveSummary = useMemo(
    () =>
      buildSummary(
        session.startTime,
        session.exercises,
        session.bwExercises,
        session.cardioEntries,
      ),
    [session.exercises, session.bwExercises, session.cardioEntries, session.startTime],
  );

  // When showing post-save screen, prefer the frozen summary; else the live one
  const summary = saved && savedSummaryRef.current ? savedSummaryRef.current : liveSummary;
  const hasWeighted = saved
    ? (savedSummaryRef.current?.hasWeighted ?? false)
    : session.exercises.length > 0;
  const hasCardioOnly = saved
    ? (savedSummaryRef.current?.hasCardioOnly ?? false)
    : session.cardioEntries.length > 0 && session.exercises.length === 0;

  const handleSave = () => {
    if (summary.exerciseCount === 0) {
      toast(t('saveWorkout.errorNoEntries'), 'error');
      return;
    }
    // Freeze the summary before session.reset() wipes it
    savedSummaryRef.current = liveSummary;

    let xpGained = 0;
    let prTotal = 0;

    // Save weighted workout — flag any new personal records first.
    if (session.exercises.length > 0) {
      const { exercises: flaggedExercises, prCount: weightedPRs } = flagPRs(session.exercises, workoutHistory);
      prTotal += weightedPRs;
      const workout: Workout = {
        id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        date: new Date().toISOString(),
        name: summary.muscleNames.join(' + ') || t('saveWorkout.defaultWorkoutName'),
        exercises: flaggedExercises,
        duration: summary.duration,
      };
      addWorkout(workout);
      savedWorkoutRef.current = workout;
      xpGained += session.exercises.reduce((a, ex) => a + ex.sets.length * 5 + 10, 0);
    }

    // Save bodyweight workout
    if (session.bwExercises.length > 0) {
      const bw: BwWorkout = {
        id: `bw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        date: new Date().toISOString(),
        name: summary.muscleNames.join(' + ') || t('saveWorkout.defaultCalisthenicsName'),
        exercises: session.bwExercises,
        duration: summary.duration,
      };
      addBwWorkout(bw);
      // If no weighted workout for poster, fall back to a synthesized one
      if (!savedWorkoutRef.current) {
        savedWorkoutRef.current = {
          id: bw.id,
          date: bw.date,
          name: bw.name,
          duration: bw.duration,
          exercises: bw.exercises.map((e) => ({
            name: e.name,
            muscle: e.muscle,
            sets: e.sets.map((s) => ({ reps: s.reps, weight: s.addedWeight ?? 0 })),
          })),
        };
      }
      xpGained += session.bwExercises.reduce((a, ex) => a + ex.sets.length * 4 + 8, 0);
    }

    // Save cardio entries
    if (session.cardioEntries.length > 0) {
      session.cardioEntries.forEach((c) => {
        const entry: CardioEntry = {
          id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          date: new Date().toISOString(),
          ...c,
        };
        addCardioEntry(entry);
      });
      if (!savedWorkoutRef.current) {
        savedWorkoutRef.current = {
          id: `c_${Date.now()}`,
          date: new Date().toISOString(),
          name: session.cardioEntries.map((c) => c.type).join(' + '),
          duration: summary.duration,
          exercises: [],
        };
      }
      xpGained += summary.cardioMinutes;
    }

    const levelResult = addXP(xpGained);
    // Tiered celebration: level-up trumps PR trumps a normal save.
    if (levelResult.leveledUp) play('levelUp');
    else if (prTotal > 0) play('pr');
    else play('success');
    setLevelUp(levelResult.leveledUp ? { level: levelResult.newLevel.level, name: levelResult.newLevel.name } : null);
    setPrCount(prTotal);
    toast(prTotal > 0 ? t('saveWorkout.prToast', { count: prTotal }) : t('saveWorkout.toastSaved'), 'success');
    session.reset();
    setSaved(true);
    setShowConfetti(true);
  };

  const handleDone = () => {
    setSaved(false);
    savedWorkoutRef.current = null;
    savedSummaryRef.current = null;
    setExpandedEx(null);
    setLevelUp(null);
    setPrCount(0);
    onSaved();
    onClose();
  };

  const handleClose = () => {
    if (saved) handleDone();
    else onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title={saved ? t('saveWorkout.titleComplete') : t('saveWorkout.titleEnd')}
        subtitle={saved ? t('saveWorkout.subtitleComplete') : t('saveWorkout.subtitleEnd')}
        size="md"
      >
        {!saved ? (
          /* ── PRE-SAVE CONFIRM ─────────────────────────────── */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <StatCell label={t('saveWorkout.statMinutes')} value={summary.duration} icon={<Clock size={12} />} />
              <StatCell label={t('saveWorkout.statEntries')} value={summary.exerciseCount} icon={<Flame size={12} />} />
              <StatCell label={t('saveWorkout.statSets')} value={summary.totalSets} icon={<Zap size={12} />} />
              <StatCell
                label={hasWeighted ? t('saveWorkout.statVolumeKg') : t('log.reps')}
                value={hasWeighted ? Math.round(summary.totalVolume).toLocaleString() : summary.totalReps}
                icon={<Trophy size={12} />}
              />
            </div>

            {summary.muscleNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {summary.muscleNames.map((m) => (
                  <Badge key={m} variant="success" dot>{t('muscles.' + String(m).toLowerCase())}</Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button onClick={onClose} variant="secondary" size="md" fullWidth>
                {t('saveWorkout.keepGoing')}
              </Button>
              <Button onClick={handleSave} variant="primary" size="md" fullWidth>
                {t('saveWorkout.endAndSave')}
              </Button>
            </div>
          </div>
        ) : (
          /* ── POST-SAVE CELEBRATION + HISTORY + POSTER ─────── */
          <div className="space-y-4">
            {/* Level-up banner (trumps PR) */}
            {levelUp && (
              <div className="rounded-2xl p-4 text-center bg-gradient-to-br from-forge-gold/25 to-forge-gold/[0.06] border border-forge-gold/40 animate-fade-in shadow-[0_0_24px_rgba(212,175,55,0.25)]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Award size={18} className="text-forge-gold" />
                  <span className="label-cap text-forge-gold">{t('saveWorkout.levelUpTitle')}</span>
                </div>
                <div className="text-forge-text font-display text-2xl tracking-wide">
                  {t('saveWorkout.levelUpReached', { level: levelUp.level, name: levelUp.name })}
                </div>
              </div>
            )}
            {/* PR banner */}
            {!levelUp && prCount > 0 && (
              <div className="rounded-2xl p-3 text-center bg-gradient-to-br from-forge-green/20 to-forge-green/[0.05] border border-forge-green/30 animate-fade-in">
                <div className="flex items-center justify-center gap-2">
                  <Trophy size={16} className="text-forge-green" />
                  <span className="text-forge-green font-condensed font-semibold text-sm">
                    {t('saveWorkout.prToast', { count: prCount })}
                  </span>
                </div>
              </div>
            )}
            {/* Hero card with body-map + stats */}
            <div className="card-elevated card-luxury-border rounded-2xl p-4 relative overflow-hidden">
              <div
                aria-hidden
                className="absolute -top-24 -right-24 w-48 h-48 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(46,204,113,0.22) 0%, transparent 70%)',
                  filter: 'blur(30px)',
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Flame size={14} className="text-forge-green animate-pulse" />
                  <span className="label-cap text-forge-green">{t('saveWorkout.musclesTrained')}</span>
                </div>
                <BodyMap
                  selected={new Set(summary.muscleNames)}
                  maxWidth={300}
                />
              </div>
            </div>

            {/* Big stats */}
            <div className="grid grid-cols-3 gap-2">
              <HeroStat label={t('saveWorkout.heroMin')}   value={summary.duration} />
              <HeroStat
                label={hasCardioOnly ? t('saveWorkout.heroMinCardio') : t('saveWorkout.heroSets')}
                value={hasCardioOnly ? summary.cardioMinutes : summary.totalSets}
              />
              <HeroStat
                label={hasWeighted ? t('saveWorkout.heroVolKg') : t('saveWorkout.heroReps')}
                value={hasWeighted ? Math.round(summary.totalVolume).toLocaleString() : summary.totalReps}
                accent="gold"
              />
            </div>

            {/* Exercise history list */}
            {savedWorkoutRef.current && savedWorkoutRef.current.exercises.length > 0 && (
              <div className="space-y-2">
                <div className="label-cap-strong">{t('saveWorkout.sessionLog')}</div>
                {savedWorkoutRef.current.exercises.map((ex, i) => {
                  const isOpen = expandedEx === i;
                  const volume = ex.sets.reduce((a, s) => a + s.reps * s.weight, 0);
                  return (
                    <div key={i} className="card-elevated rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedEx(isOpen ? null : i)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 cursor-pointer"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-forge-green/10 flex items-center justify-center shrink-0">
                            <span className="text-forge-green text-[11px] font-display">{i + 1}</span>
                          </div>
                          <div className="text-left min-w-0">
                            <div className="text-forge-text text-[13px] font-condensed font-semibold truncate">{ex.name}</div>
                            <div className="text-forge-muted text-[10px] font-mono">
                              {t('saveWorkout.setsCount', { count: ex.sets.length })}
                              {volume > 0 ? ` · ${volume.toLocaleString()} ${t('log.kgUnit')}` : ''}
                            </div>
                          </div>
                        </div>
                        {isOpen ? <ChevronUp size={13} className="text-forge-dim" /> : <ChevronDown size={13} className="text-forge-dim" />}
                      </button>
                      {isOpen && (
                        <div className="border-t border-forge-border-light">
                          <div className="grid grid-cols-4 px-3.5 py-1.5 text-[9px] label-cap">
                            <span>{t('saveWorkout.colSet')}</span><span className="text-center">{t('log.reps')}</span><span className="text-center">{t('saveWorkout.colWt')}</span><span className="text-right">{t('saveWorkout.colVol')}</span>
                          </div>
                          {ex.sets.map((s, si) => (
                            <div key={si} className="grid grid-cols-4 px-3.5 py-1.5 text-[12px] font-mono">
                              <span className="text-forge-muted">{si + 1}</span>
                              <span className="text-center text-forge-text">{s.reps}</span>
                              <span className="text-center text-forge-text">{s.weight > 0 ? `${s.weight}${t('log.kgUnit')}` : '—'}</span>
                              <span className="text-right text-forge-green/80">
                                {s.weight > 0 ? (s.reps * s.weight).toLocaleString() : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action row */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => setShowPoster(true)}
                variant="primary"
                size="md"
                fullWidth
                disabled={!savedWorkoutRef.current}
              >
                <Share2 size={15} /> {t('saveWorkout.sharePoster')}
              </Button>
              <Button onClick={handleDone} variant="secondary" size="md">
                {t('saveWorkout.done')}
              </Button>
            </div>
            <p className="text-center text-[11px] text-forge-muted font-condensed">
              {t('saveWorkout.xpFooterPrefix')} <span className="text-forge-green">{t('nav.history')}</span>
            </p>
          </div>
        )}
      </Modal>

      <SessionPoster
        workout={savedWorkoutRef.current}
        open={showPoster}
        onClose={() => setShowPoster(false)}
      />

      <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />
    </>
  );
}

function buildSummary(
  startTime: number | null,
  exercises: Workout['exercises'],
  bwExercises: BwWorkout['exercises'],
  cardioEntries: Omit<CardioEntry, 'id' | 'date'>[],
) {
  const duration = startTime ? Math.floor((Date.now() - startTime) / 60000) : 0;
  const totalSets =
    exercises.reduce((a, ex) => a + ex.sets.length, 0) +
    bwExercises.reduce((a, ex) => a + ex.sets.length, 0);
  const totalVolume = exercises.reduce(
    (a, ex) => a + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
    0,
  );
  const totalReps =
    exercises.reduce((a, ex) => a + ex.sets.reduce((s, set) => s + set.reps, 0), 0) +
    bwExercises.reduce((a, ex) => a + ex.sets.reduce((s, set) => s + set.reps, 0), 0);
  const prs = exercises.reduce((a, ex) => a + ex.sets.filter((s) => s.isPR).length, 0);
  const cardioMinutes = cardioEntries.reduce((a, e) => a + e.duration, 0);

  const muscleNames: MuscleGroup[] = [];
  [...exercises, ...bwExercises].forEach((ex) => {
    const m = ex.muscle.toLowerCase() as MuscleGroup;
    if (VALID_MUSCLES.includes(m) && !muscleNames.includes(m)) muscleNames.push(m);
  });

  const exerciseCount = exercises.length + bwExercises.length + cardioEntries.length;
  const hasWeighted = exercises.length > 0;
  const hasCardioOnly = cardioEntries.length > 0 && exercises.length === 0 && bwExercises.length === 0;

  return {
    duration, totalSets, totalVolume, totalReps, prs, cardioMinutes,
    muscleNames, exerciseCount, hasWeighted, hasCardioOnly,
  };
}

function StatCell({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="bg-black/25 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-0.5 text-forge-muted">
        {icon}
        <span className="label-cap text-[9px]">{label}</span>
      </div>
      <div className="kpi-lg text-forge-green">{value}</div>
    </div>
  );
}

function HeroStat({ label, value, accent = 'green' }: { label: string; value: string | number; accent?: 'green' | 'gold' }) {
  const color = accent === 'gold' ? 'text-forge-gold' : 'text-forge-green';
  return (
    <div className="card-elevated rounded-xl p-3 text-center">
      <div className={`kpi-lg ${color}`}>{value}</div>
      <div className="label-cap text-[9px] mt-0.5">{label}</div>
    </div>
  );
}
