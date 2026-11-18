import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { Button, Card, Chip } from './ui';
import { CATEGORIES } from '../config';
import { ANSWER_TILES, font, makeStyles, space, useTheme } from '../theme';

// "Suggest a Question" form. The question is saved as pending until an admin approves it.
export default function SuggestForm({ onSent }) {
  const { tx, submitQuestion } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [category, setCategory] = useState('science');
  const [difficulty, setDifficulty] = useState(2);
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [fact, setFact] = useState('');
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setMessage(null);
    if (!question.trim() || answers.some((a) => !a.trim())) {
      setMessage({ error: true, text: tx('lib.fillAll') });
      return;
    }
    setBusy(true);
    const err = await submitQuestion({
      category,
      difficulty,
      question: question.trim(),
      answers: answers.map((a) => a.trim()),
      correct,
      fact: fact.trim(),
    });
    setBusy(false);
    if (err) {
      setMessage({ error: true, text: err });
      return;
    }
    setMessage({ error: false, text: tx('lib.submitted') });
    setQuestion('');
    setAnswers(['', '', '', '']);
    setCorrect(0);
    setFact('');
    onSent?.();
  }

  return (
    <Card>
      <Text style={s.help}>{tx('lib.suggestSub')}</Text>

      <Text style={s.label}>{tx('lib.fCategory')}</Text>
      <View style={s.row}>
        {Object.values(CATEGORIES).map((c) => (
          <Chip key={c.id} label={tx(`cat.${c.id}`)} color={c.color} selected={category === c.id} onPress={() => setCategory(c.id)} />
        ))}
      </View>

      <Text style={s.label}>{tx('lib.fDifficulty')}</Text>
      <View style={s.row}>
        {[1, 2, 3].map((d) => (
          <Chip key={d} label={tx(`diff.${d}`)} selected={difficulty === d} onPress={() => setDifficulty(d)} />
        ))}
      </View>

      <Text style={s.label}>{tx('lib.fQuestion')}</Text>
      <TextInput style={[s.input, { minHeight: 70 }]} multiline value={question} onChangeText={setQuestion} placeholder={tx('lib.fQuestion')} placeholderTextColor={t.muted} maxLength={300} />

      <Text style={s.label}>{tx('lib.fCorrect')}</Text>
      {answers.map((a, i) => {
        const tile = ANSWER_TILES[i];
        const on = correct === i;
        return (
          <View key={i} style={s.answerRow}>
            <Pressable onPress={() => setCorrect(i)} style={[s.pick, { backgroundColor: tile.color }, on && s.pickOn]} accessibilityLabel={tx('lib.fCorrect')}>
              <Ionicons name={on ? 'checkmark' : tile.icon} size={18} color="#fff" />
            </Pressable>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0 }, on && { borderColor: t.correct, borderWidth: 2 }]}
              value={a}
              onChangeText={(v) => setAnswers((list) => list.map((x, j) => (j === i ? v : x)))}
              placeholder={tx('lib.fAnswer', { n: i + 1 })}
              placeholderTextColor={t.muted}
              maxLength={120}
            />
          </View>
        );
      })}

      <Text style={s.label}>{tx('lib.fFact')}</Text>
      <TextInput style={s.input} value={fact} onChangeText={setFact} placeholder={tx('lib.fFact')} placeholderTextColor={t.muted} maxLength={300} />

      {message ? <Text style={{ color: message.error ? t.wrong : t.correct, marginBottom: space.sm, fontWeight: '600' }}>{message.text}</Text> : null}
      <Button title={tx('lib.submit')} icon="send" onPress={send} disabled={busy} style={{ alignSelf: 'flex-start' }} />
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  help: { color: t.muted, fontSize: font.small, lineHeight: 18, marginBottom: space.sm },
  label: { color: t.text, fontWeight: '800', fontSize: font.small, marginTop: space.md, marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  input: { borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: space.md, paddingVertical: 10, color: t.text, backgroundColor: t.bg, marginBottom: space.sm, fontSize: font.body + 1 },
  answerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  pick: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', opacity: 0.55 },
  pickOn: { opacity: 1, borderWidth: 3, borderColor: t.correct },
}));
