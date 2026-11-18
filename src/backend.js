// All server communication goes through this file (Firebase Auth + Cloud Firestore).
// Screens never call Firebase directly, so the backend can be swapped or mocked in one place.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  onSnapshot,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

export const isConfigured = Boolean(firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('PASTE'));

let app = null;
let auth = null;
let db = null;

if (isConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  try {
    // Keep users signed in between app launches on phones
    auth =
      Platform.OS !== 'web' && getReactNativePersistence
        ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
        : getAuth(app);
  } catch {
    auth = getAuth(app);
  }
  db = getFirestore(app);
}

// Errors carry a short code that AppContext turns into a translated message
function fail(code) {
  const e = new Error(code);
  e.code = code;
  throw e;
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O or 1/I to avoid mix-ups

function randomCode(length = 6) {
  let s = '';
  for (let i = 0; i < length; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

export const backend = {
  isConfigured,

  // ---------- Accounts ----------
  onAuth(callback) {
    return onAuthStateChanged(auth, (u) => callback(u ? { uid: u.uid, email: u.email, isAnonymous: u.isAnonymous } : null));
  },

  async signUp({ email, password }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user.uid;
  },

  async logIn({ email, password }) {
    await signInWithEmailAndPassword(auth, email, password);
  },

  async guest() {
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  },

  logOut: () => signOut(auth),

  async reauth(password) {
    const u = auth.currentUser;
    if (!u || u.isAnonymous) return;
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password));
  },

  async changePassword(current, next) {
    await backend.reauth(current);
    await updatePassword(auth.currentUser, next);
  },

  // Deletes games, profile and the login itself. Email users must confirm their password first.
  async deleteAccount(uid, password) {
    await backend.reauth(password);
    const games = await getDocs(collection(db, 'users', uid, 'games'));
    const docs = games.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = writeBatch(db);
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    await deleteDoc(doc(db, 'users', uid));
    await deleteUser(auth.currentUser);
  },

  // ---------- Profile ----------
  async getProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? snap.data() : null;
  },
  createProfile: (uid, data) => setDoc(doc(db, 'users', uid), data),
  updateProfile: (uid, patch) => updateDoc(doc(db, 'users', uid), patch),

  // ---------- Games ----------
  async listGames(uid) {
    const snap = await getDocs(query(collection(db, 'users', uid, 'games'), orderBy('date', 'desc'), limit(500)));
    return snap.docs.map((d) => d.data());
  },
  addGame: (uid, game) => setDoc(doc(db, 'users', uid, 'games', game.id), game),

  // ---------- Questions ----------
  async listApprovedQuestions() {
    const snap = await getDocs(query(collection(db, 'questions'), where('status', '==', 'approved')));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  },
  async listMySubmissions(uid) {
    const snap = await getDocs(query(collection(db, 'questions'), where('submittedBy', '==', uid)));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => b.createdAt - a.createdAt);
  },
  async listPending() {
    const snap = await getDocs(query(collection(db, 'questions'), where('status', '==', 'pending')));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id })).sort((a, b) => a.createdAt - b.createdAt);
  },
  async submitQuestion(q) {
    const ref = doc(collection(db, 'questions'));
    await setDoc(ref, { ...q, id: ref.id });
    return ref.id;
  },
  moderate: (id, patch) => updateDoc(doc(db, 'questions', id), patch),
  async importApproved(list) {
    for (let i = 0; i < list.length; i += 400) {
      const batch = writeBatch(db);
      list.slice(i, i + 400).forEach((q) => batch.set(doc(db, 'questions', q.id), q));
      await batch.commit();
    }
  },

  // ---------- Feedback (anonymous: no user id is stored) ----------
  sendFeedback: (data) => addDoc(collection(db, 'feedback'), data),

  // ---------- Live duels ----------
  async createDuel(data) {
    for (let tries = 0; tries < 5; tries++) {
      const code = randomCode();
      const ref = doc(db, 'duels', code);
      const exists = (await getDoc(ref)).exists();
      if (!exists) {
        await setDoc(ref, { ...data, code, guestUid: null, guestName: null, status: 'waiting', current: 0, answers: {}, createdAt: Date.now() });
        return code;
      }
    }
    fail('duel/try-again');
  },

  async joinDuel(code, uid, name) {
    const ref = doc(db, 'duels', code);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) fail('duel/not-found');
      const d = snap.data();
      if (d.hostUid === uid) fail('duel/own-room');
      if (d.guestUid && d.guestUid !== uid) fail('duel/full');
      if (d.status !== 'waiting' && d.guestUid !== uid) fail('duel/started');
      tx.update(ref, { guestUid: uid, guestName: name, status: 'ready' });
    });
  },

  watchDuel(code, callback, onError) {
    return onSnapshot(
      doc(db, 'duels', code),
      (snap) => callback(snap.exists() ? snap.data() : null),
      (err) => onError?.(err)
    );
  },

  startDuel: (code) => updateDoc(doc(db, 'duels', code), { status: 'playing', current: 0, startedAt: Date.now() }),

  submitDuelAnswer: (code, uid, index, answer) => updateDoc(doc(db, 'duels', code), { [`answers.${uid}.${index}`]: answer }),

  // Moves both players to the next question. Safe to call from both phones:
  // the transaction only advances once. With force, missing answers count as timeouts.
  async advanceDuel(code, index, force = false) {
    const ref = doc(db, 'duels', code);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const d = snap.data();
      if (d.status !== 'playing' || d.current !== index) return;
      const players = [d.hostUid, d.guestUid];
      const missing = players.filter((p) => !d.answers?.[p]?.[index]);
      if (missing.length && !force) return;
      const patch = {};
      missing.forEach((p) => {
        patch[`answers.${p}.${index}`] = { chosen: null, timeMs: d.timeLimit * 1000, points: 0 };
      });
      patch.current = index + 1;
      if (index + 1 >= d.questions.length) {
        patch.status = 'finished';
        patch.finishedAt = Date.now();
      }
      tx.update(ref, patch);
    });
  },

  leaveDuel: (code, uid) => updateDoc(doc(db, 'duels', code), { status: 'abandoned', leftBy: uid }),
};
