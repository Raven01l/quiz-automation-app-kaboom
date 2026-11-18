import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import Shell from '../components/Shell';
import { Button, Card, EmptyState, Title } from '../components/ui';
import { categoryInfo } from '../config';
import { ANSWER_TILES, font, makeStyles, space, useTheme } from '../theme';
import { formatDate } from '../utils';
import { localize } from '../i18n';

// Admin only: approve or reject questions that players suggested
export default function ModerationScreen() {
  const { tx, lang, listPending, moderate } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [pending, setPending] = useState(null);
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState(null);

  const load = () =>
    listPending()
      .then(setPending)
      .catch(() => setPending([]));

  useEffect(() => {
    load();
  }, []);

  async function decide(q, approve) {
    setBusy(q.id);
    try {
      await moderate(q.id, approve, notes[q.id]);
      setPending((list) => list.filter((x) => x.id !== q.id));
    } catch {
      // keep it in the list so the admin can try again
    }
    setBusy(null);
  }

  return (
    <Shell>
      <Title subtitle={tx('mod.sub')}>{tx('mod.title')}</Title>
      {pending === null ? null : pending.length === 0 ? (
        <EmptyState icon="shield-checkmark" title={tx('mod.empty')} />
      ) : (
        pending.map((q) => {
          const info = categoryInfo(q.category);
          const lq = localize(q, lang);
          return (
            <Card key={q.id} style={{ marginBottom: space.md }}>
              <View style={s.top}>
                <Text style={[s.tag, { color: info.color }]}>
                  {tx(`cat.${info.id}`)} · {tx(`diff.${q.difficulty || 2}`)}
                </Text>
                <Text style={s.muted}>{tx('mod.by', { name: q.submittedByName || '?', d: formatDate(q.createdAt, lang) })}</Text>
              </View>
              <Text style={s.question}>{lq.question}</Text>
              {lq.answers.map((a, i) => (
                <View key={i} style={s.answerRow}>
                  <View style={[s.dot, { backgroundColor: ANSWER_TILES[i].color }]}>
                    <Ionicons name={ANSWER_TILES[i].icon} size={11} color="#fff" />
                  </View>
                  <Text style={[s.answer, i === q.correct && { color: t.correct, fontWeight: '800' }]}>{a}</Text>
                  {i === q.correct ? <Ionicons name="checkmark" size={16} color={t.correct} /> : null}
                </View>
              ))}
              {lq.fact ? <Text style={[s.muted, { marginTop: space.sm, fontStyle: 'italic' }]}>{lq.fact}</Text> : null}
              <TextInput
                style={s.input}
                value={notes[q.id] || ''}
                onChangeText={(v) => setNotes((n) => ({ ...n, [q.id]: v }))}
                placeholder={tx('mod.notePh')}
                placeholderTextColor={t.muted}
              />
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <Button title={tx('mod.approve')} icon="checkmark" small onPress={() => decide(q, true)} disabled={busy === q.id} style={{ flex: 1 }} />
                <Button title={tx('mod.reject')} icon="close" variant="danger" small onPress={() => decide(q, false)} disabled={busy === q.id} style={{ flex: 1 }} />
              </View>
            </Card>
          );
        })
      )}
    </Shell>
  );
}

const useStyles = makeStyles((t) => ({
  top: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.sm },
  tag: { fontWeight: '800', fontSize: font.small },
  muted: { color: t.muted, fontSize: font.small, lineHeight: 18 },
  question: { color: t.text, fontWeight: '800', fontSize: font.medium, marginTop: space.sm, marginBottom: space.sm, lineHeight: 22 },
  answerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 5 },
  dot: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  answer: { flex: 1, color: t.text },
  input: { borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: space.md, paddingVertical: 10, color: t.text, backgroundColor: t.bg, marginVertical: space.md },
}));
