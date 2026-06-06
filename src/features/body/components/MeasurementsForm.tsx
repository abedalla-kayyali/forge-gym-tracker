import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBodyStore } from '../../../stores/useBodyStore';
import { useToast } from '../../../components/ui/Toast';
import { useFX } from '../../../hooks/useFX';
import type { Measurement } from '../../../types/body';

const FIELDS: { key: keyof Omit<Measurement, 'date' | 'notes'>; labelKey: string }[] = [
  { key: 'chest', labelKey: 'chest' },
  { key: 'waist', labelKey: 'waist' },
  { key: 'hips', labelKey: 'hips' },
  { key: 'shoulders', labelKey: 'shoulders' },
  { key: 'neck', labelKey: 'neck' },
  { key: 'left_arm', labelKey: 'leftArm' },
  { key: 'right_arm', labelKey: 'rightArm' },
  { key: 'left_thigh', labelKey: 'leftThigh' },
  { key: 'right_thigh', labelKey: 'rightThigh' },
  { key: 'left_calf', labelKey: 'leftCalf' },
  { key: 'right_calf', labelKey: 'rightCalf' },
];

export function MeasurementsForm() {
  const { t } = useTranslation();
  const { addMeasurement, measurements } = useBodyStore();
  const { toast } = useToast();
  const { play } = useFX();
  const [values, setValues] = useState<Partial<Record<keyof Omit<Measurement, 'date' | 'notes'>, string>>>({});

  const handleChange = (key: keyof Omit<Measurement, 'date' | 'notes'>, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    const entry: Measurement = { date: new Date().toISOString() };
    let hasValue = false;
    for (const f of FIELDS) {
      const v = parseFloat(values[f.key] ?? '');
      if (!isNaN(v) && v > 0) {
        (entry as unknown as Record<string, unknown>)[f.key] = v;
        hasValue = true;
      }
    }
    if (!hasValue) {
      toast(t('measurements.enterAtLeastOne'), 'error');
      return;
    }
    addMeasurement(entry);
    play('save');
    toast(t('measurements.saved'), 'success');
    setValues({});
  };

  // Get latest measurement for placeholders
  const latest = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-forge-muted text-[10px] font-condensed uppercase">{t('measurements.' + f.labelKey)}</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder={latest?.[f.key] != null ? String(latest[f.key]) : t('measurements.cmUnit')}
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
        {t('measurements.saveMeasurements')}
      </button>
    </div>
  );
}
