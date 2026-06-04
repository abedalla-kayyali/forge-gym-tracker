import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, Droplets, Target, Sparkles } from 'lucide-react';
import { estimateMealMacros, computeWaterGoalCups } from '../lib/trainingScience';
import { useProfileStore } from '../stores/useProfileStore';
import { SettingsForm, DataTransfer, AccountCard } from '../features/settings';
import { XPBar } from '../features/gamification';
import { AchievementsList } from '../features/gamification';
import { DashboardSection } from '../features/dashboard';
import { useNutritionStore } from '../stores/useNutritionStore';
import { useToast } from '../components/ui/Toast';
import { useFX } from '../hooks/useFX';
import { Card } from '../components/ui/Card';
import { TabPills } from '../components/ui/TabPills';

type NutritionTab = 'meals' | 'water' | 'macros';

function NutritionSection() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<NutritionTab>('meals');
  const { meals, water, macroTargets, addMeal, addWater, undoWater } = useNutritionStore();
  const profile = useProfileStore((s) => s.profile) as unknown as Record<string, unknown>;
  const { toast } = useToast();
  const { play } = useFX();
  const today = new Date().toISOString().slice(0, 10);

  // Dynamic water goal from profile bodyweight (legacy _computeWaterGoalCups)
  const profileWeight = typeof profile.weight === 'number' ? profile.weight : undefined;
  const profileWeightUnit = typeof profile.weight_unit === 'string' ? profile.weight_unit : 'kg';
  const dynamicWaterGoal = computeWaterGoalCups(
    profileWeight != null && profileWeightUnit === 'lbs'
      ? profileWeight * 0.453592
      : profileWeight,
  );

  const todayMeals = meals[today]?.meals ?? [];
  const todayWater = water[today] ?? { cups_drunk: 0, goal_cups: 8 };
  const todayCalories = todayMeals.reduce((a, m) => a + m.calories, 0);
  const todayProtein = todayMeals.reduce((a, m) => a + m.protein, 0);
  const todayCarbs = todayMeals.reduce((a, m) => a + m.carbs, 0);
  const todayFat = todayMeals.reduce((a, m) => a + m.fat, 0);

  const TABS: { key: NutritionTab; label: string; Icon: typeof UtensilsCrossed }[] = [
    { key: 'meals', label: t('more.tabMeals'), Icon: UtensilsCrossed },
    { key: 'water', label: t('more.tabWater'), Icon: Droplets },
    { key: 'macros', label: t('more.tabMacros'), Icon: Target },
  ];

  const [mealName, setMealName] = useState('');
  const [mealCal, setMealCal] = useState('');
  const [mealPro, setMealPro] = useState('');
  const [mealCarb, setMealCarb] = useState('');
  const [mealFat, setMealFat] = useState('');
  const [mealQty, setMealQty] = useState('1');

  // Auto-fill macros from meal name (legacy _estimateMealMacros)
  const handleEstimate = () => {
    if (!mealName.trim()) {
      toast(t('more.toastEnterMealName'), 'error');
      return;
    }
    const q = Math.max(0.25, Number(mealQty) || 1);
    const est = estimateMealMacros(mealName, q);
    setMealCal(String(est.kcal));
    setMealPro(String(est.protein));
    setMealCarb(String(est.carbs));
    setMealFat(String(est.fat));
    play('tap');
    toast(est.matched ? t('more.toastEstimatedFrom', { name: mealName }) : t('more.toastUsedDefaultPortion'), 'info');
  };

  const handleAddMeal = () => {
    if (!mealName || !mealCal) { toast(t('more.toastEnterMealAndCalories'), 'error'); return; }
    addMeal(today, {
      name: mealName,
      calories: Number(mealCal) || 0,
      protein: Number(mealPro) || 0,
      carbs: Number(mealCarb) || 0,
      fat: Number(mealFat) || 0,
    });
    play('save');
    toast(t('more.toastMealLogged', { name: mealName }), 'success');
    setMealName(''); setMealCal(''); setMealPro(''); setMealCarb(''); setMealFat('');
  };

  const handleAddWater = () => {
    addWater(today);
    play('tap');
  };

  return (
    <div className="space-y-3">
      {/* Sub-tabs (premium unified) */}
      <TabPills
        tabs={TABS.map((t) => ({ id: t.key, label: t.label, Icon: t.Icon }))}
        value={tab}
        onChange={setTab}
        ariaLabel={t('more.nutritionSubNavAria')}
      />

      {tab === 'meals' && (
        <div className="space-y-3">
          {/* Quick summary */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Calories', displayLabel: t('more.calories'), value: todayCalories, target: macroTargets.calories },
              { label: 'Protein', displayLabel: t('more.protein'), value: todayProtein, target: macroTargets.protein_g },
              { label: 'Carbs', displayLabel: t('more.carbs'), value: todayCarbs, target: macroTargets.carbs_g },
              { label: 'Fat', displayLabel: t('more.fat'), value: todayFat, target: macroTargets.fat_g },
            ].map((s) => (
              <Card key={s.label} className="text-center py-2 px-1">
                <div className="text-forge-green text-lg font-display">{Math.round(s.value)}</div>
                <div className="text-forge-dim text-[9px] font-condensed uppercase">{s.displayLabel}</div>
                <div className="h-1 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-gradient-to-r from-forge-green to-forge-green-light rounded-full" style={{ width: `${Math.min(100, (s.value / s.target) * 100)}%` }} />
                </div>
              </Card>
            ))}
          </div>

          {/* Add meal form */}
          <Card className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-forge-dim text-xs font-condensed uppercase tracking-wider">{t('more.addMeal')}</div>
              <button
                onClick={handleEstimate}
                disabled={!mealName.trim()}
                className="inline-flex items-center gap-1 text-[11px] font-condensed uppercase tracking-wider text-forge-green bg-forge-green/10 border border-forge-green/25 rounded-full px-2.5 py-1 cursor-pointer press-scale hover:bg-forge-green/20 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200"
              >
                <Sparkles size={12} /> {t('more.estimate')}
              </button>
            </div>
            <input type="text" placeholder={t('more.mealNamePlaceholder')} value={mealName} onChange={(e) => setMealName(e.target.value)}
              className="w-full bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-3.5 py-2.5 text-forge-text text-sm min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 transition-all duration-200" />
            <div className="grid grid-cols-4 gap-2">
              <input type="number" placeholder={t('more.calShort')} value={mealCal} onChange={(e) => setMealCal(e.target.value)}
                className="bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-2.5 py-2.5 text-forge-text text-sm font-mono min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 transition-all duration-200" />
              <input type="number" placeholder={t('more.proShort')} value={mealPro} onChange={(e) => setMealPro(e.target.value)}
                className="bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-2.5 py-2.5 text-forge-text text-sm font-mono min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 transition-all duration-200" />
              <input type="number" placeholder={t('more.carbShort')} value={mealCarb} onChange={(e) => setMealCarb(e.target.value)}
                className="bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-2.5 py-2.5 text-forge-text text-sm font-mono min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 transition-all duration-200" />
              <input type="number" placeholder={t('more.fatShort')} value={mealFat} onChange={(e) => setMealFat(e.target.value)}
                className="bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-2.5 py-2.5 text-forge-text text-sm font-mono min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 transition-all duration-200" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-condensed uppercase tracking-wider text-forge-muted">{t('more.qty')}</label>
              <input type="number" step="0.25" min="0.25" value={mealQty} onChange={(e) => setMealQty(e.target.value)}
                className="flex-1 bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-2.5 py-2 text-forge-text text-sm font-mono min-h-[36px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 transition-all duration-200" />
              <span className="text-[10px] text-forge-dim font-condensed">{t('more.servings')}</span>
            </div>
            <button onClick={handleAddMeal}
              className="w-full bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg py-2.5 rounded-xl font-condensed font-semibold text-sm cursor-pointer press-scale min-h-[44px] shadow-[0_4px_16px_rgba(46,204,113,0.25)]">
              {t('more.logMeal')}
            </button>
          </Card>

          {/* Today's meals */}
          {todayMeals.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-forge-dim text-xs font-condensed uppercase tracking-wider">{t('more.todaysMeals')}</div>
              {todayMeals.map((m, i) => (
                <Card key={i} className="flex items-center justify-between py-2 px-3">
                  <span className="text-forge-text text-sm">{m.name}</span>
                  <div className="flex gap-3 text-xs font-mono">
                    <span className="text-forge-green">{t('more.caloriesValue', { count: m.calories })}</span>
                    <span className="text-forge-dim">{t('more.proteinValue', { count: m.protein })}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'water' && (
        <div className="space-y-4">
          <Card className="text-center py-6 space-y-3">
            <Droplets size={32} className="text-forge-green mx-auto" />
            <div>
              <div className="text-forge-green text-4xl font-display" style={{ textShadow: '0 0 20px rgba(46,204,113,0.3)' }}>
                {todayWater.cups_drunk}
              </div>
              <div className="text-forge-dim text-xs font-condensed">
                {t('more.ofCups', { count: todayWater.goal_cups })}
                {profileWeight && dynamicWaterGoal !== todayWater.goal_cups && (
                  <span className="block text-forge-green/80 text-[10px] mt-0.5">
                    {t('more.suggestedCups', { count: dynamicWaterGoal })}
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden mx-8">
              <div className="h-full bg-gradient-to-r from-forge-green to-forge-green-light rounded-full transition-all" style={{ width: `${Math.min(100, (todayWater.cups_drunk / todayWater.goal_cups) * 100)}%` }} />
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={handleAddWater}
                className="bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg px-8 py-2.5 rounded-xl font-condensed font-semibold cursor-pointer press-scale min-h-[44px]">
                {t('more.addCup')}
              </button>
              <button onClick={() => undoWater(today)}
                className="card-elevated text-forge-muted px-6 py-2.5 rounded-xl font-condensed cursor-pointer press-scale min-h-[44px]">
                {t('more.undo')}
              </button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'macros' && (
        <div className="space-y-3">
          <Card className="space-y-3">
            <div className="text-forge-dim text-xs font-condensed uppercase tracking-wider">{t('more.dailyTargets')}</div>
            {[
              { label: 'Calories', displayLabel: t('more.calories'), value: macroTargets.calories, unit: t('more.unitKcal') },
              { label: 'Protein', displayLabel: t('more.protein'), value: macroTargets.protein_g, unit: t('more.unitGram') },
              { label: 'Carbs', displayLabel: t('more.carbs'), value: macroTargets.carbs_g, unit: t('more.unitGram') },
              { label: 'Fat', displayLabel: t('more.fat'), value: macroTargets.fat_g, unit: t('more.unitGram') },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-forge-text text-sm">{row.displayLabel}</span>
                <span className="text-forge-green font-mono text-sm">{row.value} {row.unit}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

export function MorePage() {
  const { t } = useTranslation();
  return (
    <div className="p-4 space-y-4 pb-28 page-enter">
      <h2 className="text-forge-green font-display text-2xl tracking-wide">{t('more.title')}</h2>

      {/* Account — sign in / sign up / sync status */}
      <AccountCard />

      <XPBar />

      <DashboardSection title={t('more.nutritionAndWater')}>
        <NutritionSection />
      </DashboardSection>

      <SettingsForm />
      <DataTransfer />

      <DashboardSection title={t('more.achievements')}>
        <AchievementsList />
      </DashboardSection>
    </div>
  );
}
