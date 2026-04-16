import { describe, it, expect, beforeEach } from 'vitest';
import { readStorage, writeStorage, removeStorage } from '../storage';

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
