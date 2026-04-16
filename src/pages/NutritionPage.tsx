import { useState } from 'react';
import { UtensilsCrossed, Droplets, Target } from 'lucide-react';
import { useNutritionStore } from '../stores/useNutritionStore';
import { useToast } from '../components/ui/Toast';
import { useFX } from '../hooks/useFX';
import { Card } from '../components/ui/Card';

type NutritionTab = 'meals' | 'water' | 'macros';

export function NutritionPage() {
  const [tab, setTab] = useState<NutritionTab>('meals');
  const { meals, water, macroTargets, addMeal, addWater, undoWater } = useNutritionStore();
  const { toast } = useToast();
  const { play } = useFX();
  const today = new Date().toISOString().slice(0, 10);

  const todayMeals = meals[today]?.meals ?? [];
  const todayWater = water[today] ?? { cups_drunk: 0, goal_cups: 8 };
  const todayCalories = todayMeals.reduce((a, m) => a + m.calories, 0);
  const todayProtein = todayMeals.reduce((a, m) => a + m.protein, 0);
  const todayCarbs = todayMeals.reduce((a, m) => a + m.carbs, 0);
  const todayFat = todayMeals.reduce((a, m) => a + m.fat, 0);

  const TABS: { key: NutritionTab; label: string; Icon: typeof UtensilsCrossed }[] = [
    { key: 'meals', label: 'Meals', Icon: UtensilsCrossed },
    { key: 'water', label: 'Water', Icon: Droplets },
    { key: 'macros', label: 'Macros', Icon: Target },
  ];

  const [mealName, setMealName] = useState('');
  const [mealCal, setMealCal] = useState('');
  const [mealPro, setMealPro] = useState('');
  const [mealCarb, setMealCarb] = useState('');
  const [mealFat, setMealFat] = useState('');

  const handleAddMeal = () => {
    if (!mealName || !mealCal) { toast('Enter meal name and calories', 'error'); return; }
    addMeal(today, {
      name: mealName,
      calories: Number(mealCal) || 0,
      protein: Number(mealPro) || 0,
      carbs: Number(mealCarb) || 0,
      fat: Number(mealFat) || 0,
    });
    play('save');
    toast(`${mealName} logged`, 'success');
    setMealName(''); setMealCal(''); setMealPro(''); setMealCarb(''); setMealFat('');
  };

  const handleAddWater = () => {
    addWater(today);
    play('tap');
  };

  return (
    <div className="p-4 space-y-4 pb-20 page-enter">
      <h2 className="text-forge-green font-display text-2xl">Nutrition</h2>

      {/* Sub-tabs */}
      <div className="flex gap-1 card-elevated rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-condensed font-semibold cursor-pointer press-scale transition-all duration-200 ${
              tab === t.key
                ? 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg shadow-[0_2px_12px_rgba(46,204,113,0.25)]'
                : 'text-forge-muted hover:text-forge-text'
            }`}
          >
            <t.Icon size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'meals' && (
        <div className="space-y-3">
          {/* Quick summary */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Calories', value: todayCalories, target: macroTargets.calories, unit: '' },
              { label: 'Protein', value: todayProtein, target: macroTargets.protein_g, unit: 'g' },
              { label: 'Carbs', value: todayCarbs, target: macroTargets.carbs_g, unit: 'g' },
              { label: 'Fat', value: todayFat, target: macroTargets.fat_g, unit: 'g' },
            ].map((s) => (
              <Card key={s.label} className="text-center py-2 px-1">
                <div className="text-forge-green text-lg font-display">{Math.round(s.value)}</div>
                <div className="text-forge-dim text-[9px] font-condensed uppercase">{s.label}</div>
                <div className="h-1 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-gradient-to-r from-forge-green to-forge-green-light rounded-full" style={{ width: `${Math.min(100, (s.value / s.target) * 100)}%` }} />
                </div>
              </Card>
            ))}
          </div>

          {/* Add meal form */}
          <Card className="space-y-2">
            <div className="text-forge-dim text-xs font-condensed uppercase tracking-wider">Add Meal</div>
            <input type="text" placeholder="Meal name" value={mealName} onChange={(e) => setMealName(e.target.value)}
              className="w-full bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-3.5 py-2.5 text-forge-text text-sm min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 transition-all duration-200" />
            <div className="grid grid-cols-4 gap-2">
              <input type="number" placeholder="Cal" value={mealCal} onChange={(e) => setMealCal(e.target.value)}
                className="bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-2.5 py-2.5 text-forge-text text-sm font-mono min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 transition-all duration-200" />
              <input type="number" placeholder="Pro" value={mealPro} onChange={(e) => setMealPro(e.target.value)}
                className="bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-2.5 py-2.5 text-forge-text text-sm font-mono min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 transition-all duration-200" />
              <input type="number" placeholder="Carb" value={mealCarb} onChange={(e) => setMealCarb(e.target.value)}
                className="bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-2.5 py-2.5 text-forge-text text-sm font-mono min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 transition-all duration-200" />
              <input type="number" placeholder="Fat" value={mealFat} onChange={(e) => setMealFat(e.target.value)}
                className="bg-[#0a0d0b] border border-[rgba(255,255,255,0.06)] rounded-xl px-2.5 py-2.5 text-forge-text text-sm font-mono min-h-[44px] placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green/40 transition-all duration-200" />
            </div>
            <button onClick={handleAddMeal}
              className="w-full bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg py-2.5 rounded-xl font-condensed font-semibold text-sm cursor-pointer press-scale min-h-[44px] shadow-[0_4px_16px_rgba(46,204,113,0.25)]">
              Log Meal
            </button>
          </Card>

          {/* Today's meals */}
          {todayMeals.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-forge-dim text-xs font-condensed uppercase tracking-wider">Today's Meals</div>
              {todayMeals.map((m, i) => (
                <Card key={i} className="flex items-center justify-between py-2 px-3">
                  <span className="text-forge-text text-sm">{m.name}</span>
                  <div className="flex gap-3 text-xs font-mono">
                    <span className="text-forge-green">{m.calories}cal</span>
                    <span className="text-forge-dim">{m.protein}p</span>
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
              <div className="text-forge-dim text-xs font-condensed">of {todayWater.goal_cups} cups</div>
            </div>
            <div className="h-2 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden mx-8">
              <div className="h-full bg-gradient-to-r from-forge-green to-forge-green-light rounded-full transition-all" style={{ width: `${Math.min(100, (todayWater.cups_drunk / todayWater.goal_cups) * 100)}%` }} />
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button onClick={handleAddWater}
                className="bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg px-8 py-2.5 rounded-xl font-condensed font-semibold cursor-pointer press-scale min-h-[44px]">
                + Add Cup
              </button>
              <button onClick={() => undoWater(today)}
                className="card-elevated text-forge-muted px-6 py-2.5 rounded-xl font-condensed cursor-pointer press-scale min-h-[44px]">
                Undo
              </button>
            </div>
          </Card>
        </div>
      )}

      {tab === 'macros' && (
        <div className="space-y-3">
          <Card className="space-y-3">
            <div className="text-forge-dim text-xs font-condensed uppercase tracking-wider">Daily Targets</div>
            {[
              { label: 'Calories', value: macroTargets.calories, unit: 'kcal' },
              { label: 'Protein', value: macroTargets.protein_g, unit: 'g' },
              { label: 'Carbs', value: macroTargets.carbs_g, unit: 'g' },
              { label: 'Fat', value: macroTargets.fat_g, unit: 'g' },
            ].map((t) => (
              <div key={t.label} className="flex items-center justify-between">
                <span className="text-forge-text text-sm">{t.label}</span>
                <span className="text-forge-green font-mono text-sm">{t.value} {t.unit}</span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
