import { CATEGORIES } from './config';
import { dayStreak } from './utils';

const answered = (games) => games.reduce((n, g) => n + g.answers.length, 0);

export const BADGES = [
  { id: 'first', icon: 'rocket', check: (g) => [Math.min(g.length, 1), 1] },
  { id: 'hundred', icon: 'albums', check: (g) => [Math.min(answered(g), 100), 100] },
  {
    id: 'perfect',
    icon: 'diamond',
    check: (g) => [g.some((x) => x.answers.length >= 10 && x.correctCount === x.answers.length) ? 1 : 0, 1],
  },
  { id: 'streak5', icon: 'flame', check: (g) => [Math.min(Math.max(0, ...g.map((x) => x.bestStreak)), 5), 5] },
  {
    id: 'speed',
    icon: 'flash',
    check: (g) => [g.some((x) => x.answers.some((a) => a.chosen === a.correct && a.timeMs < 2000)) ? 1 : 0, 1],
  },
  { id: 'score10k', icon: 'trophy', check: (g) => [Math.min(Math.max(0, ...g.map((x) => x.score)), 10000), 10000] },
  {
    id: 'explorer',
    icon: 'compass',
    check: (g) => {
      const cats = new Set(g.map((x) => x.category).filter((c) => CATEGORIES[c]));
      return [cats.size, Object.keys(CATEGORIES).length];
    },
  },
  { id: 'week', icon: 'calendar', check: (g) => [Math.min(dayStreak(g), 7), 7] },
];

// Names and descriptions come from i18n.js ("badge.<id>.name" / "badge.<id>.desc")
export function badgeStatus(games) {
  return BADGES.map((b) => {
    const [current, target] = b.check(games);
    return { ...b, current, target, earned: current >= target };
  });
}
