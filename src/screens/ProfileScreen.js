import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import Shell from '../components/Shell';
import { Button, Card, ConfirmDialog, SectionTitle, Title } from '../components/ui';
import { THEMES, font, makeStyles, space, useTheme } from '../theme';
import { checkPassword, formatDate, formatNumber, levelInfo, maskName } from '../utils';
import { LangSwitch } from './AuthScreen';

export default function ProfileScreen() {
  const { user, prefs, updatePrefs, changePassword, deleteAccount, games, totalPoints, tx, lang, setLang } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [message, setMessage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const demo = user.provider === 'google-demo';

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
          <Text style={s.muted}>{user.email}</Text>
          <Text style={s.muted}>
            {tx('prof.meta', { d: formatDate(user.createdAt, lang), l: levelInfo(totalPoints).level, g: games.length === 1 ? tx('gamesOne') : tx('gamesN', { n: games.length }), p: formatNumber(totalPoints, lang) })}
          </Text>
        </View>
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

      <SectionTitle>{tx('prof.account')}</SectionTitle>
      <Card>
        <Text style={s.settingTitle}>{tx('prof.delete')}</Text>
        <Text style={[s.muted, { marginBottom: space.md }]}>{tx('prof.deleteSub')}</Text>
        <Button title={tx('prof.delete')} variant="danger" small icon="trash-outline" onPress={() => setConfirmDelete(true)} style={{ alignSelf: 'flex-start' }} />
      </Card>

      <ConfirmDialog
        visible={confirmDelete}
        title={tx('prof.deleteTitle')}
        message={tx('prof.deleteMsg')}
        confirmText={tx('prof.deleteBtn')}
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteAccount();
        }}
      />
    </Shell>
  );
}

const useStyles = makeStyles((t) => ({
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
