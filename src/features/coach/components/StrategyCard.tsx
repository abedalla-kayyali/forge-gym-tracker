import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Dumbbell, Flame, Check } from 'lucide-react';
import { useProfileStore } from '../../../stores/useProfileStore';
import { useBodyStore } from '../../../stores/useBodyStore';
import { useNutritionStore } from '../../../stores/useNutritionStore';
import { useToast } from '../../../components/ui/Toast';
import { useFX } from '../../../hooks/useFX';
import { recommendProgram, macroGuidance } from '../../../lib/trainingScience';
import { formatNumber } from '../../../lib/format';
import type { Sex, FitnessGoal } from '../../../types/profile';

const GOALS: FitnessGoal[] = ['lose_fat', 'build_muscle', 'recomp', 'strength', 'general'];
const SEXES: Sex[] = ['male', 'female'];
const DAYS = [3, 4, 5, 6];

/** Goal + sex aware training-strategy recommendation, with one-tap macro targets. */
export function StrategyCard() {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const bodyWeight = useBodyStore((s) => s.bodyWeight);
  const setMacroTargets = useNutritionStore((s) => s.setMacroTargets);
  const { toast } = useToast();
  const { play } = useFX();

  const [days, setDays] = useState<number>(4);
  const [applied, setApplied] = useState(false);

  const sex = profile.sex;
  const goal = profile.goal;
  const latestWeight = bodyWeight.length ? bodyWeight[bodyWeight.length - 1]!.weight_kg : profile.weight_kg;

  const program = useMemo(
    () => (goal ? recommendProgram({ sex, goal, experience: profile.experience_level, daysPerWeek: days }) : null),
    [sex, goal, profile.experience_level, days],
  );
  const macros = useMemo(
    () => (goal ? macroGuidance({ weightKg: latestWeight, heightCm: profile.height_cm, age: profile.age, sex, goal, daysPerWeek: days }) : null),
    [latestWeight, profile.height_cm, profile.age, sex, goal, days],
  );

  const chip = (active: boolean) =>
    [
      'shrink-0 px-3 py-1.5 rounded-full text-[12px] font-condensed uppercase tracking-wider cursor-pointer press-scale transition-all duration-200 min-h-[36px]',
      active
        ? 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg-deep font-semibold shadow-[0_4px_14px_rgba(46,204,113,0.3)]'
        : 'bg-white/[0.04] text-forge-text-soft border border-white/[0.06] hover:text-forge-text',
    ].join(' ');

  const applyMacros = () => {
    if (!macros) return;
    setMacroTargets({ calories: macros.calories, protein_g: macros.protein_g, carbs_g: macros.carbs_g, fat_g: macros.fat_g });
    play('save');
    toast(t('strategy.macrosApplied'), 'success');
    setApplied(true);
    window.setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div className="card-elevated card-luxury-border rounded-2xl p-4 space-y-3.5">
      <div className="flex items-center gap-2">
        <Compass size={16} className="text-forge-green" />
        <span className="label-cap text-forge-green">{t('strategy.title')}</span>
      </div>

      {/* Goal */}
      <div>
        <div className="label-cap mb-1.5">{t('strategy.chooseGoal')}</div>
        <div className="scroll-hint overflow-x-auto -mx-1 px-1">
          <div className="flex gap-2">
            {GOALS.map((g) => (
              <button key={g} type="button" onClick={() => { updateProfile({ goal: g }); play('tap'); }} className={chip(goal === g)}>
                {t('strategy.goal.' + g)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sex + days */}
      <div className="flex flex-wrap gap-2 items-center">
        {SEXES.map((s) => (
          <button key={s} type="button" onClick={() => { updateProfile({ sex: s }); play('tap'); }} className={chip(sex === s)}>
            {t('strategy.sex.' + s)}
          </button>
        ))}
        <span className="w-px h-6 bg-white/10 mx-1" />
        {DAYS.map((d) => (
          <button key={d} type="button" onClick={() => { setDays(d); play('tap'); }} className={chip(days === d)}>
            {t('strategy.days', { count: d })}
          </button>
        ))}
      </div>

      {!goal && (
        <p className="text-forge-muted text-[12px] font-condensed">{t('strategy.setup')}</p>
      )}

      {program && (
        <div className="space-y-3 pt-1">
          {/* Program */}
          <div className="card-elevated rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Dumbbell size={14} className="text-forge-green" />
              <span className="text-forge-text font-condensed font-semibold text-[14px]">
                {t('strategy.split.' + program.split)}
              </span>
              <span className="text-forge-muted text-[11px] font-mono ms-auto">{t('strategy.days', { count: program.daysPerWeek })}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {program.schedule.map((d, i) => (
                <span key={i} className="text-[10px] font-condensed uppercase tracking-wider px-2 py-1 rounded-lg bg-forge-green/10 text-forge-green/90 border border-forge-green/15">
                  {t('strategy.focus.' + d.focusKey)}
                </span>
              ))}
            </div>
            <div className="text-forge-text-soft text-[12px] font-mono">
              {t('strategy.repRange', { low: program.repRange[0], high: program.repRange[1] })} · {t('strategy.rir', { rir: program.rir })}
            </div>
            <div className="text-forge-muted text-[11px] font-condensed">{t('strategy.progression.' + program.progressionKey)}</div>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="label-cap">{t('strategy.emphasis')}</span>
              {program.emphasis.map((m) => (
                <span key={m} className="text-[10px] font-condensed uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.05] text-forge-text-soft">
                  {t('muscles.' + m)}
                </span>
              ))}
            </div>
          </div>

          {/* Macros */}
          {macros ? (
            <div className="card-elevated rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-forge-gold" />
                <span className="text-forge-text font-condensed font-semibold text-[14px]">{t('strategy.macros')}</span>
                <span className="ms-auto text-[10px] font-condensed uppercase tracking-wider px-2 py-0.5 rounded-md bg-forge-gold/12 text-forge-gold border border-forge-gold/25">
                  {t('strategy.delta.' + macros.deltaKey)}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="kpi-lg text-forge-green">{formatNumber(macros.calories)}</span>
                <span className="label-cap">{t('strategy.kcal')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Macro label={t('strategy.protein')} value={macros.protein_g} />
                <Macro label={t('strategy.carbs')} value={macros.carbs_g} />
                <Macro label={t('strategy.fat')} value={macros.fat_g} />
              </div>
              <button
                onClick={applyMacros}
                className="w-full mt-1 flex items-center justify-center gap-2 bg-gradient-to-br from-forge-green/20 to-forge-green/10 text-forge-green border border-forge-green/30 py-2.5 rounded-xl font-condensed font-semibold text-[13px] cursor-pointer press-scale min-h-[44px] hover:bg-forge-green/25 transition-all duration-200"
              >
                {applied ? <><Check size={15} /> {t('strategy.macrosApplied')}</> : t('strategy.applyMacros')}
              </button>
            </div>
          ) : (
            <p className="text-forge-muted text-[12px] font-condensed">{t('strategy.needWeight')}</p>
          )}
        </div>
      )}
    </div>
  );
}

function Macro({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-black/25 rounded-lg py-2">
      <div className="text-forge-text font-mono text-[15px]">{value}<span className="text-forge-muted text-[10px]">g</span></div>
      <div className="label-cap text-[9px] mt-0.5">{label}</div>
    </div>
  );
}
