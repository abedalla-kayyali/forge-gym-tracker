import { useMemo } from 'react';
import { useWorkoutStore } from '../../../stores/useWorkoutStore';

function useMuscleColors(): Record<string, string> {
  const workouts = useWorkoutStore((s) => s.workouts);
  return useMemo(() => {
    const now = Date.now();
    const colors: Record<string, string> = {};
    const muscles = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'core', 'legs', 'glutes', 'calves', 'forearms'];

    for (const m of muscles) {
      const lastSession = workouts
        .filter((w) => w.exercises.some((e) => e.muscle.toLowerCase() === m))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      if (!lastSession) { colors[m] = '#1a2e1f'; continue; }
      const days = Math.floor((now - new Date(lastSession.date).getTime()) / 86400000);
      if (days <= 1) colors[m] = '#2ecc71';
      else if (days <= 3) colors[m] = '#8BC34A';
      else if (days <= 5) colors[m] = '#FFC107';
      else colors[m] = '#1a2e1f';
    }
    return colors;
  }, [workouts]);
}

export function MuscleHeatmap() {
  const colors = useMuscleColors();

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <svg viewBox="0 0 200 340" width="150" height="255" className="drop-shadow-lg">
        {/* Head */}
        <circle cx="100" cy="32" r="20" fill="#111613" stroke="#2a3d2f" strokeWidth="1.5" />
        {/* Neck */}
        <rect x="93" y="50" width="14" height="14" rx="4" fill="#111613" />
        {/* Shoulders */}
        <rect x="38" y="70" width="124" height="22" rx="11" fill={colors['shoulders'] ?? '#1a2e1f'} opacity="0.85" />
        {/* Chest */}
        <rect x="62" y="88" width="76" height="38" rx="8" fill={colors['chest'] ?? '#1a2e1f'} opacity="0.85" />
        {/* Left bicep */}
        <rect x="30" y="93" width="20" height="52" rx="10" fill={colors['biceps'] ?? '#1a2e1f'} opacity="0.85" />
        {/* Right bicep */}
        <rect x="150" y="93" width="20" height="52" rx="10" fill={colors['biceps'] ?? '#1a2e1f'} opacity="0.85" />
        {/* Left forearm */}
        <rect x="28" y="149" width="16" height="38" rx="8" fill={colors['forearms'] ?? '#1a2e1f'} opacity="0.75" />
        {/* Right forearm */}
        <rect x="156" y="149" width="16" height="38" rx="8" fill={colors['forearms'] ?? '#1a2e1f'} opacity="0.75" />
        {/* Core / abs */}
        <rect x="70" y="128" width="60" height="48" rx="6" fill={colors['core'] ?? '#1a2e1f'} opacity="0.85" />
        {/* Left quad */}
        <rect x="65" y="182" width="28" height="82" rx="12" fill={colors['legs'] ?? '#1a2e1f'} opacity="0.85" />
        {/* Right quad */}
        <rect x="107" y="182" width="28" height="82" rx="12" fill={colors['legs'] ?? '#1a2e1f'} opacity="0.85" />
        {/* Left calf */}
        <rect x="67" y="268" width="22" height="50" rx="10" fill={colors['calves'] ?? '#1a2e1f'} opacity="0.8" />
        {/* Right calf */}
        <rect x="111" y="268" width="22" height="50" rx="10" fill={colors['calves'] ?? '#1a2e1f'} opacity="0.8" />
      </svg>

      {/* Legend */}
      <div className="flex gap-3 text-[10px] font-condensed text-forge-dim">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#2ecc71' }} />Fresh</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#8BC34A' }} />Recovering</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#FFC107' }} />Ready</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: '#374151' }} />Overdue</span>
      </div>
    </div>
  );
}
