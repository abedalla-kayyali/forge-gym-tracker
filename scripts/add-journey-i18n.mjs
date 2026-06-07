import { readFileSync, writeFileSync } from 'node:fs';

const EN_PATH = 'src/i18n/en.json';
const AR_PATH = 'src/i18n/ar.json';

const en = {
  journey: {
    title: 'Your Journey',
    subtitle: "Everything you've built, all-time",
    empty: 'Log your first workout to start your journey.',
    totals: {
      sessions: 'Sessions',
      volume: 'Volume',
      sets: 'Total sets',
      reps: 'Total reps',
      trainingDays: 'Training days',
      cardioMin: 'Cardio',
      since: 'Since {{date}}',
    },
    strength: {
      title: 'Strength trends',
      subtitle: 'est. 1RM',
      empty: 'Log weighted lifts to see strength trends.',
      best: 'Best',
    },
    calendar: {
      title: 'Consistency',
      subtitle: '{{count}} training days in the last {{weeks}} weeks',
      less: 'Less',
      more: 'More',
      dayAria: '{{count}} sessions on {{date}}',
    },
    a11y: {
      achieved: 'achieved',
      locked: 'locked',
      up: 'up {{pct}}%',
      down: 'down {{pct}}%',
      flat: 'no change',
    },
    milestones: {
      title: 'Milestones',
      unlocked: '{{count}}/{{total}} unlocked',
      firstStep: 'First Step',
      committed: 'Committed',
      dedicated: 'Dedicated',
      centurion: 'Centurion',
      tonnage1: 'Iron Mover',
      tonnage2: 'Heavy Hauler',
      tonnage3: 'Million Club',
      streak7: 'Week Warrior',
      streak30: 'Unbreakable',
      days50: 'Half-Century',
    },
  },
};

const ar = {
  journey: {
    title: 'رحلتك',
    subtitle: 'كل ما بنيته منذ البداية',
    empty: 'سجّل أول تمرين لتبدأ رحلتك.',
    totals: {
      sessions: 'الجلسات',
      volume: 'الحِمل',
      sets: 'إجمالي المجموعات',
      reps: 'إجمالي التكرارات',
      trainingDays: 'أيام التدريب',
      cardioMin: 'كارديو',
      since: 'منذ {{date}}',
    },
    strength: {
      title: 'تطوّر القوة',
      subtitle: '1RM مُقدّر',
      empty: 'سجّل تمارين بالأوزان لرؤية تطوّر القوة.',
      best: 'الأفضل',
    },
    calendar: {
      title: 'الانتظام',
      subtitle: '{{count}} يوم تدريب خلال آخر {{weeks}} أسبوعًا',
      less: 'أقل',
      more: 'أكثر',
      dayAria: '{{count}} جلسات في {{date}}',
    },
    a11y: {
      achieved: 'مُنجز',
      locked: 'مقفل',
      up: 'ارتفاع {{pct}}%',
      down: 'انخفاض {{pct}}%',
      flat: 'بدون تغيير',
    },
    milestones: {
      title: 'الإنجازات',
      unlocked: '{{count}}/{{total}} مفتوحة',
      firstStep: 'الخطوة الأولى',
      committed: 'ملتزم',
      dedicated: 'مُتفانٍ',
      centurion: 'المئوي',
      tonnage1: 'محرّك الحديد',
      tonnage2: 'الحمّال الثقيل',
      tonnage3: 'نادي المليون',
      streak7: 'محارب الأسبوع',
      streak30: 'لا يُقهر',
      days50: 'نصف قرن',
    },
  },
};

function deepMerge(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      deepMerge(target[k], v);
    } else if (!(k in target)) {
      target[k] = v;
    }
  }
}

function flatKeys(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...flatKeys(v, key));
    else out.push(key);
  }
  return out;
}

const enJson = JSON.parse(readFileSync(EN_PATH, 'utf8'));
const arJson = JSON.parse(readFileSync(AR_PATH, 'utf8'));

deepMerge(enJson, en);
deepMerge(arJson, ar);

writeFileSync(EN_PATH, JSON.stringify(enJson, null, 2) + '\n', 'utf8');
writeFileSync(AR_PATH, JSON.stringify(arJson, null, 2) + '\n', 'utf8');

const enKeys = new Set(flatKeys(enJson));
const arKeys = new Set(flatKeys(arJson));
const missingInAr = [...enKeys].filter((k) => !arKeys.has(k));
const missingInEn = [...arKeys].filter((k) => !enKeys.has(k));

console.log(`en keys: ${enKeys.size}`);
console.log(`ar keys: ${arKeys.size}`);
console.log(`missing in ar: ${missingInAr.length ? missingInAr.join(', ') : 'none'}`);
console.log(`missing in en: ${missingInEn.length ? missingInEn.join(', ') : 'none'}`);
console.log(`parity: ${enKeys.size === arKeys.size && missingInAr.length === 0 && missingInEn.length === 0 ? 'OK' : 'MISMATCH'}`);
