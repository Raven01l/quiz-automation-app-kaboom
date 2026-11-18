import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { backend } from '../backend';
import { Button, Card, ConfirmDialog, ProgressBar } from '../components/ui';
import { categoryInfo } from '../config';
import { ANSWER_TILES, font, makeStyles, space, useTheme } from '../theme';
import { formatNumber, maskName, pointsFor } from '../utils';
import { localize } from '../i18n';

const READY_SECONDS = 3;
const REVEAL_MS = 2500; // how long both answers stay on screen before the next question
const GRACE_MS = 6000; // if the opponent hasn't answered this long after time is up, move on without them

// Live duel: both phones watch the same Firestore document (duels/<code>).
// Each player writes only their own answers; either phone may advance to the next question.
export default function DuelRoomScreen() {
  const { route, user, tx, lang, navigate, saveGame, prefs } = useApp();
  const t = useTheme();
  const s = useStyles();
  const code = route.params.code;
  const me = user.uid;

  const [duel, setDuel] = useState(undefined); // undefined = loading, null = room gone
  const [countdown, setCountdown] = useState(READY_SECONDS);
  const [leftMs, setLeftMs] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const startedAt = useRef(0);
  const startedIndex = useRef(-1);
  const sending = useRef(false);
  const saved = useRef(false);

  useEffect(() => backend.watchDuel(code, setDuel, () => setDuel(null)), [code]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setConfirmLeave(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  const isHost = duel?.hostUid === me;
  const opp = duel ? (isHost ? duel.guestUid : duel.hostUid) : null;
  const oppName = duel ? (isHost ? duel.guestName : duel.hostName) || '' : '';
  const shownOppName = prefs.hideName ? maskName(oppName) : oppName;
  const questions = duel?.questions || [];
  const index = duel?.current ?? 0;
  const timeLimit = duel?.timeLimit || 10;
  const myAnswers = duel?.answers?.[me] || {};
  const oppAnswers = (opp && duel?.answers?.[opp]) || {};
  const myAnswer = myAnswers[index];
  const oppAnswer = oppAnswers[index];
  const playing = duel?.status === 'playing';
  const inCountdown = playing && index === 0 && countdown >= 0;
  const bothAnswered = Boolean(myAnswer && oppAnswer);

  const score = (answers) => Object.values(answers).reduce((n, a) => n + (a?.points || 0), 0);
  const myScore = score(myAnswers);
  const oppScore = score(oppAnswers);

  // 3-2-1 countdown before the first question
  useEffect(() => {
    if (!playing || index !== 0 || countdown < 0) return undefined;
    const id = setTimeout(() => setCountdown((c) => c - 1), 800);
    return () => clearTimeout(id);
  }, [playing, index, countdown]);

  // Start the local timer whenever a new question appears
  useEffect(() => {
    if (!playing || inCountdown || index >= questions.length) return;
    if (startedIndex.current !== index) {
      startedIndex.current = index;
      startedAt.current = Date.now();
      sending.current = false;
      setLeftMs(timeLimit * 1000);
    }
  }, [playing, inCountdown, index, questions.length, timeLimit]);

  // Question timer; when it runs out, record a timeout for me
  useEffect(() => {
    if (!playing || inCountdown || myAnswer || startedIndex.current !== index) return undefined;
    const id = setInterval(() => {
      const left = timeLimit * 1000 - (Date.now() - startedAt.current);
      if (left <= 0) {
        clearInterval(id);
        setLeftMs(0);
        answer(null);
      } else setLeftMs(left);
    }, 100);
    return () => clearInterval(id);
  }, [playing, inCountdown, index, Boolean(myAnswer)]);

  // Both answered: show the result briefly, then move on
  useEffect(() => {
    if (!playing || !bothAnswered) return undefined;
    const id = setTimeout(() => backend.advanceDuel(code, index).catch(() => {}), REVEAL_MS);
    return () => clearTimeout(id);
  }, [playing, bothAnswered, index]);

  // Opponent stuck or disconnected: move on without them after the grace period
  useEffect(() => {
    if (!playing || !myAnswer || oppAnswer) return undefined;
    const wait = Math.max(0, timeLimit * 1000 - (Date.now() - startedAt.current)) + GRACE_MS;
    const id = setTimeout(() => backend.advanceDuel(code, index, true).catch(() => {}), wait);
    return () => clearTimeout(id);
  }, [playing, Boolean(myAnswer), Boolean(oppAnswer), index]);

  // Save the finished duel to my history once
  useEffect(() => {
    if (duel?.status !== 'finished' || saved.current) return;
    saved.current = true;
    const answers = questions.map((q, i) => {
      const a = myAnswers[i] || { chosen: null, timeMs: timeLimit * 1000, points: 0 };
      return { id: q.id, category: q.category, correct: q.correct, chosen: a.chosen, timeMs: a.timeMs, points: a.points };
    });
    const correctCount = answers.filter((a) => a.chosen === a.correct).length;
    const timeoutCount = answers.filter((a) => a.chosen === null).length;
    let best = 0;
    let run = 0;
    answers.forEach((a) => {
      run = a.chosen === a.correct ? run + 1 : 0;
      best = Math.max(best, run);
    });
    saveGame({
      id: `duel-${code}-${me}`,
      date: Date.now(),
      category: duel.category,
      difficulty: 0,
      timeLimit,
      source: 'duel',
      answers,
      score: myScore,
      correctCount,
      wrongCount: answers.length - correctCount - timeoutCount,
      timeoutCount,
      bestStreak: best,
      duel: { code, opponent: oppName, opponentScore: oppScore, result: myScore > oppScore ? 'win' : myScore < oppScore ? 'lose' : 'draw' },
    });
  }, [duel?.status]);

  function answer(choice) {
    if (!playing || myAnswer || sending.current) return;
    sending.current = true;
    const q = questions[index];
    const timeMs = Math.min(Date.now() - startedAt.current, timeLimit * 1000);
    const correct = choice !== null && choice === q.correct;
    let streak = 0;
    for (let i = index - 1; i >= 0 && myAnswers[i] && myAnswers[i].chosen === questions[i].correct; i--) streak += 1;
    const pts = correct ? pointsFor(timeMs, timeLimit, streak + 1).total : 0;
    backend.submitDuelAnswer(code, me, index, { chosen: choice, timeMs, points: pts }).catch(() => {
      sending.current = false;
    });
  }

  async function leave() {
    setConfirmLeave(false);
    if (duel && ['waiting', 'ready', 'playing'].includes(duel.status)) await backend.leaveDuel(code, me).catch(() => {});
    navigate('Duel');
  }

  // ---------- Screens ----------
  if (duel === undefined) {
    return <Centered><Text style={s.muted}>{tx('duel.loading')}</Text></Centered>;
  }

  if (duel === null || (duel.status === 'abandoned' && duel.leftBy === me)) {
    return (
      <Centered>
        <Text style={s.bigTitle}>{tx('duel.closed')}</Text>
        <Button title={tx('duel.again')} onPress={() => navigate('Duel')} style={{ marginTop: space.lg }} />
      </Centered>
    );
  }

  if (duel.status === 'abandoned') {
    return (
      <Centered>
        <Ionicons name="exit-outline" size={48} color={t.accentStrong} />
        <Text style={s.bigTitle}>{tx('duel.abandoned')}</Text>
        <Text style={s.muted}>{tx('duel.oppLeft')}</Text>
        <Button title={tx('duel.again')} onPress={() => navigate('Duel')} style={{ marginTop: space.lg }} />
      </Centered>
    );
  }

  if (duel.status === 'waiting' || duel.status === 'ready') {
    const cat = categoryInfo(duel.category);
    return (
      <SafeAreaView style={s.root}>
        <ScrollView contentContainerStyle={s.lobby}>
          <Text style={s.muted}>{tx('duel.yourCode')}</Text>
          <Text style={s.code} selectable>
            {code}
          </Text>
          <Text style={[s.muted, { textAlign: 'center', marginBottom: space.xl }]}>{tx('duel.shareCode')}</Text>
          <Card style={s.lobbyCard}>
            <Player name={tx('duel.you')} host={isHost} />
            <Text style={s.vs}>{tx('duel.vs')}</Text>
            {duel.status === 'ready' ? <Player name={shownOppName} host={!isHost} /> : <Text style={s.muted}>{tx('duel.waiting')}</Text>}
          </Card>
          <Text style={[s.muted, { marginTop: space.md }]}>
            {tx(`cat.${cat.id}`)} · {tx('questionsN', { n: questions.length })} · {tx('secondsN', { n: timeLimit })}
          </Text>
          {duel.status === 'ready' && isHost ? (
            <>
              <Text style={s.joined}>{tx('duel.joined', { name: shownOppName })}</Text>
              <Button title={tx('duel.start')} icon="play" variant="gold" big onPress={() => backend.startDuel(code)} style={{ marginTop: space.md, alignSelf: 'stretch' }} />
            </>
          ) : null}
          {duel.status === 'ready' && !isHost ? <Text style={s.joined}>{tx('duel.waitHost', { name: shownOppName })}</Text> : null}
          <Button title={isHost ? tx('duel.cancel') : tx('duel.leave')} variant="secondary" onPress={leave} style={{ marginTop: space.lg, alignSelf: 'stretch' }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (duel.status === 'finished') {
    const result = myScore > oppScore ? 'win' : myScore < oppScore ? 'lose' : 'draw';
    const color = result === 'win' ? t.correct : result === 'lose' ? t.wrong : t.accent;
    const icon = result === 'win' ? 'trophy' : result === 'lose' ? 'sad-outline' : 'git-compare';
    const correctOf = (answers) => questions.filter((q, i) => answers[i]?.chosen === q.correct).length;
    return (
      <SafeAreaView style={s.root}>
        <ScrollView contentContainerStyle={s.lobby}>
          <View style={[s.resultHero, { backgroundColor: color }]}>
            <Ionicons name={icon} size={56} color="#fff" />
            <Text style={s.resultTitle}>{tx(`duel.${result}`)}</Text>
            <Text style={s.resultSub}>{tx(`duel.${result}Sub`, { name: shownOppName })}</Text>
          </View>
          <View style={s.scoreRow}>
            <ScoreCard name={tx('duel.you')} score={myScore} correct={correctOf(myAnswers)} total={questions.length} winner={result === 'win'} />
            <ScoreCard name={shownOppName} score={oppScore} correct={correctOf(oppAnswers)} total={questions.length} winner={result === 'lose'} />
          </View>
          <Button title={tx('duel.again')} icon="people" variant="gold" big onPress={() => navigate('Duel')} style={{ alignSelf: 'stretch', marginTop: space.lg }} />
          <Button title={tx('duel.home')} icon="home" variant="secondary" onPress={() => navigate('Home')} style={{ alignSelf: 'stretch', marginTop: space.sm }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Playing ----------
  if (inCountdown) {
    return (
      <Centered>
        <Text style={s.readyLabel}>{tx('game.ready')}</Text>
        <View style={s.readyCircle}>
          <Text style={s.readyNumber}>{countdown > 0 ? countdown : tx('game.go')}</Text>
        </View>
        <Text style={s.muted}>
          {tx('duel.you')} {tx('duel.vs')} {shownOppName}
        </Text>
      </Centered>
    );
  }

  const q = questions[Math.min(index, questions.length - 1)];
  const lq = localize(q, lang);
  const cat = categoryInfo(q.category);
  const ratio = myAnswer ? 0 : leftMs / (timeLimit * 1000);
  const timerColor = ratio > 0.5 ? t.correct : ratio > 0.25 ? t.gold : t.wrong;

  let status = null;
  if (myAnswer && !oppAnswer) status = { text: tx('duel.waitingOpp'), color: t.muted, icon: 'hourglass-outline' };
  if (bothAnswered) {
    const oc = oppAnswer.chosen === q.correct;
    status = {
      text: oc ? tx('duel.oppCorrect', { name: shownOppName }) : oppAnswer.chosen === null ? tx('duel.oppTimeout', { name: shownOppName }) : tx('duel.oppWrong', { name: shownOppName }),
      color: oc ? t.correct : t.wrong,
      icon: oc ? 'checkmark-circle' : 'close-circle',
    };
  }

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={s.top}>
        <Pressable onPress={() => setConfirmLeave(true)} style={{ padding: 4 }} accessibilityLabel={tx('duel.leave')}>
          <Ionicons name="close" size={26} color={t.text} />
        </Pressable>
        <Text style={s.counter}>
          {index + 1} / {questions.length}
        </Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={s.board}>
        <View style={[s.side, { backgroundColor: t.accent }]}>
          <Text style={s.sideName} numberOfLines={1}>{tx('duel.you')}</Text>
          <Text style={s.sideScore}>{formatNumber(myScore, lang)}</Text>
        </View>
        <Text style={s.vs}>{tx('duel.vs')}</Text>
        <View style={[s.side, { backgroundColor: '#F97316' }]}>
          <Text style={s.sideName} numberOfLines={1}>{shownOppName}</Text>
          <Text style={s.sideScore}>{formatNumber(oppScore, lang)}</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: space.lg }}>
        <ProgressBar value={ratio} color={timerColor} height={8} />
      </View>

      <ScrollView contentContainerStyle={s.body}>
        <View style={s.inner}>
          <View style={[s.catChip, { backgroundColor: cat.color + '33' }]}>
            <Ionicons name={cat.icon} size={14} color={cat.color} />
            <Text style={[s.catText, { color: cat.color }]}>{tx(`cat.${cat.id}`)}</Text>
          </View>
          <View style={s.questionCard}>
            <Text style={s.question}>{lq.question}</Text>
          </View>

          {status ? (
            <View style={s.status}>
              <Ionicons name={status.icon} size={20} color={status.color} />
              <Text style={[s.statusText, { color: status.color }]}>{status.text}</Text>
            </View>
          ) : null}

          <View style={s.tiles}>
            {lq.answers.map((text, i) => {
              const tile = ANSWER_TILES[i];
              const reveal = bothAnswered;
              const isCorrect = i === q.correct;
              const mine = myAnswer?.chosen === i;
              const dim = myAnswer && !mine && !(reveal && isCorrect);
              return (
                <Pressable
                  key={i}
                  onPress={() => answer(i)}
                  disabled={Boolean(myAnswer)}
                  accessibilityLabel={tx('game.answer', { i: i + 1, text })}
                  style={({ pressed }) => [s.tile, { backgroundColor: tile.color }, dim && { opacity: 0.3 }, mine && s.tileMine, pressed && { transform: [{ scale: 0.97 }] }]}
                >
                  <View style={s.tileIcon}>
                    <Ionicons name={tile.icon} size={22} color={tile.color} />
                  </View>
                  <Text style={s.tileText}>{text}</Text>
                  {reveal && isCorrect ? <Ionicons name="checkmark-circle" size={28} color="#fff" /> : null}
                  {reveal && mine && !isCorrect ? <Ionicons name="close-circle" size={28} color="#fff" /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmLeave}
        title={tx('duel.leaveTitle')}
        message={tx('duel.leaveMsg')}
        confirmText={tx('duel.leave')}
        danger
        onCancel={() => setConfirmLeave(false)}
        onConfirm={leave}
      />
    </SafeAreaView>
  );

  function Player({ name, host }) {
    return (
      <View style={s.player}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(name || '?')[0]?.toUpperCase()}</Text>
        </View>
        <Text style={s.playerName} numberOfLines={1}>{name}</Text>
        {host ? <Ionicons name="star" size={14} color={t.goldText} /> : null}
      </View>
    );
  }

  function ScoreCard({ name, score: sc, correct, total, winner }) {
    return (
      <Card style={[s.scoreCard, winner && { borderColor: t.gold, borderWidth: 2 }]}>
        {winner ? <Ionicons name="trophy" size={20} color={t.goldText} /> : <View style={{ height: 20 }} />}
        <Text style={s.playerName} numberOfLines={1}>{name}</Text>
        <Text style={s.cardScore}>{formatNumber(sc, lang)}</Text>
        <Text style={s.muted}>
          {tx('duel.correctN', { n: correct })} / {total}
        </Text>
      </Card>
    );
  }

  function Centered({ children }) {
    return <SafeAreaView style={[s.root, s.center]}>{children}</SafeAreaView>;
  }
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: space.xl },
  muted: { color: t.muted, fontSize: font.body, textAlign: 'center' },
  bigTitle: { color: t.text, fontSize: font.title, fontWeight: '900', marginTop: space.md, textAlign: 'center' },
  lobby: { padding: space.xl, alignItems: 'center', width: '100%', maxWidth: 520, alignSelf: 'center' },
  code: { fontSize: 48, fontWeight: '900', letterSpacing: 10, color: t.accentStrong, marginVertical: space.sm },
  lobbyCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', alignSelf: 'stretch', paddingVertical: space.xl },
  player: { alignItems: 'center', gap: 6, maxWidth: 140 },
  avatar: { width: 56, height: 56, borderRadius: 18, backgroundColor: t.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#1A1033' },
  playerName: { color: t.text, fontWeight: '800', fontSize: font.medium, maxWidth: 140 },
  vs: { color: t.muted, fontWeight: '900', fontSize: font.medium, marginHorizontal: space.md },
  joined: { color: t.correct, fontWeight: '800', marginTop: space.lg, textAlign: 'center' },
  readyLabel: { color: t.muted, fontWeight: '900', fontSize: font.large },
  readyCircle: { width: 170, height: 170, borderRadius: 85, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', marginVertical: space.xl, borderWidth: 8, borderColor: t.accentSoft },
  readyNumber: { color: '#fff', fontSize: 64, fontWeight: '900' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, height: 56 },
  counter: { color: t.text, fontWeight: '900', fontSize: font.medium },
  board: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, marginBottom: space.md },
  side: { flex: 1, borderRadius: 14, paddingVertical: space.sm, paddingHorizontal: space.md, borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.25)' },
  sideName: { color: 'rgba(255,255,255,0.9)', fontWeight: '800', fontSize: font.small },
  sideScore: { color: '#fff', fontWeight: '900', fontSize: font.large },
  body: { padding: space.lg, paddingBottom: space.xl * 2 },
  inner: { width: '100%', maxWidth: 820, alignSelf: 'center' },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start', marginBottom: space.md },
  catText: { fontWeight: '800', fontSize: font.small },
  questionCard: { backgroundColor: t.surface, borderRadius: 20, paddingVertical: space.xl, paddingHorizontal: space.xl, borderWidth: 1, borderColor: t.border, marginBottom: space.lg },
  question: { color: t.text, fontSize: 21, fontWeight: '800', textAlign: 'center', lineHeight: 29 },
  status: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: space.md },
  statusText: { fontWeight: '800', fontSize: font.medium },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: { flexGrow: 1, flexBasis: 260, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: 16, borderBottomWidth: 5, borderBottomColor: 'rgba(0,0,0,0.28)' },
  tileMine: { borderWidth: 3, borderColor: '#fff', borderBottomWidth: 5 },
  tileIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tileText: { flex: 1, color: '#fff', fontWeight: '800', fontSize: font.medium + 1 },
  resultHero: { alignSelf: 'stretch', alignItems: 'center', borderRadius: 24, padding: space.xl, borderBottomWidth: 6, borderBottomColor: 'rgba(0,0,0,0.25)' },
  resultTitle: { color: '#fff', fontSize: 34, fontWeight: '900', marginTop: space.sm },
  resultSub: { color: 'rgba(255,255,255,0.92)', fontWeight: '700', marginTop: 4, textAlign: 'center' },
  scoreRow: { flexDirection: 'row', gap: space.md, alignSelf: 'stretch', marginTop: space.lg },
  scoreCard: { flex: 1, alignItems: 'center', gap: 4 },
  cardScore: { color: t.goldText, fontSize: 30, fontWeight: '900' },
}));
