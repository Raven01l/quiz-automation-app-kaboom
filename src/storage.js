import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = {
  users: 'kaboom:users',
  session: 'kaboom:session',
  customQuestions: 'kaboom:customQuestions',
  attempts: 'kaboom:loginAttempts',
  lang: 'kaboom:lang',
  games: (email) => `kaboom:games:${email}`,
  prefs: (email) => `kaboom:prefs:${email}`,
};

async function read(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const write = (key, value) => AsyncStorage.setItem(key, JSON.stringify(value));

export const storage = {
  users: () => read(KEY.users, {}),
  saveUsers: (v) => write(KEY.users, v),

  session: () => read(KEY.session, null),
  saveSession: (email) => write(KEY.session, email),
  clearSession: () => AsyncStorage.removeItem(KEY.session),

  games: (email) => read(KEY.games(email), []),
  saveGames: (email, v) => write(KEY.games(email), v),

  prefs: (email) => read(KEY.prefs(email), { hideName: true, theme: 'day' }),
  savePrefs: (email, v) => write(KEY.prefs(email), v),

  customQuestions: () => read(KEY.customQuestions, []),
  saveCustomQuestions: (v) => write(KEY.customQuestions, v),

  lang: () => read(KEY.lang, 'tr'),
  saveLang: (v) => write(KEY.lang, v),

  attempts: () => read(KEY.attempts, {}),
  saveAttempts: (v) => write(KEY.attempts, v),

  async deleteUserData(email) {
    await AsyncStorage.multiRemove([KEY.games(email), KEY.prefs(email)]);
  },
};
