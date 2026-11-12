// Display names come from i18n.js ("cat.<id>")
export const CATEGORIES = {
  science: { id: 'science', icon: 'flask', color: '#0EA5E9' },
  history: { id: 'history', icon: 'hourglass', color: '#F59E0B' },
  geography: { id: 'geography', icon: 'earth', color: '#10B981' },
  tech: { id: 'tech', icon: 'hardware-chip', color: '#8B5CF6' },
  nature: { id: 'nature', icon: 'leaf', color: '#65A30D' },
  arts: { id: 'arts', icon: 'color-palette', color: '#EC4899' },
  turkiye: { id: 'turkiye', icon: 'flag', color: '#E11D48' },
};

export const MIXED = { id: 'mixed', icon: 'shuffle', color: '#EAB308' };
const REVIEW = { id: 'review', icon: 'refresh', color: '#F97316' };

export function categoryInfo(id) {
  return CATEGORIES[id] || (id === 'review' ? REVIEW : MIXED);
}

export const QUESTION_COUNTS = [5, 10, 15];
export const TIME_LIMITS = [10, 20, 30]; // seconds per question
export const DEFAULT_TIME_LIMIT = 20;

// Scoring: a correct answer is worth 500–1,000 points depending on speed,
// plus a streak bonus of 100 points per extra correct answer in a row (max 500).
export const MAX_POINTS = 1000;
export const STREAK_BONUS = 100;
export const MAX_STREAK_BONUS = 500;

export const POINTS_PER_LEVEL = 5000;
export const WEEKLY_GOAL = 100; // questions per week
export const PAGE_SIZE = 20;

// Login lockout: after 5 wrong tries, lock for increasing times (minutes)
export const MAX_ATTEMPTS = 5;
export const LOCK_MINUTES = [3, 5, 60, 120];
