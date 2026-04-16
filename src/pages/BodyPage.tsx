import { useState } from 'react';
import { Scale, Ruler, ScanLine, Camera } from 'lucide-react';
import { WeightLogger, MeasurementsForm, InBodyLog, PhotoGallery } from '../features/body';
import { WeightChart } from '../features/dashboard';

type BodyTab = 'weight' | 'measurements' | 'inbody' | 'photos';

const TABS: { key: BodyTab; label: string; Icon: React.ElementType }[] = [
  { key: 'weight', label: 'Weight', Icon: Scale },
  { key: 'measurements', label: 'Measure', Icon: Ruler },
  { key: 'inbody', label: 'InBody', Icon: ScanLine },
  { key: 'photos', label: 'Photos', Icon: Camera },
];

export function BodyPage() {
  const [tab, setTab] = useState<BodyTab>('weight');

  return (
    <div className="page-enter p-4 space-y-4 pb-20">
      <h2 className="text-forge-green font-display text-2xl">Body</h2>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-forge-surface rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] py-2 rounded-lg text-xs font-condensed font-semibold transition-all cursor-pointer press-scale ${
              tab === t.key
                ? 'bg-forge-green text-forge-bg shadow-[0_0_12px_rgba(46,204,113,0.3)]'
                : 'text-forge-muted hover:text-forge-text'
            }`}
          >
            <t.Icon size={13} />
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
