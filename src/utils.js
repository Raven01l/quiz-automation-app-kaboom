import { MAX_POINTS, MAX_STREAK_BONUS, POINTS_PER_LEVEL, STREAK_BONUS } from './config';

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
};

// Full dates: "12 Kasım 2026" / "November 12, 2026" (optionally with time)
export function formatDate(time, lang = 'tr', withTime = false) {
  const d = new Date(time);
  const m = MONTHS[lang] || MONTHS.tr;
  const text = lang === 'en' ? `${m[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
  if (!withTime) return text;
  return `${text}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Thousands separator: 1.963 (tr) / 1,963 (en)
export function formatNumber(n, lang = 'tr') {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, lang === 'en' ? ',' : '.');
}

// Decimal separator: 0,7 (tr) / 0.7 (en)
export function formatDecimal(n, lang = 'tr') {
  const s = n.toFixed(1);
  return lang === 'en' ? s : s.replace('.', ',');
}

// Privacy: "Raven Lee" -> "R**** L."
export function maskName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  const first = parts[0];
  const masked = first[0] + '*'.repeat(Math.max(first.length - 1, 2));
  return parts.length === 1 ? masked : `${masked} ${parts[parts.length - 1][0]}.`;
}

export function firstName(fullName = '') {
  return fullName.trim().split(/\s+/)[0] || '';
}

// Speed-based points: 1,000 for an instant answer down to 500 at the buzzer
export function pointsFor(elapsedMs, limitSec, streak) {
  const ratio = Math.min(1, elapsedMs / (limitSec * 1000));
  const base = Math.round(MAX_POINTS * (1 - ratio / 2));
  const bonus = Math.min(MAX_STREAK_BONUS, Math.max(0, streak - 1) * STREAK_BONUS);
  return { base, bonus, total: base + bonus };
}

export function levelInfo(totalPoints) {
  const level = Math.floor(totalPoints / POINTS_PER_LEVEL) + 1;
  const into = totalPoints % POINTS_PER_LEVEL;
  return { level, into, progress: into / POINTS_PER_LEVEL, toNext: POINTS_PER_LEVEL - into };
}

// Simple (non-cryptographic) hash — for the local demo only.
// A production version must hash passwords on a server with bcrypt/argon2.
export function hash(text) {
  let h1 = 0xdeadbeef ^ text.length;
  let h2 = 0x41c6ce57 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

export function checkPassword(pw) {
  const rules = [
    { ok: pw.length >= 8, key: 'pw.len' },
    { ok: /[A-ZÇĞİÖŞÜ]/.test(pw), key: 'pw.upper' },
    { ok: /[a-zçğıöşü]/.test(pw), key: 'pw.lower' },
    { ok: /\d/.test(pw), key: 'pw.digit' },
  ];
  return { valid: rules.every((r) => r.ok), rules };
}

export function isEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function weekStart(time = Date.now()) {
  const d = new Date(time);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.getTime();
}

function dayKey(time) {
  const d = new Date(time);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Consecutive days (up to today) with at least one game
export function dayStreak(games) {
  const days = new Set(games.map((g) => dayKey(g.date)));
  const d = new Date();
  if (!days.has(dayKey(d.getTime()))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(d.getTime()))) {
    streak += 1;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function rankTitle(accuracy) {
  if (accuracy >= 0.9) return { key: 'rank.legend', icon: 'trophy' };
  if (accuracy >= 0.7) return { key: 'rank.brainiac', icon: 'bulb' };
  if (accuracy >= 0.5) return { key: 'rank.rising', icon: 'star' };
  return { key: 'rank.warming', icon: 'flame' };
}
