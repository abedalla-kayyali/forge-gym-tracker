// en/ar locale parity — every key must exist in both files, no value may be an
// empty string, and each key's {{placeholder}} set must match across locales.
import { describe, it, expect } from 'vitest';
import en from '../en.json';
import ar from '../ar.json';

type Tree = Record<string, unknown>;

function flatten(obj: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const [ck, cv] of flatten(v as Tree, key)) out.set(ck, cv);
    } else {
      out.set(key, String(v));
    }
  }
  return out;
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]!).sort();
}

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

/**
 * Numeric placeholders that mirror the plural `count` argument. On
 * plural-category keys these may legitimately be omitted in specific CLDR
 * categories (Arabic zero/one/two spell the number out; English `_one` says
 * "1 PR"). `weeks` is passed alongside count in progressGuide.plateau.chip.
 */
const IMPLICIT_PLURAL_PLACEHOLDERS = new Set(['count', 'weeks']);

/**
 * For plural-category keys, i18next always receives `count` (and its aliases),
 * so those are treated as implicit; every other placeholder must match
 * exactly across locales. Non-plural keys must match exactly.
 */
function comparablePlaceholders(key: string, value: string): string[] {
  const ph = placeholders(value);
  return PLURAL_SUFFIX.test(key) ? ph.filter((p) => !IMPLICIT_PLURAL_PLACEHOLDERS.has(p)) : ph;
}

const flatEn = flatten(en as Tree);
const flatAr = flatten(ar as Tree);

describe('i18n en/ar parity', () => {
  it('has identical flattened key sets', () => {
    const enKeys = [...flatEn.keys()].sort();
    const arKeys = [...flatAr.keys()].sort();

    const missingInAr = enKeys.filter((k) => !flatAr.has(k));
    const missingInEn = arKeys.filter((k) => !flatEn.has(k));

    expect(missingInAr, `keys missing in ar.json: ${missingInAr.join(', ')}`).toEqual([]);
    expect(missingInEn, `keys missing in en.json: ${missingInEn.join(', ')}`).toEqual([]);
    expect(arKeys).toEqual(enKeys);
  });

  it('has no empty string values', () => {
    const emptyEn = [...flatEn.entries()].filter(([, v]) => v.trim() === '').map(([k]) => k);
    const emptyAr = [...flatAr.entries()].filter(([, v]) => v.trim() === '').map(([k]) => k);

    expect(emptyEn, `empty values in en.json: ${emptyEn.join(', ')}`).toEqual([]);
    expect(emptyAr, `empty values in ar.json: ${emptyAr.join(', ')}`).toEqual([]);
  });

  it('has matching {{placeholder}} sets per key', () => {
    const mismatches: string[] = [];
    for (const [key, enValue] of flatEn) {
      const arValue = flatAr.get(key);
      if (arValue === undefined) continue; // covered by the key-set test
      const enPh = comparablePlaceholders(key, enValue);
      const arPh = comparablePlaceholders(key, arValue);
      if (enPh.join('|') !== arPh.join('|')) {
        mismatches.push(`${key}: en[${enPh.join(',')}] vs ar[${arPh.join(',')}]`);
      }
    }
    expect(mismatches, `placeholder mismatches:\n${mismatches.join('\n')}`).toEqual([]);
  });
});
