import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import Shell from '../components/Shell';
import { Button, Card, Chip, Pagination, SectionTitle } from '../components/ui';
import { categoryInfo } from '../config';
import { ANSWER_TILES, font, makeStyles, space, useTheme } from '../theme';
import { formatDate, formatDecimal, formatNumber, rankTitle } from '../utils';
import { localize } from '../i18n';

const PAGE = 10;

export default function ResultScreen() {
  const { route, games, questionMap, navigate, tx, lang } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const game = games.find((g) => g.id === route.params.gameId);

  if (!game) {
    return (
      <Shell>
        <Text style={s.muted}>{tx('res.notFound')}</Text>
      </Shell>
    );
  }

  const cat = categoryInfo(game.category);
  const total = game.answers.length;
  const accuracy = total ? game.correctCount / total : 0;
  const rank = rankTitle(accuracy);
  const sameCategory = games.filter((g) => g.category === game.category);
  const previousBest = Math.max(0, ...sameCategory.filter((g) => g.id !== game.id && g.date < game.date).map((g) => g.score));
  const newBest = route.params.fresh && game.score > previousBest && sameCategory.length > 1;
  const top = [...sameCategory].sort((a, b) => b.score - a.score).slice(0, 5);
  const correctAnswers = game.answers.filter((a) => a.chosen === a.correct);
  const avgTime = correctAnswers.length ? correctAnswers.reduce((n, a) => n + a.timeMs, 0) / correctAnswers.length / 1000 : 0;
  const catName = tx(`cat.${cat.id}`);
  const pct = Math.round(accuracy * 100);
  const missed = game.answers.filter((a) => a.chosen !== a.correct).map((a) => a.id);

  const list = game.answers
    .map((a, i) => ({ ...a, no: i + 1, status: a.chosen === null ? 'timeout' : a.chosen === a.correct ? 'correct' : 'wrong' }))
    .filter((a) => filter === 'all' || (filter === 'missed' ? a.status !== 'correct' : a.status === 'correct'));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);

  return (
    <Shell>
      <View style={s.hero}>
        <View style={s.rankIcon}>
          <Ionicons name={rank.icon} size={40} color="#1A1033" />
        </View>
        <Text style={s.rank}>{tx(rank.key)}</Text>
        {newBest ? (
          <View style={s.newBest}>
            <Ionicons name="sparkles" size={16} color="#1A1033" />
            <Text style={s.newBestText}>{tx('res.newBest')}</Text>
          </View>
        ) : null}
        <Text style={s.score}>{formatNumber(game.score, lang)}</Text>
        <Text style={s.scoreLabel}>{tx('res.points')}</Text>
        <Text style={s.heroMeta}>
          {catName} · {formatDate(game.date, lang, true)}
        </Text>
      </View>

      <View style={s.stats}>
        <Stat value={`${game.correctCount}/${total}`} label={tx('res.correct')} color={t.correct} icon="checkmark-circle" />
        <Stat value={lang === 'en' ? `${pct}%` : `%${pct}`} label={tx('res.accuracy')} color="#0EA5E9" icon="analytics" />
        <Stat value={game.bestStreak} label={tx('res.bestStreak')} color="#F97316" icon="flame" />
        <Stat value={avgTime ? `${formatDecimal(avgTime, lang)}${lang === 'en' ? 's' : ' sn'}` : '–'} label={tx('res.avgTime')} color={t.goldText} icon="speedometer" />
      </View>

      <View style={s.actions}>
        <Button title={tx('res.again')} icon="refresh" variant="gold" onPress={() => navigate('Setup', { category: game.category !== 'review' ? game.category : undefined })} style={{ flexGrow: 1 }} />
        {missed.length ? (
          <Button
            title={tx('res.retry', { n: missed.length })}
            icon="repeat"
            onPress={() => navigate('Game', { questionIds: missed, category: 'review', timeLimit: game.timeLimit, source: 'review' })}
            style={{ flexGrow: 1 }}
          />
        ) : null}
        <Button title={tx('res.home')} icon="home" variant="secondary" onPress={() => navigate('Home')} style={{ flexGrow: 1 }} />
      </View>

      <SectionTitle>{tx('res.top', { cat: catName })}</SectionTitle>
      <Card style={{ padding: space.sm }}>
        {top.map((g, i) => {
          const me = g.id === game.id;
          return (
            <View key={g.id} style={[s.board, me && { backgroundColor: t.accentSoft }]}>
              <View style={[s.place, i === 0 && { backgroundColor: t.gold }, i === 1 && { backgroundColor: '#CBD5E1' }, i === 2 && { backgroundColor: '#D97706' }]}>
                <Text style={[s.placeText, i < 3 && { color: '#1A1033' }]}>{i + 1}</Text>
              </View>
              <Text style={[s.boardDate, me && { color: t.text, fontWeight: '800' }]}>{me ? tx('res.thisGame') : formatDate(g.date, lang)}</Text>
              <Text style={s.boardScore}>{formatNumber(g.score, lang)}</Text>
            </View>
          );
        })}
      </Card>

      <SectionTitle>{tx('res.review')}</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {[
          ['all', tx('res.all', { n: total })],
          ['missed', tx('res.missed', { n: total - game.correctCount })],
          ['correct', tx('res.correctF', { n: game.correctCount })],
        ].map(([k, label]) => (
          <Chip key={k} label={label} selected={filter === k} onPress={() => { setFilter(k); setPage(1); }} />
        ))}
      </View>
      {shown.map((a) => {
        const q = questionMap[a.id];
        if (!q) return null;
        const color = a.status === 'correct' ? t.correct : t.wrong;
        const lq = localize(q, lang);
        return (
          <Card key={a.id} style={[s.reviewCard, { borderLeftColor: color }]}>
            <View style={s.reviewTop}>
              <Text style={s.muted}>{tx('res.qNo', { n: a.no })}</Text>
              <Text style={[s.reviewStatus, { color }]}>
                {a.status === 'correct' ? `+${formatNumber(a.points, lang)}` : a.status === 'timeout' ? tx('res.timeout') : tx('res.wrong')}
              </Text>
            </View>
            <Text style={s.reviewQ}>{lq.question}</Text>
            <AnswerLine index={q.correct} text={lq.answers[q.correct]} label={tx('res.answer')} />
            {a.status === 'wrong' ? <AnswerLine index={a.chosen} text={lq.answers[a.chosen]} label={tx('res.picked')} /> : null}
            <Text style={s.fact}>{lq.fact}</Text>
          </Card>
        );
      })}
      <Pagination page={page} total={list.length} pageSize={PAGE} onChange={setPage} />
    </Shell>
  );
}

