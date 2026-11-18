import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import Shell from '../components/Shell';
import { Button, Card, SectionTitle, Title } from '../components/ui';
import { THEMES, font, makeStyles, space, useTheme } from '../theme';
import { checkPassword, dayStreak, formatDate, formatNumber, levelInfo, maskName } from '../utils';
import { badgeStatus } from '../badges';
import DeleteAccountModal from '../components/DeleteAccountModal';
import { LangSwitch } from './AuthScreen';

export default function ProfileScreen() {
  const { user, prefs, updatePrefs, changePassword, games, totalPoints, tx, lang, setLang, holidays, activeHoliday, startHoliday, endHoliday } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [message, setMessage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const demo = user.isAnonymous;

  // Statistics moved here from the Home screen (week-7 feedback)
  const stats = useMemo(() => {
    const answered = games.reduce((n, g) => n + g.answers.length, 0);
    const correct = games.reduce((n, g) => n + g.correctCount, 0);
    const duels = games.filter((g) => g.source === 'duel' && g.duel);
    const pct = answered ? Math.round((correct / answered) * 100) : 0;
    return [
      [tx('stat.streak'), tx('home.days', { n: dayStreak(games, holidays) })],
      [tx('stat.accuracy'), lang === 'en' ? `${pct}%` : `%${pct}`],
      [tx('stat.best'), formatNumber(Math.max(0, ...games.map((g) => g.score)), lang)],
      [tx('stat.games'), formatNumber(games.length, lang)],
      [tx('stat.answered'), formatNumber(answered, lang)],
      [tx('stat.badges'), String(badgeStatus(games, holidays).filter((b) => b.earned).length)],
      [
        tx('stat.duels'),
        tx('stat.duelsVal', {
          w: duels.filter((g) => g.duel.result === 'win').length,
          l: duels.filter((g) => g.duel.result === 'lose').length,
          d: duels.filter((g) => g.duel.result === 'draw').length,
        }),
      ],
    ];
  }, [games, holidays, lang]);

  async function submitPassword() {
    const err = await changePassword(current, next);
    setMessage(err ? { error: true, text: err } : { error: false, text: tx('prof.pwUpdated') });
    if (!err) {
      setCurrent('');
      setNext('');
    }
  }

  return (
    <Shell>
      <Title>{tx('prof.title')}</Title>
      <Card style={s.identity}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user.fullName[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{prefs.hideName ? maskName(user.fullName) : user.fullName}</Text>
          <Text style={s.muted}>{user.email || tx('prof.guest')}</Text>
          <Text style={s.muted}>
            {tx('prof.meta', { d: formatDate(user.createdAt, lang), l: levelInfo(totalPoints).level, g: games.length === 1 ? tx('gamesOne') : tx('gamesN', { n: games.length }), p: formatNumber(totalPoints, lang) })}
          </Text>
        </View>
      </Card>

      <SectionTitle>{tx('prof.stats')}</SectionTitle>
      <Card style={{ paddingVertical: space.sm }}>
        {stats.map(([label, value], i) => (
          <View key={label} style={[s.statRow, i < stats.length - 1 && s.statLine]}>
            <Text style={s.statLabel}>{label}</Text>
            <Text style={s.statValue}>{value}</Text>
          </View>
        ))}
      </Card>

      <SectionTitle>{tx('prof.language')}</SectionTitle>
      <View style={{ flexDirection: 'row' }}>
        <LangSwitch lang={lang} setLang={setLang} tx={tx} />
      </View>

      <SectionTitle>{tx('prof.theme')}</SectionTitle>
      <View style={s.themes}>
        {Object.values(THEMES).map((th) => {
          const on = prefs.theme === th.id;
          return (
            <Pressable key={th.id} onPress={() => updatePrefs({ theme: th.id })} style={[s.theme, { backgroundColor: th.bg, borderColor: on ? th.accentStrong : th.border }]}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[th.surface, th.accent, th.accentStrong].map((c) => (
                  <View key={c} style={[s.swatch, { backgroundColor: c }]} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md }}>
                <Text style={[s.themeName, { color: th.text }]}>{tx(`theme.${th.id}`)}</Text>
                {on ? <Ionicons name="checkmark-circle" size={22} color={th.accentStrong} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>{tx('prof.privacy')}</SectionTitle>
      <Card>
        <Pressable style={s.setting} onPress={() => updatePrefs({ hideName: !prefs.hideName })}>
          <Ionicons name={prefs.hideName ? 'eye-off' : 'eye'} size={22} color={t.accentStrong} />
          <View style={{ flex: 1 }}>
            <Text style={s.settingTitle}>{tx('prof.hide')}</Text>
            <Text style={s.muted}>{tx('prof.hideSub', { m: maskName(user.fullName) })}</Text>
          </View>
          <Ionicons name={prefs.hideName ? 'toggle' : 'toggle-outline'} size={36} color={prefs.hideName ? t.accentStrong : t.muted} />
        </Pressable>
      </Card>

      {!demo ? (
        <>
          <SectionTitle>{tx('prof.pw')}</SectionTitle>
          <Card>
            <TextInput style={s.input} secureTextEntry value={current} onChangeText={setCurrent} placeholder={tx('prof.current')} placeholderTextColor={t.muted} />
            <TextInput style={s.input} secureTextEntry value={next} onChangeText={setNext} placeholder={tx('prof.new')} placeholderTextColor={t.muted} />
            {next ? (
              <Text style={[s.muted, { marginBottom: space.sm }]}>
                {checkPassword(next)
                  .rules.filter((r) => !r.ok)
                  .map((r) => tx(r.key))
                  .join(' · ') || tx('prof.pwOk')}
              </Text>
            ) : null}
            {message ? <Text style={{ color: message.error ? t.wrong : t.correct, marginBottom: space.sm }}>{message.text}</Text> : null}
            <Button title={tx('prof.update')} small onPress={submitPassword} disabled={!current || !next} style={{ alignSelf: 'flex-start' }} />
          </Card>
        </>
      ) : null}

      <SectionTitle>{tx('hol.title')}</SectionTitle>
      <Card>
        {activeHoliday ? (
          <>
            <Text style={s.settingTitle}>{tx('hol.active', { until: activeHoliday.to ? formatDate(activeHoliday.to, lang) : tx('home.holidayOpen') })}</Text>
            <Button title={tx('hol.end')} small variant="secondary" icon="sunny-outline" onPress={endHoliday} style={{ alignSelf: 'flex-start', marginTop: space.md }} />
          </>
        ) : (
          <>
            <Text style={[s.muted, { marginBottom: space.md }]}>{tx('hol.sub')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {[
                [7, 'hol.week'],
                [14, 'hol.two'],
                [30, 'hol.month'],
                [null, 'hol.open'],
              ].map(([days, key]) => (
                <Button key={key} title={tx(key)} small variant="soft" icon="sunny" onPress={() => startHoliday(days)} />
              ))}
            </View>
          </>
        )}
      </Card>

      <SectionTitle>{tx('prof.account')}</SectionTitle>
      <Card>
        <Text style={s.settingTitle}>{tx('prof.delete')}</Text>
        <Text style={[s.muted, { marginBottom: space.md }]}>{tx('prof.deleteSub')}</Text>
        <Button title={tx('prof.delete')} variant="danger" small icon="trash-outline" onPress={() => setConfirmDelete(true)} style={{ alignSelf: 'flex-start' }} />
      </Card>

      <DeleteAccountModal visible={confirmDelete} onClose={() => setConfirmDelete(false)} />
    </Shell>
  );
}

const useStyles = makeStyles((t) => ({
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 11, gap: space.md },
  statLine: { borderBottomWidth: 1, borderBottomColor: t.border },
  statLabel: { color: t.muted, fontSize: font.body },
  statValue: { color: t.text, fontWeight: '800', fontSize: font.body, textAlign: 'right', flexShrink: 1 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.lg },
  avatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: t.gold, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#1A1033' },
  name: { fontSize: font.large, fontWeight: '900', color: t.text },
  muted: { fontSize: font.small, color: t.muted, marginTop: 3, lineHeight: 18 },
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  theme: { flexGrow: 1, flexBasis: 160, borderRadius: 16, borderWidth: 2, padding: space.md },
  swatch: { width: 26, height: 26, borderRadius: 8 },
  themeName: { fontWeight: '900', fontSize: font.medium },
  setting: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  settingTitle: { fontWeight: '800', color: t.text, fontSize: font.medium - 1 },
  input: { borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: space.md, paddingVertical: 11, marginBottom: space.sm, color: t.text, backgroundColor: t.bg },
}));
