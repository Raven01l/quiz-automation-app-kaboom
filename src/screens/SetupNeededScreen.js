import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { Card, Logo } from '../components/ui';
import { font, makeStyles, space, useTheme } from '../theme';

// Shown when src/firebaseConfig.js still has the placeholder values
export default function SetupNeededScreen() {
  const { tx } = useApp();
  const t = useTheme();
  const s = useStyles();
  return (
    <SafeAreaView style={s.root}>
      <View style={{ alignItems: 'center', marginBottom: space.xl }}>
        <Logo />
      </View>
      <Card style={s.card}>
        <Ionicons name="construct" size={36} color={t.accentStrong} />
        <Text style={s.title}>{tx('fb.setupTitle')}</Text>
        <Text style={s.msg}>{tx('fb.setupMsg')}</Text>
      </Card>
    </SafeAreaView>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.bg, justifyContent: 'center', padding: space.lg },
  card: { maxWidth: 440, width: '100%', alignSelf: 'center', alignItems: 'center', padding: space.xl },
  title: { fontSize: font.large, fontWeight: '900', color: t.text, marginTop: space.md, textAlign: 'center' },
  msg: { color: t.muted, marginTop: space.sm, textAlign: 'center', lineHeight: 21 },
}));
