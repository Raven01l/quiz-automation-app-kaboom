import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import Shell from '../components/Shell';
import { Button, Card, Chip, Pagination, SectionTitle, Title } from '../components/ui';
import { CATEGORIES, PAGE_SIZE, categoryInfo } from '../config';
import { ANSWER_TILES, font, makeStyles, space, useTheme } from '../theme';
import { localize } from '../i18n';


const SAMPLE = `[
  {
    "id": "CUSTOM-001",
    "category": "science",
    "difficulty": 1,
    "question": { "tr": "Güneş Sistemi'nde kaç gezegen vardır?", "en": "How many planets are in our solar system?" },
    "answers": ["8", "9", "7", "10"],
    "correct": 0,
    "fact": { "tr": "Plüton 2006'da cüce gezegen olarak yeniden sınıflandırıldı.", "en": "Pluto was reclassified as a dwarf planet in 2006." }
  }
]`;

// Returns [key, vars] for the first problem found, or null
function validate(list) {
  if (!Array.isArray(list)) return ['val.list'];
  const cats = Object.keys(CATEGORIES);
  for (let i = 0; i < list.length; i++) {
    const q = list[i];
    const n = { i: i + 1 };
    if (!q || typeof q !== 'object') return ['val.item', n];
    if (!q.id || !q.question) return ['val.required', n];
    if (!cats.includes(q.category)) return ['val.category', { ...n, list: cats.join(', ') }];
    const answerLists = Array.isArray(q.answers) ? [q.answers] : q.answers && typeof q.answers === 'object' ? Object.values(q.answers) : [];
    if (!answerLists.length || answerLists.some((a) => !Array.isArray(a) || a.length !== 4)) return ['val.answers', n];
    if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct > 3) return ['val.correct', n];
  }
  return null;
}

export default function LibraryScreen() {
  const { questions, customQuestions, addQuestions, tx, lang } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState({});
  const [importOpen, setImportOpen] = useState(false);
  const [json, setJson] = useState('');
  const [message, setMessage] = useState(null);

  const list = useMemo(() => {
    const q = search.trim().toLocaleLowerCase(lang);
    return questions.filter((x) => (category === 'all' || x.category === category) && (!q || localize(x, lang).question.toLocaleLowerCase(lang).includes(q)));
  }, [questions, search, category, lang]);
  const shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function importJson() {
    setMessage(null);
    let data;
    try {
      data = JSON.parse(json);
    } catch {
      setMessage({ error: true, text: tx('lib.badJson') });
      return;
    }
    const err = validate(data);
    if (err) {
      setMessage({ error: true, text: tx(err[0], err[1]) });
      return;
    }
    const clean = data.map((q) => ({ difficulty: 2, fact: '', ...q, custom: true }));
    const { added, skipped } = await addQuestions(clean);
    setMessage({ error: false, text: skipped ? tx('lib.addedSkipped', { n: added, s: skipped }) : tx('lib.added', { n: added }) });
    if (added) setJson('');
  }

  return (
    <Shell>
      <Title subtitle={tx('lib.sub', { n: questions.length, c: customQuestions.length })}>{tx('lib.title')}</Title>

      <View style={s.counts}>
        {Object.values(CATEGORIES).map((c) => (
          <View key={c.id} style={[s.countBox, { borderColor: c.color + '66' }]}>
            <Ionicons name={c.icon} size={18} color={c.color} />
            <Text style={s.countNum}>{questions.filter((q) => q.category === c.id).length}</Text>
            <Text style={s.muted} numberOfLines={1}>
              {tx(`cat.${c.id}`)}
            </Text>
          </View>
        ))}
      </View>

      <View style={s.search}>
        <Ionicons name="search" size={18} color={t.muted} />
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={(v) => { setSearch(v); setPage(1); }}
          placeholder={tx('lib.search')}
          placeholderTextColor={t.muted}
        />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Chip label={tx('scores.all')} selected={category === 'all'} onPress={() => { setCategory('all'); setPage(1); }} />
        {Object.values(CATEGORIES).map((c) => (
          <Chip key={c.id} label={tx(`cat.${c.id}`)} color={c.color} selected={category === c.id} onPress={() => { setCategory(c.id); setPage(1); }} />
        ))}
      </View>

      {shown.map((q) => {
        const info = categoryInfo(q.category);
        const lq = localize(q, lang);
        return (
          <Pressable key={q.id} onPress={() => setOpen((o) => ({ ...o, [q.id]: !o[q.id] }))}>
            <Card style={{ marginBottom: space.sm, padding: space.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[s.tag, { color: info.color }]}>
                  {q.id} · {tx(`cat.${info.id}`)}
                </Text>
                <Text style={s.muted}>{q.difficulty ? tx(`diff.${q.difficulty}`) : ''}</Text>
              </View>
              <Text style={s.question} numberOfLines={open[q.id] ? undefined : 2}>
                {lq.question}
              </Text>
              {open[q.id] ? (
                <View style={{ marginTop: space.sm }}>
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
                </View>
              ) : null}
            </Card>
          </Pressable>
        );
      })}
      <Pagination page={page} total={list.length} pageSize={PAGE_SIZE} onChange={setPage} />

      <SectionTitle right={<Button title={importOpen ? tx('close') : tx('open')} variant="secondary" small onPress={() => setImportOpen(!importOpen)} />}>
        {tx('lib.import')}
      </SectionTitle>
      {importOpen ? (
        <Card>
          <Text style={s.muted}>{tx('lib.importHelp')}</Text>
          <TextInput style={s.json} multiline value={json} onChangeText={setJson} placeholder="[ { ... } ]" placeholderTextColor={t.muted} autoCapitalize="none" autoCorrect={false} />
          {message ? <Text style={{ color: message.error ? t.wrong : t.correct, marginBottom: space.sm }}>{message.text}</Text> : null}
          <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
            <Button title={tx('lib.example')} variant="secondary" small onPress={() => setJson(SAMPLE)} />
            <Button title={tx('lib.importBtn')} icon="cloud-upload-outline" small onPress={importJson} disabled={!json.trim()} />
          </View>
        </Card>
      ) : null}
    </Shell>
  );
}

const useStyles = makeStyles((t) => ({
  counts: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.lg },
  countBox: { flexGrow: 1, flexBasis: 100, backgroundColor: t.surface, borderWidth: 1, borderRadius: 14, padding: space.md },
  countNum: { fontSize: font.large, fontWeight: '900', color: t.text, marginTop: 4 },
  muted: { color: t.muted, fontSize: font.small, lineHeight: 18 },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, borderRadius: 12, paddingHorizontal: space.md, marginBottom: space.md },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: font.medium - 1, color: t.text },
  tag: { fontWeight: '800', fontSize: font.small, flex: 1 },
  question: { color: t.text, fontWeight: '700', marginTop: 4, lineHeight: 21 },
  answerRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 5 },
  dot: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  answer: { flex: 1, color: t.text },
  json: {
    minHeight: 170,
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 12,
    padding: space.md,
    marginVertical: space.md,
    fontFamily: 'monospace',
    fontSize: font.small,
    color: t.text,
    backgroundColor: t.bg,
    textAlignVertical: 'top',
  },
}));
