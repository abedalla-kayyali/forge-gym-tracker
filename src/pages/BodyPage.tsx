import { useState } from 'react';
import { WeightLogger, MeasurementsForm, InBodyLog, PhotoGallery } from '../features/body';
import { WeightChart } from '../features/dashboard';

type BodyTab = 'weight' | 'measurements' | 'inbody' | 'photos';

const TABS: { key: BodyTab; label: string; icon: string }[] = [
  { key: 'weight', label: 'Weight', icon: '⚖️' },
  { key: 'measurements', label: 'Measure', icon: '📏' },
  { key: 'inbody', label: 'InBody', icon: '🔬' },
  { key: 'photos', label: 'Photos', icon: '📸' },
];

export function BodyPage() {
  const [tab, setTab] = useState<BodyTab>('weight');

  return (
    <div className="p-4 space-y-4 pb-20">
      <h2 className="text-forge-green font-display text-2xl">Body</h2>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-forge-surface rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-condensed font-semibold transition-all ${
              tab === t.key
                ? 'bg-forge-green text-forge-bg'
                : 'text-forge-muted hover:text-forge-text'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'weight' && (
        <div className="space-y-4">
          <WeightLogger />
          <div>
            <h3 className="text-forge-muted text-xs font-condensed uppercase mb-2">Trend</h3>
            <WeightChart />
          </div>
        </div>
      )}
      {tab === 'measurements' && <MeasurementsForm />}
      {tab === 'inbody' && <InBodyLog />}
      {tab === 'photos' && <PhotoGallery />}
    </div>
  );
}
