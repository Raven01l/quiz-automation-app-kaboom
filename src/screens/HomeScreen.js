import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import Shell from '../components/Shell';
import { Button, Card, ProgressBar, SectionTitle, StatTile } from '../components/ui';
import { CATEGORIES, DEFAULT_TIME_LIMIT, WEEKLY_GOAL, categoryInfo } from '../config';
import { font, makeStyles, space, useTheme } from '../theme';
import { dayStreak, firstName, formatDate, formatNumber, levelInfo, maskName, shuffle, weekStart } from '../utils';
import { badgeStatus } from '../badges';

export default function HomeScreen() {
  const { user, games, prefs, updatePrefs, navigate, questions, toReview, totalPoints, tx, lang } = useApp();
  const t = useTheme();
  const s = useStyles();

  const stats = useMemo(() => {
    const ws = weekStart();
    const thisWeek = games.filter((g) => g.date >= ws).reduce((n, g) => n + g.answers.length, 0);
    const answered = games.reduce((n, g) => n + g.answers.length, 0);
    const correct = games.reduce((n, g) => n + g.correctCount, 0);
    return {
      thisWeek,
      streak: dayStreak(games),
      accuracy: answered ? Math.round((correct / answered) * 100) : 0,
      best: Math.max(0, ...games.map((g) => g.score)),
      badges: badgeStatus(games).filter((b) => b.earned).length,
    };
  }, [games]);

  const lvl = levelInfo(totalPoints);
  const name = prefs.hideName ? maskName(user.fullName) : firstName(user.fullName);

  function quickPlay() {
    const ids = shuffle(questions).slice(0, 10).map((q) => q.id);
    navigate('Game', { questionIds: ids, category: 'mixed', timeLimit: DEFAULT_TIME_LIMIT, source: 'quick' });
  }

  return (
    <Shell>
      <View style={s.hello}>
        <Text style={s.helloText}>{tx('home.hello', { name })}</Text>
        <Pressable onPress={() => updatePrefs({ hideName: !prefs.hideName })} style={{ padding: 6 }} accessibilityLabel={prefs.hideName ? tx('home.showName') : tx('home.hideName')}>
          <Ionicons name={prefs.hideName ? 'eye-outline' : 'eye-off-outline'} size={20} color={t.muted} />
        </Pressable>
      </View>
      <Text style={s.date}>{formatDate(Date.now(), lang)}</Text>

      <View style={s.hero}>
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={s.heroTitle}>{tx('home.quickTitle')}</Text>
          <Text style={s.heroSub}>{tx('home.quickSub')}</Text>
        </View>
        <Button title={tx('home.playNow')} icon="play" variant="gold" big onPress={quickPlay} style={{ minWidth: 170 }} />
      </View>

      <Card style={{ marginTop: space.lg }}>
        <View style={s.levelRow}>
          <View style={s.levelBadge}>
            <Text style={s.levelNumber}>{lvl.level}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: space.md }}>
            <Text style={s.levelTitle}>{tx('home.level', { n: lvl.level })}</Text>
            <Text style={s.muted}>{tx('home.toNext', { n: formatNumber(lvl.toNext, lang), next: lvl.level + 1 })}</Text>
          </View>
          <Text style={s.points}>{formatNumber(totalPoints, lang)} {tx('pts')}</Text>
        </View>
        <View style={{ marginTop: space.md }}>
          <ProgressBar value={lvl.progress} color={t.gold} />
        </View>
        <View style={[s.levelRow, { marginTop: space.lg }]}>
          <Text style={[s.levelTitle, { flex: 1, fontSize: font.body }]}>{tx('home.weekly')}</Text>
          <Text style={s.muted}>{tx('home.weeklyOf', { n: stats.thisWeek, goal: WEEKLY_GOAL })}</Text>
        </View>
        <View style={{ marginTop: space.sm }}>
          <ProgressBar value={stats.thisWeek / WEEKLY_GOAL} />
        </View>
      </Card>

      <View style={s.stats}>
        <StatTile icon="flame" value={tx('home.days', { n: stats.streak })} label={tx('home.streak')} color="#F97316" />
        <StatTile icon="checkmark-circle" value={lang === 'en' ? `${stats.accuracy}%` : `%${stats.accuracy}`} label={tx('home.accuracy')} color={t.correct} />
        <StatTile icon="trophy" value={formatNumber(stats.best, lang)} label={tx('home.best')} color={t.goldText} />
        <StatTile icon="ribbon" value={stats.badges} label={tx('home.badges')} color="#0EA5E9" />
      </View>

      <SectionTitle>{tx('home.pick')}</SectionTitle>
      <View style={s.grid}>
        {Object.values(CATEGORIES).map((c) => {
          const count = questions.filter((q) => q.category === c.id).length;
          return (
            <Pressable key={c.id} onPress={() => navigate('Setup', { category: c.id })} style={({ pressed }) => [s.cat, { backgroundColor: c.color }, pressed && { transform: [{ scale: 0.97 }] }]}>
              <View style={s.catIcon}>
                <Ionicons name={c.icon} size={26} color={c.color} />
              </View>
              <Text style={s.catName}>{tx(`cat.${c.id}`)}</Text>
              <Text style={s.catCount}>{tx('questionsN', { n: count })}</Text>
            </Pressable>
          );
        })}
      </View>

      {toReview.length > 0 ? (
        <Card style={s.review}>
          <Ionicons name="refresh-circle" size={30} color={t.accentStrong} />
          <View style={{ flex: 1, marginLeft: space.md }}>
            <Text style={s.levelTitle}>{tx('home.toReview', { n: toReview.length })}</Text>
            <Text style={s.muted}>{tx('home.toReviewSub')}</Text>
          </View>
          <Button title={tx('home.review')} variant="soft" small onPress={() => navigate('Review')} />
        </Card>
      ) : null}

      <SectionTitle right={games.length ? <Button title={tx('home.seeAll')} variant="secondary" small onPress={() => navigate('Scores')} /> : null}>{tx('home.recent')}</SectionTitle>
      {games.length === 0 ? (
        <Card>
          <Text style={s.muted}>{tx('home.noGames')}</Text>
        </Card>
      ) : (
        games.slice(0, 3).map((g) => {
          const c = categoryInfo(g.category);
          return (
            <Pressable key={g.id} onPress={() => navigate('Result', { gameId: g.id })}>
              <Card style={s.recent}>
                <View style={[s.recentIcon, { backgroundColor: c.color + '33' }]}>
                  <Ionicons name={c.icon} size={20} color={c.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.levelTitle}>{tx(`cat.${c.id}`)}</Text>
                  <Text style={s.muted}>{formatDate(g.date, lang, true)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.points}>{formatNumber(g.score, lang)}</Text>
                  <Text style={s.muted}>{tx('correctOf', { c: g.correctCount, n: g.answers.length })}</Text>
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
    </Shell>
  );
}

const useStyles = makeStyles((t) => ({
  hello: { flexDirection: 'row', alignItems: 'center' },
  helloText: { fontSize: font.title, fontWeight: '900', color: t.text },
  date: { color: t.muted, marginBottom: space.lg },
  hero: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.lg,
    padding: space.xl,
    borderRadius: 22,
    backgroundColor: t.accent,
    borderBottomWidth: 6,
    borderBottomColor: 'rgba(0,0,0,0.25)',
  },
  heroKicker: { color: 'rgba(255,255,255,0.8)', fontWeight: '900', fontSize: font.small, letterSpacing: 2 },
  heroTitle: { color: '#fff', fontWeight: '900', fontSize: 26 },
  heroSub: { color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 20 },
  levelRow: { flexDirection: 'row', alignItems: 'center' },
  levelBadge: { width: 46, height: 46, borderRadius: 14, backgroundColor: t.gold, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  levelNumber: { fontWeight: '900', fontSize: font.large, color: '#1A1033' },
  levelTitle: { fontWeight: '800', color: t.text, fontSize: font.medium },
  muted: { color: t.muted, fontSize: font.small, marginTop: 2 },
  points: { fontWeight: '900', color: t.goldText, fontSize: font.medium },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  cat: { flexGrow: 1, flexBasis: 150, borderRadius: 18, padding: space.lg, borderBottomWidth: 5, borderBottomColor: 'rgba(0,0,0,0.25)' },
  catIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: space.md },
  catName: { color: '#fff', fontWeight: '900', fontSize: font.medium },
  catCount: { color: 'rgba(255,255,255,0.85)', fontSize: font.small, marginTop: 2, fontWeight: '600' },
  review: { flexDirection: 'row', alignItems: 'center', marginTop: space.lg },
  recent: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.sm, padding: space.md },
  recentIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
}));
