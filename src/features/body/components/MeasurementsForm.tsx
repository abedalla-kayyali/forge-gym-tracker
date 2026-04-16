import { useState } from 'react';
import { useBodyStore } from '../../../stores/useBodyStore';
import { useToast } from '../../../components/ui/Toast';
import { useFX } from '../../../hooks/useFX';
import type { Measurement } from '../../../types/body';

const FIELDS: { key: keyof Omit<Measurement, 'date' | 'notes'>; label: string }[] = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'neck', label: 'Neck' },
  { key: 'left_arm', label: 'Left Arm' },
  { key: 'right_arm', label: 'Right Arm' },
  { key: 'left_thigh', label: 'Left Thigh' },
  { key: 'right_thigh', label: 'Right Thigh' },
  { key: 'left_calf', label: 'Left Calf' },
  { key: 'right_calf', label: 'Right Calf' },
];

export function MeasurementsForm() {
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
      toast('Enter at least one measurement', 'error');
      return;
    }
    addMeasurement(entry);
    play('save');
    toast('Measurements saved!', 'success');
    setValues({});
  };

  // Get latest measurement for placeholders
  const latest = measurements.length > 0 ? measurements[measurements.length - 1] : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-forge-muted text-[10px] font-condensed uppercase">{f.label}</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder={latest?.[f.key] != null ? String(latest[f.key]) : 'cm'}
              value={values[f.key] ?? ''}
              onChange={(e) => handleChange(f.key, e.target.value)}
              className="bg-forge-bg border border-forge-border rounded-lg px-2.5 py-2 text-forge-text text-sm font-mono placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-green"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        className="w-full bg-forge-green text-forge-bg py-2.5 rounded-lg font-condensed font-semibold text-sm"
      >
        Save Measurements
      </button>
    </div>
  );
}
