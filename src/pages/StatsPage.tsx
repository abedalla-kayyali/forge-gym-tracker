import { useState } from 'react';
import { TrendingUp, Target, Activity as MuscleIcon, Scaling, BarChart3 } from 'lucide-react';
import {
  WorkoutHistory,
  DashboardSection,
  VolumeChart,
  FreqChart,
  BalanceChart,
  WeightChart,
} from '../features/dashboard';
import { StepsPanel } from '../features/steps';
import { XPBar } from '../features/gamification';

type StatsTab = 'overview' | 'progress' | 'muscles' | 'body' | 'cali';

const TABS: { key: StatsTab; label: string; Icon: typeof TrendingUp }[] = [
  { key: 'overview', label: 'Overview', Icon: BarChart3 },
  { key: 'progress', label: 'Progress', Icon: TrendingUp },
  { key: 'muscles', label: 'Muscles', Icon: MuscleIcon },
  { key: 'body', label: 'Body', Icon: Target },
  { key: 'cali', label: 'Cali', Icon: Scaling },
];

export function StatsPage() {
  const [tab, setTab] = useState<StatsTab>('overview');

  return (
    <div className="p-4 space-y-4 pb-20 page-enter">
      <h2 className="text-forge-green font-display text-2xl">Stats</h2>

      {/* Sub-tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-condensed font-semibold whitespace-nowrap cursor-pointer press-scale transition-all duration-200 ${
              tab === t.key
                ? 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg shadow-[0_2px_12px_rgba(46,204,113,0.25)]'
                : 'card-elevated text-forge-muted hover:text-forge-text'
            }`}
          >
            <t.Icon size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <XPBar />
          <StepsPanel />
          <DashboardSection title="Recent Workouts">
            <WorkoutHistory />
          </DashboardSection>
        </div>
      )}

      {tab === 'progress' && (
        <div className="space-y-4">
          <DashboardSection title="Volume by Muscle (30 days)">
            <VolumeChart />
          </DashboardSection>
          <DashboardSection title="Exercise Frequency (30 days)">
            <FreqChart />
          </DashboardSection>
        </div>
      )}

      {tab === 'muscles' && (
        <div className="space-y-4">
          <DashboardSection title="Muscle Balance">
            <BalanceChart />
          </DashboardSection>
          <DashboardSection title="Volume by Muscle (30 days)">
            <VolumeChart />
          </DashboardSection>
        </div>
      )}

      {tab === 'body' && (
        <div className="space-y-4">
          <DashboardSection title="Weight Trend">
            <WeightChart />
          </DashboardSection>
        </div>
      )}

      {tab === 'cali' && (
        <div className="text-center py-12">
          <Scaling size={40} className="text-forge-dim mx-auto mb-3" />
          <p className="text-forge-muted font-condensed">Calisthenics progression tree coming soon</p>
        </div>
      )}
    </div>
  );
}
