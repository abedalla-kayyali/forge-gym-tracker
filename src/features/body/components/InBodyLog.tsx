import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBodyStore } from '../../../stores/useBodyStore';
import { useToast } from '../../../components/ui/Toast';
import { useFX } from '../../../hooks/useFX';
import type { InBodyEntry } from '../../../types/body';

const INBODY_FIELDS: { key: string; labelKey: string; unit: string }[] = [
  { key: 'muscle_mass', labelKey: 'inbody.fieldMuscleMass', unit: 'kg' },
  { key: 'body_fat', labelKey: 'inbody.fieldBodyFat', unit: 'kg' },
  { key: 'body_fat_pct', labelKey: 'inbody.fieldBodyFatPct', unit: '%' },
  { key: 'water', labelKey: 'inbody.fieldBodyWater', unit: 'L' },
  { key: 'bmi', labelKey: 'inbody.fieldBmi', unit: '' },
];

export function InBodyLog() {
  const { t } = useTranslation();
  const { inbody, addInBody } = useBodyStore();
  const { toast } = useToast();
  const { play } = useFX();
  const [values, setValues] = useState<Record<string, string>>({});

  const recent = useMemo(() => {
    return [...inbody]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [inbody]);

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    const entry: Record<string, unknown> = { date: new Date().toISOString() };
    let hasValue = false;
    for (const f of INBODY_FIELDS) {
      const v = parseFloat(values[f.key] ?? '');
      if (!isNaN(v) && v > 0) {
        entry[f.key] = v;
        hasValue = true;
      }
    }
    if (!hasValue) {
      toast(t('inbody.errorNoValue'), 'error');
      return;
    }
    addInBody(entry as unknown as InBodyEntry);
    play('save');
    toast(t('inbody.toastSaved'), 'success');
    setValues({});
  };

  return (
    <div className="space-y-4">
      {/* Input fields */}
      <div className="grid grid-cols-2 gap-2">
        {INBODY_FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-forge-muted text-[10px] font-condensed uppercase">
              {t(f.labelKey)} {f.unit && <span className="text-forge-dim">({f.unit})</span>}
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="—"
              value={values[f.key] ?? ''}
              onChange={(e) => handleChange(f.key, e.target.value)}
              className="bg-forge-surface border border-forge-border rounded-lg px-2.5 py-2 text-forge-text text-sm font-mono placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green focus:shadow-[0_0_0_2px_rgba(46,204,113,0.15)] transition-all"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        className="w-full bg-forge-green text-forge-bg min-h-[44px] rounded-lg font-condensed font-semibold text-sm cursor-pointer press-scale"
      >
        {t('inbody.saveButton')}
      </button>

      {/* History */}
      {recent.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-forge-muted text-xs font-condensed uppercase">{t('inbody.recentScans')}</h4>
          {recent.map((e, i) => (
            <div key={i} className="card-elevated space-y-1 py-2 px-3 rounded-xl">
              <div className="text-forge-dim text-xs">
                {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {e.muscle_mass != null && <span className="text-forge-text"><span className="text-forge-muted">{t('inbody.histMuscle')}</span> {e.muscle_mass}kg</span>}
                {e.body_fat_pct != null && <span className="text-forge-text"><span className="text-forge-muted">{t('inbody.histBodyFat')}</span> {e.body_fat_pct}%</span>}
                {e.water != null && <span className="text-forge-text"><span className="text-forge-muted">{t('inbody.histWater')}</span> {e.water}L</span>}
                {e.bmi != null && <span className="text-forge-text"><span className="text-forge-muted">{t('inbody.histBmi')}</span> {e.bmi}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
