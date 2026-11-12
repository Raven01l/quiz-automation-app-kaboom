import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import builtInQuestions from './data/questions.json';
import { storage } from './storage';
import { THEMES, ThemeContext } from './theme';
import { translate } from './i18n';
import { checkPassword, hash, isEmail } from './utils';
import { LOCK_MINUTES, MAX_ATTEMPTS } from './config';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const DEFAULT_PREFS = { hideName: true, theme: 'day' };

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [route, setRoute] = useState({ screen: 'Home', params: {}, n: 0 });
  const [lang, setLangState] = useState('tr');

  useEffect(() => {
    (async () => {
      const [session, users, custom, savedLang] = await Promise.all([storage.session(), storage.users(), storage.customQuestions(), storage.lang()]);
      setCustomQuestions(custom);
      setLangState(savedLang === 'en' ? 'en' : 'tr');
      if (session && users[session]) await openSession(users[session]);
      setLoading(false);
    })();
  }, []);

  async function openSession(u) {
    const [g, p] = await Promise.all([storage.games(u.email), storage.prefs(u.email)]);
    setGames(g);
    setPrefs({ ...DEFAULT_PREFS, ...p });
    setUser(u);
    setRoute({ screen: 'Home', params: {}, n: Date.now() });
    await storage.saveSession(u.email);
  }

  const questions = useMemo(() => [...builtInQuestions, ...customQuestions], [customQuestions]);
  const questionMap = useMemo(() => Object.fromEntries(questions.map((q) => [q.id, q])), [questions]);
  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);
  async function setLang(l) {
    setLangState(l);
    await storage.saveLang(l);
  }

  const navigate = useCallback((screen, params = {}) => setRoute({ screen, params, n: Date.now() }), []);

  // ---------- Accounts ----------
  async function signUp({ fullName, email, password, consent }) {
    const e = email.trim().toLowerCase();
    if (fullName.trim().split(/\s+/).length < 2) return t('err.name');
    if (!isEmail(e)) return t('err.email');
    if (!checkPassword(password).valid) return t('err.pwRules');
    if (!consent) return t('err.consent');
    const users = await storage.users();
    if (users[e]) return t('err.exists');
    const u = { fullName: fullName.trim(), email: e, passwordHash: hash(password), provider: 'email', createdAt: Date.now() };
    users[e] = u;
    await storage.saveUsers(users);
    await openSession(u);
    return null;
  }

  async function logIn({ email, password }) {
    const e = email.trim().toLowerCase();
    const attempts = await storage.attempts();
    const a = attempts[e] || { count: 0, level: 0, lockedUntil: 0 };
    if (a.lockedUntil > Date.now()) {
      const min = Math.ceil((a.lockedUntil - Date.now()) / 60000);
      return t('err.locked', { n: min });
    }
    const users = await storage.users();
    const u = users[e];
    if (!u || u.passwordHash !== hash(password)) {
      a.count += 1;
      let msg = t('err.wrongPw', { n: MAX_ATTEMPTS - a.count });
      if (a.count >= MAX_ATTEMPTS) {
        const min = LOCK_MINUTES[Math.min(a.level, LOCK_MINUTES.length - 1)];
        a.lockedUntil = Date.now() + min * 60000;
        a.level += 1;
        a.count = 0;
        msg = t('err.lockedNow', { n: min });
      }
      attempts[e] = a;
      await storage.saveAttempts(attempts);
      return msg;
    }
    delete attempts[e];
    await storage.saveAttempts(attempts);
    await openSession(u);
    return null;
  }

  async function demoLogIn() {
    const e = 'demo@kaboom.app';
    const users = await storage.users();
    if (!users[e]) {
      users[e] = { fullName: lang === 'en' ? 'Demo Player' : 'Demo Oyuncu', email: e, passwordHash: null, provider: 'google-demo', createdAt: Date.now() };
      await storage.saveUsers(users);
    }
    await openSession(users[e]);
  }

  async function logOut() {
    await storage.clearSession();
    setUser(null);
    setGames([]);
  }

  async function changePassword(current, next) {
    const users = await storage.users();
    const u = users[user.email];
    if (u.passwordHash && u.passwordHash !== hash(current)) return t('err.currentPw');
    if (!checkPassword(next).valid) return t('err.newPwRules');
    u.passwordHash = hash(next);
    await storage.saveUsers(users);
    setUser({ ...u });
    return null;
  }

  // Privacy (KVKK): permanently delete the account and all of its data
  async function deleteAccount() {
    const users = await storage.users();
    delete users[user.email];
    await storage.saveUsers(users);
    await storage.deleteUserData(user.email);
    await logOut();
  }

  // ---------- Data ----------
  async function saveGame(game) {
    const next = [game, ...games];
    setGames(next);
    await storage.saveGames(user.email, next);
  }

  async function updatePrefs(change) {
    const next = { ...prefs, ...change };
    setPrefs(next);
    await storage.savePrefs(user.email, next);
  }

  async function addQuestions(list) {
    const existing = new Set(questions.map((q) => q.id));
    const fresh = list.filter((q) => !existing.has(q.id));
    const next = [...customQuestions, ...fresh];
    setCustomQuestions(next);
    await storage.saveCustomQuestions(next);
    return { added: fresh.length, skipped: list.length - fresh.length };
  }

  // Questions whose most recent attempt was wrong or timed out
  const toReview = useMemo(() => {
    const last = {};
    [...games].reverse().forEach((g) =>
      g.answers.forEach((a) => {
        last[a.id] = { status: a.chosen === null ? 'timeout' : a.chosen === a.correct ? 'correct' : 'wrong', date: g.date };
      })
    );
    return Object.entries(last)
      .filter(([id, v]) => v.status !== 'correct' && questionMap[id])
      .map(([id, v]) => ({ question: questionMap[id], ...v }));
  }, [games, questionMap]);

  const totalPoints = useMemo(() => games.reduce((s, g) => s + g.score, 0), [games]);

  const value = {
    loading, user, games, prefs, route, navigate, lang, setLang, tx: t,
    questions, questionMap, customQuestions, toReview, totalPoints,
    signUp, logIn, demoLogIn, logOut, changePassword, deleteAccount,
    saveGame, updatePrefs, addQuestions,
  };

  const theme = THEMES[prefs.theme] || THEMES.day;

  return (
    <AppContext.Provider value={value}>
      <ThemeContext.Provider value={user ? theme : THEMES.day}>{children}</ThemeContext.Provider>
    </AppContext.Provider>
  );
}
