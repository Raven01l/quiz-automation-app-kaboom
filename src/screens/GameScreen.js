import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { Button, ConfirmDialog, ProgressBar } from '../components/ui';
import { categoryInfo } from '../config';
import { ANSWER_TILES, font, makeStyles, space, useTheme } from '../theme';
import { formatNumber, pointsFor } from '../utils';
import { localize } from '../i18n';

const READY_SECONDS = 3;

export default function GameScreen() {
  const { route, questionMap, saveGame, navigate, tx, lang } = useApp();
  const t = useTheme();
  const s = useStyles();
  const { questionIds = [], category, difficulty, timeLimit = 20, source } = route.params;
  const questions = useMemo(() => questionIds.map((id) => questionMap[id]).filter(Boolean), [questionIds, questionMap]);

  const [phase, setPhase] = useState('ready'); // ready | question | feedback
  const [countdown, setCountdown] = useState(READY_SECONDS);
  const [index, setIndex] = useState(0);
  const [leftMs, setLeftMs] = useState(timeLimit * 1000);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const startedAt = useRef(0);
  const locked = useRef(false); // stops double taps from counting twice
  const finished = useRef(false);

  const q = questions[index];

  // 3-2-1 countdown before the first question
  useEffect(() => {
    if (phase !== 'ready') return undefined;
    if (countdown < 0) {
      beginQuestion();
      return undefined;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 800);
    return () => clearTimeout(id);
  }, [phase, countdown]);

  // Question timer
  useEffect(() => {
    if (phase !== 'question') return undefined;
    const id = setInterval(() => {
      const left = timeLimit * 1000 - (Date.now() - startedAt.current);
      if (left <= 0) {
        clearInterval(id);
        setLeftMs(0);
        answer(null);
      } else setLeftMs(left);
    }, 100);
    return () => clearInterval(id);
  }, [phase, index]);

  // Android back button asks before leaving
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setConfirmExit(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  function beginQuestion() {
    startedAt.current = Date.now();
    locked.current = false;
    setLeftMs(timeLimit * 1000);
    setPhase('question');
  }

  function answer(choice) {
    if (phase !== 'question' || locked.current) return;
    locked.current = true;
    const timeMs = Math.min(Date.now() - startedAt.current, timeLimit * 1000);
    const correct = choice !== null && choice === q.correct;
    const newStreak = correct ? streak + 1 : 0;
    const pts = correct ? pointsFor(timeMs, timeLimit, newStreak) : { base: 0, bonus: 0, total: 0 };
    setStreak(newStreak);
    setBestStreak((b) => Math.max(b, newStreak));
    setScore((sc) => sc + pts.total);
    setAnswers((a) => [...a, { id: q.id, category: q.category, correct: q.correct, chosen: choice, timeMs, points: pts.total }]);
    setLastResult({ choice, correct, timedOut: choice === null, points: pts, streak: newStreak });
    setPhase('feedback');
  }

  async function next() {
    if (index < questions.length - 1) {
      setIndex(index + 1);
      setLastResult(null);
      beginQuestion();
      return;
    }
    if (finished.current) return;
    finished.current = true;
    const correctCount = answers.filter((a) => a.chosen === a.correct).length;
    const timeoutCount = answers.filter((a) => a.chosen === null).length;
    const game = {
      id: `${Date.now()}`,
      date: Date.now(),
      category,
      difficulty: difficulty || 0,
      timeLimit,
      source,
      answers,
      score,
      correctCount,
      wrongCount: answers.length - correctCount - timeoutCount,
      timeoutCount,
      bestStreak,
    };
    await saveGame(game);
    navigate('Result', { gameId: game.id, fresh: true });
  }

  if (!questions.length) {
    return (
      <SafeAreaView style={s.root}>
        <Text style={[s.question, { padding: space.xl }]}>{tx('game.empty')}</Text>
        <Button title={tx('game.backHome')} onPress={() => navigate('Home')} style={{ margin: space.xl }} />
      </SafeAreaView>
    );
  }

  if (phase === 'ready') {
    return (
      <SafeAreaView style={[s.root, s.center]}>
        <Text style={s.readyLabel}>{tx('game.ready')}</Text>
        <View style={s.readyCircle}>
          <Text style={s.readyNumber}>{countdown > 0 ? countdown : tx('game.go')}</Text>
        </View>
        <Text style={s.readySub}>{tx('game.readySub', { n: questions.length, s: timeLimit, cat: tx(`cat.${categoryInfo(category).id}`) })}</Text>
      </SafeAreaView>
    );
  }

  const cat = categoryInfo(q.category);
  const lq = localize(q, lang);
  const timeRatio = leftMs / (timeLimit * 1000);
  const timerColor = timeRatio > 0.5 ? t.correct : timeRatio > 0.25 ? t.gold : t.wrong;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.top}>
        <Pressable onPress={() => setConfirmExit(true)} style={{ padding: 4, width: 96 }} accessibilityLabel={tx('game.quit')}>
          <Ionicons name="close" size={26} color={t.text} />
        </Pressable>
        <Text style={s.counter}>
          {index + 1} / {questions.length}
        </Text>
        <View style={s.scorePill}>
          <Ionicons name="star" size={14} color="#1A1033" />
          <Text style={s.scoreText}>{formatNumber(score, lang)}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: space.lg }}>
        <ProgressBar value={phase === 'question' ? timeRatio : 0} color={timerColor} height={8} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        <View style={s.inner}>
          <View style={s.metaRow}>
            <View style={[s.catChip, { backgroundColor: cat.color + '33' }]}>
              <Ionicons name={cat.icon} size={14} color={cat.color} />
              <Text style={[s.catText, { color: cat.color }]}>{tx(`cat.${cat.id}`)}</Text>
            </View>
            {phase === 'question' ? (
              <View style={s.timer}>
                <Text style={[s.timerText, { color: timerColor }]}>{Math.ceil(leftMs / 1000)}</Text>
              </View>
            ) : null}
          </View>

          <View style={s.questionCard}>
            <Text style={s.question}>{lq.question}</Text>
          </View>

          {phase === 'feedback' && lastResult ? <Feedback result={lastResult} /> : null}

          <View style={s.tiles}>
            {lq.answers.map((text, i) => {
              const tile = ANSWER_TILES[i];
              const reveal = phase === 'feedback';
              const isCorrect = i === q.correct;
              const isChosen = lastResult?.choice === i;
              const dim = reveal && !isCorrect && !isChosen;
              return (
                <Pressable
                  key={i}
                  onPress={() => answer(i)}
                  disabled={phase !== 'question'}
                  accessibilityLabel={tx('game.answer', { i: i + 1, text })}
                  style={({ pressed }) => [
                    s.tile,
                    { backgroundColor: tile.color },
                    dim && { opacity: 0.3 },
                    reveal && isCorrect && s.tileCorrect,
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <View style={s.tileIcon}>
                    <Ionicons name={tile.icon} size={22} color={tile.color} />
                  </View>
                  <Text style={s.tileText}>{text}</Text>
                  {reveal && isCorrect ? <Ionicons name="checkmark-circle" size={28} color="#fff" /> : null}
                  {reveal && isChosen && !isCorrect ? <Ionicons name="close-circle" size={28} color="#fff" /> : null}
                </Pressable>
              );
            })}
          </View>

          {phase === 'feedback' ? (
            <>
              <View style={s.fact}>
                <Ionicons name="bulb" size={18} color={t.gold} />
                <Text style={s.factText}>{lq.fact}</Text>
              </View>
              <Button
                title={index < questions.length - 1 ? tx('game.next') : tx('game.results')}
                icon={index < questions.length - 1 ? 'arrow-forward' : 'trophy'}
                variant={index < questions.length - 1 ? 'primary' : 'gold'}
                big
                onPress={next}
                style={{ marginTop: space.lg }}
              />
            </>
          ) : null}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmExit}
        title={tx('game.quitTitle')}
        message={tx('game.quitMsg')}
        confirmText={tx('game.quitBtn')}
        danger
        onCancel={() => setConfirmExit(false)}
        onConfirm={() => {
          setConfirmExit(false);
          navigate('Setup', { category: category !== 'review' ? category : undefined });
        }}
      />
    </SafeAreaView>
  );
}

