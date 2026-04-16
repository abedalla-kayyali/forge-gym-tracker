import { CoachPanel } from '../features/coach';

export function CoachPage() {
  return (
    <div className="page-enter p-4 space-y-4 pb-20">
      <h2 className="text-forge-green font-display text-2xl">Coach</h2>
      <CoachPanel />
    </div>
  );
}
