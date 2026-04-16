import { useCallback } from 'react';
import { useToast } from '../../../components/ui/Toast';
import { STORAGE_KEYS } from '../../../lib/constants';
import { Card } from '../../../components/ui/Card';

const EXPORT_KEYS = [
  STORAGE_KEYS.WORKOUTS,
  STORAGE_KEYS.BW_WORKOUTS,
  STORAGE_KEYS.CARDIO,
  STORAGE_KEYS.PROFILE,
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.MEALS,
  STORAGE_KEYS.MEAL_LIBRARY,
  STORAGE_KEYS.MEASUREMENTS,
  STORAGE_KEYS.INBODY,
  STORAGE_KEYS.BODY_WEIGHT,
  STORAGE_KEYS.ACHIEVEMENTS,
  STORAGE_KEYS.EXPERIENCE,
  STORAGE_KEYS.STEPS,
  STORAGE_KEYS.TEMPLATES,
];

export function DataTransfer() {
  const { toast } = useToast();

  const handleExport = useCallback(() => {
    const data: Record<string, unknown> = {};
    for (const key of EXPORT_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try { data[key] = JSON.parse(raw); } catch { data[key] = raw; }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forge-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Data exported!', 'success');
  }, [toast]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          let count = 0;
          for (const [key, value] of Object.entries(data)) {
            if (key.startsWith('forge_')) {
              localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
              count++;
            }
          }
          toast(`Imported ${count} data keys. Reload to apply.`, 'success');
        } catch {
          toast('Invalid backup file', 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [toast],
  );

  return (
    <Card className="space-y-3">
      <h3 className="text-forge-muted text-xs font-condensed uppercase">Data</h3>
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 bg-forge-surface border border-forge-border py-2.5 rounded-lg text-forge-text text-sm font-condensed hover:border-forge-green/50"
        >
          Export JSON
        </button>
        <label className="flex-1 flex items-center justify-center bg-forge-surface border border-forge-border py-2.5 rounded-lg text-forge-text text-sm font-condensed cursor-pointer hover:border-forge-green/50">
          Import JSON
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>
    </Card>
  );
}
