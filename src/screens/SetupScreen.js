import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import Shell from '../components/Shell';
import { Button, Card, Chip, SectionTitle, Title } from '../components/ui';
import { CATEGORIES, DEFAULT_TIME_LIMIT, MIXED, QUESTION_COUNTS, TIME_LIMITS } from '../config';
import { font, makeStyles, space, useTheme } from '../theme';
import { shuffle } from '../utils';

const DIFFICULTIES = [0, 1, 2, 3];

export default function SetupScreen() {
  const { route, questions, games, navigate, tx } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [category, setCategory] = useState(route.params.category || 'mixed');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState(0);
  const [timeLimit, setTimeLimit] = useState(DEFAULT_TIME_LIMIT);

  const pool = useMemo(
    () => questions.filter((q) => (category === 'mixed' || q.category === category) && (difficulty === 0 || q.difficulty === difficulty)),
    [questions, category, difficulty]
  );
  const seen = useMemo(() => {
    const set = new Set();
    games.forEach((g) => g.answers.forEach((a) => set.add(a.id)));
    return set;
  }, [games]);
  const unseen = pool.filter((q) => !seen.has(q.id)).length;
  const actual = Math.min(count, pool.length);

  function start() {
    // Questions you haven't seen come first
    const ordered = [...shuffle(pool.filter((q) => !seen.has(q.id))), ...shuffle(pool.filter((q) => seen.has(q.id)))];
    const ids = shuffle(ordered.slice(0, actual)).map((q) => q.id);
    navigate('Game', { questionIds: ids, category, difficulty, timeLimit, source: 'normal' });
  }

  const options = [MIXED, ...Object.values(CATEGORIES)];

  return (
    <Shell>
      <Title subtitle={tx('setup.sub')}>{tx('setup.title')}</Title>

      <SectionTitle>{tx('setup.category')}</SectionTitle>
      <View style={s.grid}>
        {options.map((c) => {
          const on = c.id === category;
          return (
            <Pressable key={c.id} onPress={() => setCategory(c.id)} style={[s.cat, on && { borderColor: c.color, backgroundColor: c.color + '26' }]}>
              <View style={[s.catIcon, { backgroundColor: c.color }]}>
                <Ionicons name={c.icon} size={18} color="#fff" />
              </View>
              <Text style={[s.catName, on && { color: t.text }]} numberOfLines={1}>
                {tx(`cat.${c.id}`)}
              </Text>
              {on ? <Ionicons name="checkmark-circle" size={20} color={c.color} /> : null}
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>{tx('setup.questions')}</SectionTitle>
      <View style={s.row}>
        {QUESTION_COUNTS.map((n) => (
          <Chip key={n} label={tx('questionsN', { n })} selected={count === n} onPress={() => setCount(n)} />
        ))}
      </View>

      <SectionTitle>{tx('setup.difficulty')}</SectionTitle>
      <View style={s.row}>
        {DIFFICULTIES.map((d) => (
          <Chip key={d} label={tx(`diff.${d}`)} selected={difficulty === d} onPress={() => setDifficulty(d)} />
        ))}
      </View>

      <SectionTitle>{tx('setup.time')}</SectionTitle>
      <View style={s.row}>
        {TIME_LIMITS.map((sec) => (
          <Chip key={sec} label={tx('secondsN', { n: sec })} icon="timer-outline" selected={timeLimit === sec} onPress={() => setTimeLimit(sec)} />
        ))}
      </View>

      <Card style={s.summary}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={s.summaryTitle}>{tx('setup.summary', { n: actual, s: timeLimit })}</Text>
          <Text style={s.muted}>{tx('setup.pool', { n: pool.length, u: unseen })}</Text>
          {pool.length > 0 && pool.length < count ? <Text style={[s.muted, { color: t.goldText }]}>{tx('setup.notEnough', { count, n: pool.length })}</Text> : null}
          {pool.length === 0 ? <Text style={[s.muted, { color: t.wrong }]}>{tx('setup.none')}</Text> : null}
        </View>
        <Button title={tx('setup.start')} icon="play" variant="gold" big onPress={start} disabled={pool.length === 0} style={{ minWidth: 150 }} />
      </Card>
    </Shell>
  );
}

const useStyles = makeStyles((t) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cat: {
    flexGrow: 1,
    flexBasis: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: t.border,
    backgroundColor: t.surface,
  },
  catIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catName: { flex: 1, color: t.muted, fontWeight: '800', fontSize: font.body + 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.lg, marginTop: space.xl },
  summaryTitle: { fontSize: font.large, fontWeight: '900', color: t.text },
  muted: { color: t.muted, fontSize: font.small, marginTop: 4, lineHeight: 18 },
}));
