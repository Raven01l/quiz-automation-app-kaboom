import { createContext, useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';

// Playful themes: one light (default) and three dark. Players switch in Profile.
export const THEMES = {
  // Light default (the instructor preferred light, simple designs)
  day: {
    id: 'day',
    dark: false,
    bg: '#F6F4FF',
    surface: '#FFFFFF',
    surface2: '#EEEAFB',
    border: '#E2DCF5',
    text: '#1E1537',
    muted: '#6B6390',
    accent: '#7C3AED',
    accentStrong: '#6D28D9',
    accentSoft: 'rgba(124, 58, 237, 0.12)',
    goldText: '#B45309',
  },
  galaxy: {
    id: 'galaxy',
    dark: true,
    bg: '#1A1033',
    surface: '#261A47',
    surface2: '#312158',
    border: '#3D2C6B',
    text: '#F5F3FF',
    muted: '#B8AEDC',
    accent: '#A855F7',
    accentStrong: '#C084FC',
    accentSoft: 'rgba(168, 85, 247, 0.18)',
    goldText: '#FACC15',
  },
  ocean: {
    id: 'ocean',
    dark: true,
    bg: '#0B1B2E',
    surface: '#12273F',
    surface2: '#183352',
    border: '#24446D',
    text: '#EFF6FF',
    muted: '#9DB4D3',
    accent: '#06B6D4',
    accentStrong: '#22D3EE',
    accentSoft: 'rgba(6, 182, 212, 0.18)',
    goldText: '#FACC15',
  },
  volcano: {
    id: 'volcano',
    dark: true,
    bg: '#22101A',
    surface: '#331828',
    surface2: '#422034',
    border: '#552A43',
    text: '#FFF1F2',
    muted: '#DDB0C0',
    accent: '#F43F5E',
    accentStrong: '#FB7185',
    accentSoft: 'rgba(244, 63, 94, 0.18)',
    goldText: '#FACC15',
  },
};

// Colors shared by every theme
export const COMMON = {
  correct: '#22C55E',
  correctSoft: 'rgba(34, 197, 94, 0.18)',
  wrong: '#EF4444',
  wrongSoft: 'rgba(239, 68, 68, 0.18)',
  gold: '#FACC15',
  white: '#FFFFFF',
};

// The four answer tiles: each has its own color AND icon,
// so they can be told apart without relying on color alone.
export const ANSWER_TILES = [
  { color: '#EC4899', icon: 'star' },
  { color: '#0EA5E9', icon: 'flash' },
  { color: '#F59E0B', icon: 'heart' },
  { color: '#65A30D', icon: 'moon' },
];

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const font = { small: 12, body: 14, medium: 16, large: 20, title: 26 };

export const ThemeContext = createContext(THEMES.day);

export function useTheme() {
  return { ...useContext(ThemeContext), ...COMMON };
}

// makeStyles((t) => ({ ... })) returns a hook that rebuilds styles when the theme changes
export function makeStyles(factory) {
  return function useStyles() {
    const t = useTheme();
    return useMemo(() => StyleSheet.create(factory(t)), [t.id]);
  };
}

export function card(t) {
  return {
    backgroundColor: t.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: t.border,
    padding: space.lg,
  };
}