function Feedback({ result }) {
  const t = useTheme();
  const s = useStyles();
  const { tx, lang } = useApp();
  const { correct, timedOut, points, streak } = result;
  const color = correct ? t.correct : t.wrong;
  const title = correct ? tx('fb.correct') : timedOut ? tx('fb.timeout') : tx('fb.wrong');
  const icon = correct ? 'checkmark-circle' : timedOut ? 'alarm' : 'close-circle';
  return (
    <View style={[s.feedback, { backgroundColor: color }]}>
      <Ionicons name={icon} size={34} color="#fff" />
      <View style={{ flex: 1, marginLeft: space.md }}>
        <Text style={s.feedbackTitle}>{title}</Text>
        <Text style={s.feedbackSub}>
          {correct
            ? points.bonus
              ? tx('fb.bonus', { n: formatNumber(points.base, lang), b: points.bonus })
              : tx('fb.points', { n: formatNumber(points.base, lang) })
            : tx('fb.lost')}
        </Text>
      </View>
      {correct && streak >= 2 ? (
        <View style={s.streak}>
          <Ionicons name="flame" size={18} color="#F97316" />
          <Text style={s.streakText}>{streak}</Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: space.xl },
  readyLabel: { color: t.muted, fontWeight: '900', fontSize: font.large, letterSpacing: 1 },
  readyCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: t.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: space.xl,
    borderWidth: 8,
    borderColor: t.accentSoft,
  },
  readyNumber: { color: '#fff', fontSize: 64, fontWeight: '900' },
  readySub: { color: t.muted, textAlign: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, height: 60 },
  counter: { color: t.text, fontWeight: '900', fontSize: font.medium },
  scorePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.gold, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, width: 96, justifyContent: 'center' },
  scoreText: { fontWeight: '900', color: '#1A1033' },
  body: { padding: space.lg, paddingBottom: space.xl * 2 },
  inner: { width: '100%', maxWidth: 820, alignSelf: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  catText: { fontWeight: '800', fontSize: font.small },
  timer: { width: 46, height: 46, borderRadius: 23, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' },
  timerText: { fontWeight: '900', fontSize: font.large },
  questionCard: {
    backgroundColor: t.surface,
    borderRadius: 20,
    paddingVertical: space.xl * 1.25,
    paddingHorizontal: space.xl,
    borderWidth: 1,
    borderColor: t.border,
    marginBottom: space.lg,
  },
  question: { color: t.text, fontSize: 22, fontWeight: '800', textAlign: 'center', lineHeight: 30 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: {
    flexGrow: 1,
    flexBasis: 260,
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: 16,
    borderBottomWidth: 5,
    borderBottomColor: 'rgba(0,0,0,0.28)',
  },
  tileCorrect: { borderWidth: 3, borderColor: '#fff', borderBottomWidth: 5 },
  tileIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tileText: { flex: 1, color: '#fff', fontWeight: '800', fontSize: font.medium + 1 },
  feedback: { flexDirection: 'row', alignItems: 'center', padding: space.lg, borderRadius: 18, marginBottom: space.lg },
  feedbackTitle: { color: '#fff', fontWeight: '900', fontSize: 24 },
  feedbackSub: { color: 'rgba(255,255,255,0.92)', fontWeight: '700', marginTop: 2 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  streakText: { fontWeight: '900', color: '#1A1033' },
  fact: { flexDirection: 'row', gap: space.sm, backgroundColor: t.surface, borderRadius: 14, padding: space.md, marginTop: space.lg, borderWidth: 1, borderColor: t.border },
  factText: { flex: 1, color: t.text, lineHeight: 20 },
}));
