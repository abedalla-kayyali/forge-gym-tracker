import { useState, useMemo } from 'react';
import { useBodyStore } from '../../../stores/useBodyStore';
import { useToast } from '../../../components/ui/Toast';
import { useFX } from '../../../hooks/useFX';
import { Card } from '../../../components/ui/Card';

const INBODY_FIELDS: { key: string; label: string; unit: string }[] = [
  { key: 'muscle_mass', label: 'Muscle Mass', unit: 'kg' },
  { key: 'body_fat', label: 'Body Fat', unit: 'kg' },
  { key: 'body_fat_pct', label: 'Body Fat %', unit: '%' },
  { key: 'water', label: 'Body Water', unit: 'L' },
  { key: 'bmi', label: 'BMI', unit: '' },
];

export function InBodyLog() {
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
      toast('Enter at least one InBody value', 'error');
      return;
    }
    addInBody(entry as any);
    play('save');
    toast('InBody data saved!', 'success');
    setValues({});
  };

  return (
    <div className="space-y-4">
      {/* Input fields */}
      <div className="grid grid-cols-2 gap-2">
        {INBODY_FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-forge-muted text-[10px] font-condensed uppercase">
              {f.label} {f.unit && <span className="text-forge-muted/50">({f.unit})</span>}
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="—"
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
        Save InBody Data
      </button>

      {/* History */}
      {recent.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-forge-muted text-xs font-condensed uppercase">Recent Scans</h4>
          {recent.map((e, i) => (
            <Card key={i} className="space-y-1 py-2 px-3">
              <div className="text-forge-muted text-xs">
                {new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {e.muscle_mass != null && <span className="text-forge-text"><span className="text-forge-muted">Muscle:</span> {e.muscle_mass}kg</span>}
                {e.body_fat_pct != null && <span className="text-forge-text"><span className="text-forge-muted">BF:</span> {e.body_fat_pct}%</span>}
                {e.water != null && <span className="text-forge-text"><span className="text-forge-muted">Water:</span> {e.water}L</span>}
                {e.bmi != null && <span className="text-forge-text"><span className="text-forge-muted">BMI:</span> {e.bmi}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
