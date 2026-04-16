import { SettingsForm, DataTransfer } from '../features/settings';
import { XPBar } from '../features/gamification';

export function SettingsPage() {
  return (
    <div className="page-enter p-4 space-y-4 pb-20">
      <h2 className="text-forge-green font-display text-2xl">Settings</h2>
      <XPBar />
      <SettingsForm />
      <DataTransfer />
    </div>
  );
}
