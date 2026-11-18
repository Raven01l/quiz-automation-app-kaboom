import AsyncStorage from '@react-native-async-storage/async-storage';

// Only device settings live here now; accounts, games and questions are in Firebase (see backend.js).
const KEY = {
  lang: 'kaboom:lang',
  attempts: 'kaboom:loginAttempts',
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
  lang: () => read(KEY.lang, 'tr'),
  saveLang: (v) => write(KEY.lang, v),
  attempts: () => read(KEY.attempts, {}),
  saveAttempts: (v) => write(KEY.attempts, v),
};
