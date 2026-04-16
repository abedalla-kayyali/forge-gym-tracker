import { SettingsForm, DataTransfer } from '../features/settings';
import { XPBar } from '../features/gamification';
import { AchievementsList } from '../features/gamification';
import { DashboardSection } from '../features/dashboard';

export function MorePage() {
  return (
    <div className="p-4 space-y-4 pb-20 page-enter">
      <h2 className="text-forge-green font-display text-2xl">More</h2>
      <XPBar />
      <SettingsForm />
      <DataTransfer />
      <DashboardSection title="Achievements">
        <AchievementsList />
      </DashboardSection>
    </div>
  );
}
