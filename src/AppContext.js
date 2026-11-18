import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import builtInQuestions from './data/questions.json';
import { backend } from './backend';
import { storage } from './storage';
import { THEMES, ThemeContext } from './theme';
import { translate } from './i18n';
import { checkPassword, isEmail, shuffle } from './utils';
import { LOCK_MINUTES, MAX_ATTEMPTS, normalizeCategory } from './config';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const DEFAULT_PREFS = { hideName: true, theme: 'day' };

// Old data may use a category that was merged into another one (e.g. "nature" → "science")
const fixQuestion = (q) => ({ ...q, category: normalizeCategory(q.category) });
const fixGame = (g) => ({ ...g, category: normalizeCategory(g.category), answers: g.answers.map((a) => ({ ...a, category: normalizeCategory(a.category) })) });
const DAY = 24 * 60 * 60 * 1000;

// Firebase error codes → keys in i18n.js
const ERRORS = {
  'auth/email-already-in-use': 'err.exists',
  'auth/invalid-email': 'err.email',
  'auth/weak-password': 'err.pwRules',
  'auth/invalid-credential': 'err.badLogin',
  'auth/wrong-password': 'err.badLogin',
  'auth/user-not-found': 'err.badLogin',
  'auth/too-many-requests': 'err.tooMany',
  'auth/network-request-failed': 'err.network',
  'auth/requires-recent-login': 'err.reauth',
  'auth/admin-restricted-operation': 'err.guestOff',
  'auth/operation-not-allowed': 'err.guestOff',
  'permission-denied': 'err.permission',
  unavailable: 'err.network',
  'duel/not-found': 'duel.errNotFound',
  'duel/full': 'duel.errFull',
  'duel/started': 'duel.errStarted',
  'duel/own-room': 'duel.errOwn',
  'duel/try-again': 'err.generic',
};

