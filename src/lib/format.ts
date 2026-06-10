import i18n from './i18n';

/**
 * Locale-aware formatting helpers tied to the active i18next language.
 *
 * Numbers/weights deliberately use Western (Latin) digits even in Arabic
 * (`ar-u-nu-latn`) — gym KPIs (weights, reps, volume) read more clearly with
 * Latin digits across MENA, and they line up in tables. Dates are localized.
 */
function numberLocale(): string {
  return i18n.language?.startsWith('ar') ? 'ar-u-nu-latn' : 'en-US';
}

function dateLocale(): string {
  return i18n.language?.startsWith('ar') ? 'ar' : 'en-US';
}

export function formatNumber(n: number, opts?: Intl.NumberFormatOptions): string {
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat(numberLocale(), opts).format(n);
}

/** Weight with up to 1 decimal (e.g. 82.5). Unit is appended by the caller via t('log.kgUnit'). */
export function formatWeight(kg: number): string {
  return formatNumber(kg, { maximumFractionDigits: 1 });
}

export function formatDate(value: string | number | Date, opts?: Intl.DateTimeFormatOptions): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(dateLocale(), opts ?? { month: 'short', day: 'numeric' }).format(d);
}

/**
 * YYYY-MM-DD key from a Date's LOCAL components (not UTC).
 * toISOString() would shift a local date at e.g. UTC+3 onto the previous UTC
 * day and mark the wrong calendar day. Always bucket local days with this.
 */
export function localYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
