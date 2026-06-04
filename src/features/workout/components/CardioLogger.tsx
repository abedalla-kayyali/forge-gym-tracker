import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Minus, Route, Heart, Clock } from 'lucide-react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useToast } from '../../../components/ui/Toast';
import { useFX } from '../../../hooks/useFX';
import { Input } from '../../../components/ui/Input';

const CARDIO_TYPES = [
  { id: 'Running',    label: 'Run',    emoji: '🏃' },
  { id: 'Cycling',    label: 'Bike',   emoji: '🚴' },
  { id: 'Swimming',   label: 'Swim',   emoji: '🏊' },
  { id: 'Rowing',     label: 'Row',    emoji: '🚣' },
  { id: 'Walking',    label: 'Walk',   emoji: '🚶' },
  { id: 'Hiking',     label: 'Hike',   emoji: '🥾' },
  { id: 'Elliptical', label: 'Ellipt.',emoji: '⚙️' },
  { id: 'HIIT',       label: 'HIIT',   emoji: '⚡' },
];

const INTENSITIES = [
  { id: 'low',     label: 'Low',    color: '#8BC34A' },
  { id: 'medium',  label: 'Medium', color: '#F59E0B' },
  { id: 'high',    label: 'High',   color: '#EF4444' },
] as const;

export function CardioLogger() {
  const { t: translate } = useTranslation();
  const session = useSessionStore();
  const { toast } = useToast();
  const { play } = useFX();

  const [type, setType] = useState<string>('Running');
  const [duration, setDuration] = useState<number>(30);
  const [distance, setDistance] = useState<number>(5);
  const [heartRate, setHeartRate] = useState<number>(140);
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [notes, setNotes] = useState<string>('');

  const handleLog = () => {
    if (duration <= 0) {
      toast(translate('cardioLogger.durationError'), 'error');
      return;
    }
    session.addCardioEntry({
      type,
      duration,
      distance: distance > 0 ? distance : undefined,
      intensity,
      heartRate: heartRate > 0 ? heartRate : undefined,
      notes: notes || undefined,
    });
    play('success');
    toast(translate('cardioLogger.loggedToast', { type, count: duration }), 'success');
    setNotes('');
  };

  const tapType = (id: string) => { play('tap'); setType(id); };
  const tapIntensity = (id: 'low' | 'medium' | 'high') => { play('tap'); setIntensity(id); };

  return (
    <div className="space-y-4">
      {/* Type selector */}
      <div>
        <label className="label-cap block mb-2">{translate('cardioLogger.activity')}</label>
        <div className="scroll-hint overflow-x-auto -mx-1 px-1">
          <div className="flex gap-2">
            {CARDIO_TYPES.map((t) => {
              const sel = type === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => tapType(t.id)}
                  className={[
                    'shrink-0 inline-flex items-center gap-1.5 rounded-full',
                    'px-3.5 py-2 min-h-[38px] cursor-pointer press-scale transition-all duration-200',
                    'font-condensed uppercase tracking-wider text-[12px]',
                    sel
                      ? 'bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg-deep font-semibold shadow-[0_4px_14px_rgba(46,204,113,0.3)]'
                      : 'bg-white/[0.04] text-forge-text-soft border border-white/[0.06] hover:text-forge-text',
                  ].join(' ')}
                >
                  <span>{t.emoji}</span>
                  {translate('cardioLogger.types.' + t.id)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form — duration + distance + HR */}
      <div className="card-elevated rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-[auto_1fr_auto] items-end gap-2">
          <button
            onClick={() => setDuration((v) => Math.max(0, v - 5))}
            className="w-11 h-11 rounded-xl card-elevated border border-forge-border-light flex items-center justify-center cursor-pointer press-scale"
            aria-label={translate('cardioLogger.decreaseDuration')}
          >
            <Minus size={16} className="text-forge-muted" />
          </button>
          <Input
            label={translate('cardioLogger.durationLabel')}
            type="number"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 0)}
            leftIcon={<Clock size={14} />}
          />
          <button
            onClick={() => setDuration((v) => v + 5)}
            className="w-11 h-11 rounded-xl card-elevated border border-forge-border-light flex items-center justify-center cursor-pointer press-scale"
            aria-label={translate('cardioLogger.increaseDuration')}
          >
            <Plus size={16} className="text-forge-muted" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Input
            label={translate('cardioLogger.distanceLabel')}
            type="number"
            inputMode="decimal"
            step="0.1"
            value={distance}
            onChange={(e) => setDistance(Number(e.target.value) || 0)}
            leftIcon={<Route size={14} />}
          />
          <Input
            label={translate('cardioLogger.heartRateLabel')}
            type="number"
            inputMode="numeric"
            value={heartRate}
            onChange={(e) => setHeartRate(Number(e.target.value) || 0)}
            leftIcon={<Heart size={14} />}
          />
        </div>

        {/* Intensity */}
        <div>
          <label className="label-cap block mb-1.5">{translate('cardioLogger.intensity')}</label>
          <div className="grid grid-cols-3 gap-2">
            {INTENSITIES.map((i) => {
              const sel = intensity === i.id;
              return (
                <button
                  key={i.id}
                  onClick={() => tapIntensity(i.id)}
                  className={[
                    'rounded-xl py-2.5 cursor-pointer press-scale',
                    'font-condensed uppercase tracking-wider text-[12px]',
                    'transition-all duration-200 border',
                  ].join(' ')}
                  style={{
                    background: sel ? `${i.color}22` : 'rgba(255,255,255,0.04)',
                    borderColor: sel ? `${i.color}aa` : 'rgba(255,255,255,0.06)',
                    color: sel ? i.color : 'var(--color-forge-text-soft)',
                    boxShadow: sel ? `0 0 12px ${i.color}33` : 'none',
                  }}
                >
                  {translate('cardioLogger.intensityLevels.' + i.id)}
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label={translate('cardioLogger.notesLabel')}
          placeholder={translate('cardioLogger.notesPlaceholder')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          onClick={handleLog}
          className="w-full mt-1 bg-gradient-to-br from-forge-green to-forge-green-dark text-forge-bg-deep py-3 rounded-2xl font-condensed font-bold uppercase tracking-wider text-sm cursor-pointer press-scale min-h-[48px] shadow-[0_6px_20px_rgba(46,204,113,0.32)]"
        >
          {translate('cardioLogger.logButton')}
        </button>
      </div>

      {/* Current session cardio entries */}
      {session.cardioEntries.length > 0 && (
        <div className="space-y-2">
          <div className="label-cap">{translate('cardioLogger.loggedThisSession')}</div>
          {session.cardioEntries.map((c, i) => (
            <div
              key={i}
              className="card-elevated rounded-xl p-3 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-forge-green/10 flex items-center justify-center">
                <Route size={14} className="text-forge-green" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-forge-text text-[14px] font-condensed font-semibold">
                  {c.type}
                </div>
                <div className="text-forge-muted text-[11px] font-mono">
                  {translate('cardioLogger.minUnit', { count: c.duration })}
                  {c.distance !== undefined
                    ? ` · ${translate('cardioLogger.kmUnit', { count: c.distance })}`
                    : ''}
                  {c.heartRate !== undefined
                    ? ` · ${translate('cardioLogger.bpmUnit', { count: c.heartRate })}`
                    : ''}
                </div>
              </div>
              <span className="text-[10px] font-condensed uppercase tracking-wider text-forge-green/80">
                {translate('cardioLogger.intensityLevels.' + c.intensity)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
