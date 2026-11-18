import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import Shell from '../components/Shell';
import { Button, Card, Chip, SectionTitle, Title } from '../components/ui';
import { CATEGORIES, MIXED } from '../config';
import { font, makeStyles, space, useTheme } from '../theme';

const COUNTS = [5, 10];
const TIMES = [10, 20];

// Duel lobby: create a room (pick settings, get a code) or join one with a code
export default function DuelScreen() {
  const { route, tx, createDuel, joinDuel, navigate } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [mode, setMode] = useState(route.params.mode === 'join' ? 'join' : 'create');
  const [category, setCategory] = useState('mixed');
  const [count, setCount] = useState(5);
  const [timeLimit, setTimeLimit] = useState(10);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function create() {
    setError('');
    setBusy(true);
    const res = await createDuel({ category, count, timeLimit });
    setBusy(false);
    if (res.error) setError(res.error);
    else navigate('DuelRoom', { code: res.code });
  }

  async function join() {
    setError('');
    setBusy(true);
    const res = await joinDuel(code);
    setBusy(false);
    if (res.error) setError(res.error);
    else navigate('DuelRoom', { code: res.code });
  }

  return (
    <Shell>
      <Title subtitle={tx('duel.sub')}>{tx('duel.title')}</Title>

      <View style={s.tabs}>
        {[
          ['create', tx('duel.create'), 'add-circle'],
          ['join', tx('duel.join'), 'enter'],
        ].map(([k, label, icon]) => (
          <Chip key={k} label={label} icon={icon} selected={mode === k} onPress={() => { setMode(k); setError(''); }} />
        ))}
      </View>

      {mode === 'create' ? (
        <>
          <SectionTitle>{tx('setup.category')}</SectionTitle>
          <View style={s.row}>
            {[MIXED, ...Object.values(CATEGORIES)].map((c) => (
              <Chip key={c.id} label={tx(`cat.${c.id}`)} color={c.color} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </View>
          <SectionTitle>{tx('setup.questions')}</SectionTitle>
          <View style={s.row}>
            {COUNTS.map((n) => (
              <Chip key={n} label={tx('questionsN', { n })} selected={count === n} onPress={() => setCount(n)} />
            ))}
          </View>
          <SectionTitle>{tx('setup.time')}</SectionTitle>
          <View style={s.row}>
            {TIMES.map((sec) => (
              <Chip key={sec} label={tx('secondsN', { n: sec })} icon="timer-outline" selected={timeLimit === sec} onPress={() => setTimeLimit(sec)} />
            ))}
          </View>
          {error ? <ErrorLine text={error} /> : null}
          <Button title={tx('duel.createBtn')} icon="people" variant="gold" big onPress={create} disabled={busy} style={{ marginTop: space.xl }} />
        </>
      ) : (
        <Card style={{ marginTop: space.md }}>
          <TextInput
            style={s.code}
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder={tx('duel.codePh')}
            placeholderTextColor={t.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />
          {error ? <ErrorLine text={error} /> : null}
          <Button title={tx('duel.joinBtn')} icon="enter" big onPress={join} disabled={busy || code.length !== 6} />
        </Card>
      )}
    </Shell>
  );
}

function ErrorLine({ text }) {
  const t = useTheme();
  const s = useStyles();
  return (
    <View style={s.error}>
      <Ionicons name="alert-circle" size={18} color={t.wrong} />
      <Text style={s.errorText}>{text}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  tabs: { flexDirection: 'row', flexWrap: 'wrap' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  code: {
    borderWidth: 2,
    borderColor: t.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: space.lg,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 8,
    textAlign: 'center',
    color: t.text,
    backgroundColor: t.bg,
    marginBottom: space.md,
  },
  error: { flexDirection: 'row', gap: 6, backgroundColor: t.wrongSoft, padding: space.md, borderRadius: 12, marginTop: space.md, marginBottom: space.md },
  errorText: { flex: 1, color: t.wrong, fontSize: font.small, fontWeight: '600' },
}));
