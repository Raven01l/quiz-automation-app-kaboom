import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import Shell from '../components/Shell';
import { Button, Card, Chip, EmptyState, Pagination, Title } from '../components/ui';
import { CATEGORIES, MIXED, categoryInfo } from '../config';
import { font, makeStyles, space, useTheme } from '../theme';
import { formatDate, formatNumber } from '../utils';

const PAGE = 10;

export default function ScoresScreen() {
  const { games, navigate, tx, lang } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('top'); // top | recent
  const [page, setPage] = useState(1);

  const list = games
    .filter((g) => category === 'all' || g.category === category)
    .sort((a, b) => (sort === 'top' ? b.score - a.score : b.date - a.date));
  const shown = list.slice((page - 1) * PAGE, page * PAGE);

  function pick(fn) {
    return (v) => {
      fn(v);
      setPage(1);
    };
  }

  return (
    <Shell>
      <Title subtitle={tx('scores.sub')}>{tx('scores.title')}</Title>
      {games.length === 0 ? (
        <EmptyState icon="podium" title={tx('scores.empty')} message={tx('scores.emptyMsg')}>
          <Button title={tx('menu.Setup')} icon="play" onPress={() => navigate('Setup')} />
        </EmptyState>
      ) : (
        <>
          <View style={s.row}>
            <Chip label={tx('scores.top')} icon="trophy" selected={sort === 'top'} onPress={() => pick(setSort)('top')} />
            <Chip label={tx('scores.recent')} icon="time" selected={sort === 'recent'} onPress={() => pick(setSort)('recent')} />
          </View>
          <View style={s.row}>
            <Chip label={tx('scores.all')} selected={category === 'all'} onPress={() => pick(setCategory)('all')} />
            {[MIXED, ...Object.values(CATEGORIES)].map((c) => (
              <Chip key={c.id} label={tx(`cat.${c.id}`)} color={c.color} selected={category === c.id} onPress={() => pick(setCategory)(c.id)} />
            ))}
          </View>
          {shown.map((g, i) => {
            const c = categoryInfo(g.category);
            const place = (page - 1) * PAGE + i + 1;
            return (
              <Pressable key={g.id} onPress={() => navigate('Result', { gameId: g.id })}>
                <Card style={s.item}>
                  {sort === 'top' ? (
                    <View style={[s.place, place === 1 && { backgroundColor: t.gold }, place === 2 && { backgroundColor: '#CBD5E1' }, place === 3 && { backgroundColor: '#D97706' }]}>
                      <Text style={[s.placeText, place <= 3 && { color: '#1A1033' }]}>{place}</Text>
                    </View>
                  ) : null}
                  <View style={[s.icon, { backgroundColor: c.color + '33' }]}>
                    <Ionicons name={c.icon} size={20} color={c.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{tx(`cat.${c.id}`)}</Text>
                    <Text style={s.muted}>{formatDate(g.date, lang, true)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.score}>{formatNumber(g.score, lang)}</Text>
                    <Text style={s.muted}>{tx('correctOf', { c: g.correctCount, n: g.answers.length })}</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
          {list.length === 0 ? <Text style={s.muted}>{tx('scores.noneCat')}</Text> : null}
          <Pagination page={page} total={list.length} pageSize={PAGE} onChange={setPage} />
        </>
      )}
    </Shell>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: space.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, marginBottom: space.sm },
  place: { width: 32, height: 32, borderRadius: 16, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' },
  placeText: { fontWeight: '900', color: t.text },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '800', color: t.text },
  muted: { color: t.muted, fontSize: font.small, marginTop: 2 },
  score: { fontWeight: '900', color: t.goldText, fontSize: font.medium + 1 },
}));
