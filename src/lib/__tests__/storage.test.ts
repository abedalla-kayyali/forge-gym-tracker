import { describe, it, expect, beforeEach } from 'vitest';
import { readStorage, writeStorage, removeStorage, normalizeWorkoutList } from '../storage';

describe('storage bridge', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns fallback when key does not exist', () => {
    const result = readStorage<string[]>('nonexistent', []);
    expect(result).toEqual([]);
  });

  it('reads JSON data written by old app format', () => {
    localStorage.setItem(
      'forge_workouts',
      JSON.stringify([{ id: 'w1', date: '2026-04-16', name: 'Push', exercises: [] }]),
    );
    const result = readStorage<Array<{ id: string }>>('forge_workouts', []);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('w1');
  });

  it('writes JSON data readable by old app', () => {
    writeStorage('forge_workouts', [{ id: 'w2', date: '2026-04-16' }]);
    const raw = localStorage.getItem('forge_workouts');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed[0]!.id).toBe('w2');
  });

  it('reads plain string values (theme, lang)', () => {
    localStorage.setItem('forge_lang', 'ar');
    const result = readStorage<string>('forge_lang', 'en');
    expect(result).toBe('ar');
  });

  it('writes plain string values without JSON wrapping', () => {
    writeStorage('forge_sound', 'off');
    const raw = localStorage.getItem('forge_sound');
    expect(raw).toBe('off'); // NOT '"off"' (no JSON quotes)
  });

  it('handles corrupt JSON gracefully', () => {
    localStorage.setItem('forge_workouts', '{invalid json');
    const result = readStorage<string[]>('forge_workouts', []);
    expect(result).toEqual([]);
  });

  it('removes a key', () => {
    localStorage.setItem('forge_test', '"value"');
    removeStorage('forge_test');
    expect(localStorage.getItem('forge_test')).toBeNull();
  });

  it('reads string flags without JSON wrapping', () => {
    localStorage.setItem('forge_sound', 'off');
    const result = readStorage<string>('forge_sound', 'on');
    expect(result).toBe('off');
  });

  it('reads numeric JSON values correctly', () => {
    localStorage.setItem('forge_experience', '1500');
    const result = readStorage<number>('forge_experience', 0);
    expect(result).toBe(1500);
  });

  it('reads object JSON values correctly', () => {
    const profile = { name: 'John', age: 28, weight_kg: 85 };
    localStorage.setItem('forge_profile', JSON.stringify(profile));
    const result = readStorage<typeof profile>('forge_profile', { name: '', age: 0, weight_kg: 0 });
    expect(result.name).toBe('John');
    expect(result.weight_kg).toBe(85);
  });
});

describe('normalizeWorkoutList', () => {
  it('returns [] for non-array input', () => {
    expect(normalizeWorkoutList(null)).toEqual([]);
    expect(normalizeWorkoutList(undefined)).toEqual([]);
    expect(normalizeWorkoutList({})).toEqual([]);
  });

  it('guarantees an exercises array even when missing (the crash repro)', () => {
    // Legacy/old-schema record with no `exercises` field — previously crashed
    // consumers doing `for (const ex of w.exercises)`.
    const out = normalizeWorkoutList<{ exercises: unknown[] }>([{ id: 'w1', date: '2026-01-01' }]);
    expect(out[0]!.exercises).toEqual([]);
    // Must be iterable
    expect(() => [...out[0]!.exercises]).not.toThrow();
  });

  it('coerces a non-array exercises field to []', () => {
    const out = normalizeWorkoutList<{ exercises: unknown[] }>([
      { id: 'w1', date: '2026-01-01', exercises: 'oops' },
    ]);
    expect(out[0]!.exercises).toEqual([]);
  });

  it('guarantees each exercise has a sets array', () => {
    const out = normalizeWorkoutList<{ exercises: { sets: unknown[] }[] }>([
      { id: 'w1', date: '2026-01-01', exercises: [{ name: 'Bench', muscle: 'chest' }] },
    ]);
    expect(out[0]!.exercises[0]!.sets).toEqual([]);
  });

  it('coerces a missing/invalid date to an empty string', () => {
    const out = normalizeWorkoutList<{ date: string }>([{ id: 'w1' }, { id: 'w2', date: 123 }]);
    expect(out[0]!.date).toBe('');
    expect(out[1]!.date).toBe('');
  });

  it('drops non-object entries but preserves valid records', () => {
    const out = normalizeWorkoutList<{ id?: string; exercises: unknown[] }>([
      null,
      'bad',
      { id: 'w1', date: '2026-01-01', exercises: [{ name: 'Squat', muscle: 'legs', sets: [{ reps: 5, weight: 100 }] }] },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]!.id).toBe('w1');
    expect(out[0]!.exercises[0]).toMatchObject({ name: 'Squat' });
  });
});
