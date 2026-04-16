import {
  WorkoutHistory,
  DashboardSection,
  VolumeChart,
  FreqChart,
  BalanceChart,
  WeightChart,
} from '../features/dashboard';

export function DashboardPage() {
  return (
    <div className="page-enter p-4 space-y-5 pb-20">
      <h2 className="text-forge-green font-display text-2xl">Dashboard</h2>

      <DashboardSection title="Recent Workouts">
        <WorkoutHistory />
      </DashboardSection>

      <DashboardSection title="Volume by Muscle (30 days)">
        <VolumeChart />
      </DashboardSection>

      <DashboardSection title="Exercise Frequency (30 days)">
        <FreqChart />
      </DashboardSection>

      <DashboardSection title="Muscle Balance">
        <BalanceChart />
      </DashboardSection>

      <DashboardSection title="Weight Trend">
        <WeightChart />
      </DashboardSection>
    </div>
  );
}
