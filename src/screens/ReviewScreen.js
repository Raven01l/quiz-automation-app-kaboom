import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useApp } from '../AppContext';
import Shell from '../components/Shell';
import { Button, Card, Chip, EmptyState, Pagination, Title } from '../components/ui';
import { DEFAULT_TIME_LIMIT, categoryInfo } from '../config';
import { font, makeStyles, space, useTheme } from '../theme';
import { formatDate, shuffle } from '../utils';
import { localize } from '../i18n';

const PAGE = 10;

export default function ReviewScreen() {
  const { toReview, navigate, tx, lang } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState({});

  const cats = useMemo(() => [...new Set(toReview.map((r) => r.question.category))], [toReview]);
  const list = toReview.filter((r) => category === 'all' || r.question.category === category);
  const shown = list.slice((page - 1) * PAGE, page * PAGE);

  function play() {
    const ids = shuffle(list).slice(0, 10).map((r) => r.question.id);
    navigate('Game', { questionIds: ids, category: 'review', timeLimit: DEFAULT_TIME_LIMIT, source: 'review' });
  }

  return (
    <Shell>
      <Title subtitle={tx('review.sub')}>{tx('review.title')}</Title>
      {toReview.length === 0 ? (
        <EmptyState icon="checkmark-done-circle" title={tx('review.empty')} message={tx('review.emptyMsg')}>
          <Button title={tx('menu.Setup')} icon="play" onPress={() => navigate('Setup')} />
        </EmptyState>
      ) : (
        <>
          <Card style={s.top}>
            <View style={{ flex: 1, minWidth: 200 }}>
              <Text style={s.count}>{tx('review.count', { n: list.length })}</Text>
              <Text style={s.muted}>{tx('review.note')}</Text>
            </View>
            <Button title={tx('review.start')} icon="repeat" variant="gold" onPress={play} />
          </Card>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: space.md }}>
            <Chip label={tx('scores.all')} selected={category === 'all'} onPress={() => { setCategory('all'); setPage(1); }} />
            {cats.map((c) => {
              const info = categoryInfo(c);
              return <Chip key={c} label={tx(`cat.${info.id}`)} color={info.color} selected={category === c} onPress={() => { setCategory(c); setPage(1); }} />;
            })}
          </View>
          {shown.map(({ question: q, status, date }) => {
            const info = categoryInfo(q.category);
            const lq = localize(q, lang);
            return (
              <Card key={q.id} style={{ marginBottom: space.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[s.tag, { color: info.color }]}>{tx(`cat.${info.id}`)}</Text>
                  <Text style={[s.tag, { color: t.wrong }]}>{status === 'timeout' ? tx('review.timeout') : tx('review.missed')}</Text>
                </View>
                <Text style={s.question}>{lq.question}</Text>
                <Text style={s.muted}>{tx('review.last', { d: formatDate(date, lang) })}</Text>
                {open[q.id] ? (
                  <View style={s.answer}>
                    <Text style={s.answerText}>{tx('review.answer', { a: lq.answers[q.correct] })}</Text>
                    <Text style={s.muted}>{lq.fact}</Text>
                  </View>
                ) : null}
                <Button
                  title={open[q.id] ? tx('review.hide') : tx('review.show')}
                  variant="soft"
                  small
                  onPress={() => setOpen((o) => ({ ...o, [q.id]: !o[q.id] }))}
                  style={{ alignSelf: 'flex-start', marginTop: space.sm }}
                />
              </Card>
            );
          })}
          <Pagination page={page} total={list.length} pageSize={PAGE} onChange={setPage} />
        </>
      )}
    </Shell>
  );
}

const useStyles = makeStyles((t) => ({
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.md },
  count: { fontSize: font.large, fontWeight: '900', color: t.text },
  muted: { color: t.muted, fontSize: font.small, marginTop: 4, lineHeight: 18 },
  tag: { fontWeight: '800', fontSize: font.small },
  question: { color: t.text, fontWeight: '700', marginTop: 6, lineHeight: 21 },
  answer: { marginTop: space.sm, padding: space.md, backgroundColor: t.correctSoft, borderRadius: 12 },
  answerText: { color: t.correct, fontWeight: '800' },
}));