function AnswerLine({ index, text, label }) {
  const s = useStyles();
  const tile = ANSWER_TILES[index];
  return (
    <View style={s.answerLine}>
      <View style={[s.answerDot, { backgroundColor: tile.color }]}>
        <Ionicons name={tile.icon} size={12} color="#fff" />
      </View>
      <Text style={s.answerText}>
        <Text style={s.answerLabel}>{label}: </Text>
        {text}
      </Text>
    </View>
  );
}

function Stat({ value, label, color, icon }) {
  const s = useStyles();
  return (
    <Card style={s.stat}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.muted}>{label}</Text>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  hero: { alignItems: 'center', backgroundColor: t.accent, borderRadius: 24, padding: space.xl, borderBottomWidth: 6, borderBottomColor: 'rgba(0,0,0,0.25)' },
  rankIcon: { width: 76, height: 76, borderRadius: 24, backgroundColor: t.gold, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  rank: { color: '#fff', fontWeight: '900', fontSize: font.title, marginTop: space.md },
  newBest: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.gold, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginTop: space.sm },
  newBestText: { fontWeight: '900', color: '#1A1033' },
  score: { color: '#fff', fontWeight: '900', fontSize: 56, marginTop: space.md },
  scoreLabel: { color: 'rgba(255,255,255,0.8)', fontWeight: '900', letterSpacing: 3, fontSize: font.small },
  heroMeta: { color: 'rgba(255,255,255,0.85)', marginTop: space.md },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.lg },
  stat: { flex: 1, minWidth: 140, alignItems: 'center', padding: space.md },
  statValue: { color: t.text, fontWeight: '900', fontSize: font.large + 2, marginTop: 6 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg },
  board: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.sm, borderRadius: 12 },
  place: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' },
  placeText: { fontWeight: '900', color: t.text },
  boardDate: { flex: 1, color: t.muted },
  boardScore: { fontWeight: '900', color: t.goldText, fontSize: font.medium },
  reviewCard: { marginBottom: space.sm, borderLeftWidth: 5 },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewStatus: { fontWeight: '900' },
  reviewQ: { color: t.text, fontWeight: '700', lineHeight: 21, marginBottom: space.sm },
  answerLine: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 4 },
  answerDot: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  answerText: { flex: 1, color: t.text },
  answerLabel: { color: t.muted, fontWeight: '700' },
  fact: { color: t.muted, marginTop: space.sm, fontSize: font.small + 1, lineHeight: 19, fontStyle: 'italic' },
  muted: { color: t.muted, fontSize: font.small },
}));