export function AppProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [community, setCommunity] = useState([]);
  const [route, setRoute] = useState({ screen: 'Home', params: {}, n: 0 });
  const [lang, setLangState] = useState('tr');
  const pendingProfile = useRef(null); // filled in by sign-up / guest before Firebase signs the user in

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);
  const errorText = useCallback((e) => t(ERRORS[e?.code] || 'err.generic'), [t]);
  const navigate = useCallback((screen, params = {}) => setRoute({ screen, params, n: Date.now() }), []);

  useEffect(() => {
    storage.lang().then((l) => setLangState(l === 'en' ? 'en' : 'tr'));
    if (!backend.isConfigured) {
      setLoading(false);
      return undefined;
    }
    return backend.onAuth(async (authUser) => {
      if (!authUser) {
        setUser(null);
        setGames([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let profile = await backend.getProfile(authUser.uid);
        if (!profile) {
          profile = pendingProfile.current || newProfile(authUser.email ? authUser.email.split('@')[0] : 'Player', authUser);
          pendingProfile.current = null;
          await backend.createProfile(authUser.uid, profile);
        }
        const [g, q] = await Promise.all([backend.listGames(authUser.uid), backend.listApprovedQuestions()]);
        setGames(g.map(fixGame));
        setCommunity(q.map(fixQuestion));
        setUser({ ...profile, uid: authUser.uid, isAnonymous: authUser.isAnonymous });
        setRoute({ screen: 'Home', params: {}, n: Date.now() });
      } catch (e) {
        console.warn('Loading profile failed', e);
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  function newProfile(fullName, authUser) {
    return {
      fullName,
      email: authUser?.email || null,
      provider: authUser?.isAnonymous ? 'guest' : 'email',
      role: 'user',
      createdAt: Date.now(),
      prefs: DEFAULT_PREFS,
      holidays: [],
    };
  }

  async function setLang(l) {
    setLangState(l);
    await storage.saveLang(l);
  }

  // ---------- Accounts ----------
  async function signUp({ fullName, email, password, consent }) {
    const e = email.trim().toLowerCase();
    if (fullName.trim().split(/\s+/).length < 2) return t('err.name');
    if (!isEmail(e)) return t('err.email');
    if (!checkPassword(password).valid) return t('err.pwRules');
    if (!consent) return t('err.consent');
    pendingProfile.current = { ...newProfile(fullName.trim(), { email: e }), consentAt: Date.now() };
    try {
      await backend.signUp({ email: e, password });
      return null;
    } catch (err) {
      pendingProfile.current = null;
      return errorText(err);
    }
  }

  async function logIn({ email, password }) {
    const e = email.trim().toLowerCase();
    const attempts = await storage.attempts();
    const a = attempts[e] || { count: 0, level: 0, lockedUntil: 0 };
    if (a.lockedUntil > Date.now()) return t('err.locked', { n: Math.ceil((a.lockedUntil - Date.now()) / 60000) });
    try {
      await backend.logIn({ email: e, password });
      delete attempts[e];
      await storage.saveAttempts(attempts);
      return null;
    } catch (err) {
      if (ERRORS[err?.code] !== 'err.badLogin') return errorText(err);
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
  }

  async function guestLogIn() {
    const name = `${t('guestName')} ${Math.floor(100 + Math.random() * 900)}`;
    pendingProfile.current = { ...newProfile(name, { isAnonymous: true }), consentAt: Date.now() };
    try {
      await backend.guest();
      return null;
    } catch (err) {
      pendingProfile.current = null;
      return errorText(err);
    }
  }

  async function logOut() {
    await backend.logOut();
    navigate('Home');
  }

  async function changePassword(current, next) {
    if (!checkPassword(next).valid) return t('err.newPwRules');
    try {
      await backend.changePassword(current, next);
      return null;
    } catch (err) {
      return ERRORS[err?.code] === 'err.badLogin' ? t('err.currentPw') : errorText(err);
    }
  }

  // Privacy (KVKK): optional anonymous reason, then delete everything
  async function deleteAccount({ password, reason, comment }) {
    try {
      if (reason || comment) {
        await backend.sendFeedback({ type: 'account-deleted', reason: reason || null, comment: (comment || '').slice(0, 1000), lang, createdAt: Date.now() });
      }
      await backend.deleteAccount(user.uid, password);
      setUser(null);
      setGames([]);
      return null;
    } catch (err) {
      return ERRORS[err?.code] === 'err.badLogin' ? t('err.currentPw') : errorText(err);
    }
  }

  // ---------- Profile ----------
  async function patchProfile(patch) {
    setUser((u) => ({ ...u, ...patch }));
    try {
      await backend.updateProfile(user.uid, patch);
    } catch (e) {
      console.warn('Saving profile failed', e);
    }
  }

  const prefs = { ...DEFAULT_PREFS, ...(user?.prefs || {}) };
  const updatePrefs = (change) => patchProfile({ prefs: { ...prefs, ...change } });

  // Holiday mode: pauses the play streak and weekly goal instead of deleting the account
  const holidays = user?.holidays || [];
  const activeHoliday = holidays.find((h) => h.from <= Date.now() && (h.to === null || h.to > Date.now())) || null;

  function startHoliday(days) {
    const now = Date.now();
    return patchProfile({ holidays: [...holidays, { from: now, to: days ? now + days * DAY : null }] });
  }

  function endHoliday() {
    const now = Date.now();
    return patchProfile({ holidays: holidays.map((h) => (h === activeHoliday ? { ...h, to: now } : h)) });
  }

  // ---------- Games ----------
  async function saveGame(game) {
    setGames((g) => [game, ...g]);
    try {
      await backend.addGame(user.uid, game);
    } catch (e) {
      console.warn('Saving game failed', e);
    }
  }

  // ---------- Questions ----------
  const questions = useMemo(() => [...builtInQuestions, ...community], [community]);
  const questionMap = useMemo(() => Object.fromEntries(questions.map((q) => [q.id, q])), [questions]);

  async function refreshCommunity() {
    try {
      setCommunity((await backend.listApprovedQuestions()).map(fixQuestion));
    } catch (e) {
      console.warn(e);
    }
  }

  async function submitQuestion(q) {
    try {
      await backend.submitQuestion({ ...q, status: 'pending', submittedBy: user.uid, submittedByName: user.fullName, createdAt: Date.now() });
      return null;
    } catch (err) {
      return errorText(err);
    }
  }

  const listMySubmissions = () => backend.listMySubmissions(user.uid);
  const listPending = () => backend.listPending();

  async function moderate(id, approve, note) {
    await backend.moderate(id, { status: approve ? 'approved' : 'rejected', reviewedBy: user.uid, reviewedAt: Date.now(), reviewNote: note || null });
    if (approve) await refreshCommunity();
  }

  async function importQuestions(list) {
    const existing = new Set(questions.map((q) => q.id));
    const fresh = list.filter((q) => !existing.has(q.id)).map((q) => ({ ...q, status: 'approved', submittedBy: user.uid, submittedByName: user.fullName, createdAt: Date.now() }));
    await backend.importApproved(fresh);
    await refreshCommunity();
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

  // ---------- Live duels ----------
  async function createDuel({ category, count, timeLimit }) {
    const pool = questions.filter((q) => category === 'mixed' || q.category === category);
    const picked = shuffle(pool).slice(0, count).map(({ id, category: c, difficulty, question, answers, correct, fact }) => ({ id, category: c, difficulty, question, answers, correct, fact }));
    try {
      const code = await backend.createDuel({ hostUid: user.uid, hostName: user.fullName, category, timeLimit, questions: picked });
      return { code };
    } catch (err) {
      return { error: errorText(err) };
    }
  }

  async function joinDuel(code) {
    const c = code.trim().toUpperCase();
    try {
      await backend.joinDuel(c, user.uid, user.fullName);
      return { code: c };
    } catch (err) {
      return { error: errorText(err) };
    }
  }

  const value = {
    loading, user, games, prefs, route, navigate, lang, setLang, tx: t, errorText,
    questions, questionMap, community, toReview, totalPoints, holidays, activeHoliday,
    signUp, logIn, guestLogIn, logOut, changePassword, deleteAccount,
    saveGame, updatePrefs, startHoliday, endHoliday,
    submitQuestion, listMySubmissions, listPending, moderate, importQuestions, refreshCommunity,
    createDuel, joinDuel, isAdmin: user?.role === 'admin', isConfigured: backend.isConfigured,
  };

  const theme = THEMES[prefs.theme] || THEMES.day;

  return (
    <AppContext.Provider value={value}>
      <ThemeContext.Provider value={user ? theme : THEMES.day}>{children}</ThemeContext.Provider>
    </AppContext.Provider>
  );
}
