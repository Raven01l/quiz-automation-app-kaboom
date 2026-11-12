import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/AppContext';
import { useTheme } from './src/theme';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import SetupScreen from './src/screens/SetupScreen';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';
import ScoresScreen from './src/screens/ScoresScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import BadgesScreen from './src/screens/BadgesScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const SCREENS = {
  Home: HomeScreen,
  Setup: SetupScreen,
  Game: GameScreen,
  Result: ResultScreen,
  Scores: ScoresScreen,
  Review: ReviewScreen,
  Library: LibraryScreen,
  Badges: BadgesScreen,
  Profile: ProfileScreen,
};

function ThemedStatusBar() {
  const t = useTheme();
  return <StatusBar style={t.dark ? 'light' : 'dark'} />;
}

function Router() {
  const { loading, user, route } = useApp();
  const t = useTheme();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.accent} size="large" />
      </View>
    );
  }
  if (!user) return <AuthScreen />;
  const Screen = SCREENS[route.screen] || HomeScreen;
  // key: every navigation starts the screen with fresh state
  return <Screen key={route.n} />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ThemedStatusBar />
        <Router />
      </AppProvider>
    </SafeAreaProvider>
  );
}
