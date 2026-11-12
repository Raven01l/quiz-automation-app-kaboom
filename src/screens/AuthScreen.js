import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { Button, Card, ConfirmDialog, Logo } from '../components/ui';
import { ANSWER_TILES, font, makeStyles, space, useTheme } from '../theme';
import { CATEGORIES } from '../config';
import { LANGS } from '../i18n';
import { checkPassword } from '../utils';

export default function AuthScreen() {
  const { logIn, signUp, demoLogIn, tx, lang, setLang, questions } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [mode, setMode] = useState('login'); // login | signup
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [consent, setConsent] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [googleOpen, setGoogleOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pw = checkPassword(password);

  async function submit() {
    setError('');
    setBusy(true);
    const err = mode === 'login' ? await logIn({ email, password }) : await signUp({ fullName, email, password, consent });
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
          <View style={s.langRow}>
            <LangSwitch lang={lang} setLang={setLang} tx={tx} />
          </View>
          <View style={{ alignItems: 'center', marginBottom: space.xl }}>
            <View style={s.tiles}>
              {ANSWER_TILES.map((tile) => (
                <View key={tile.icon} style={[s.tile, { backgroundColor: tile.color }]}>
                  <Ionicons name={tile.icon} size={18} color="#fff" />
                </View>
              ))}
            </View>
            <Logo />
            <Text style={s.tagline}>{tx('auth.tagline', { c: Object.keys(CATEGORIES).length, n: questions.length })}</Text>
          </View>

          <Card style={s.form}>
            <View style={s.tabs}>
              {[
                ['login', tx('auth.login')],
                ['signup', tx('auth.signup')],
              ].map(([k, label]) => (
                <Pressable key={k} onPress={() => { setMode(k); setError(''); }} style={[s.tab, mode === k && s.tabOn]}>
                  <Text style={[s.tabText, mode === k && { color: t.text }]}>{label}</Text>
                </Pressable>
              ))}
            </View>

            <Button title={tx('auth.google')} variant="secondary" icon="logo-google" onPress={() => setGoogleOpen(true)} />
            <View style={s.divider}>
              <View style={s.line} />
              <Text style={s.dividerText}>{tx('auth.orEmail')}</Text>
              <View style={s.line} />
            </View>

            {mode === 'signup' ? <Field label={tx('auth.fullName')} value={fullName} onChange={setFullName} placeholder={tx('auth.fullNamePh')} capitalize="words" /> : null}
            <Field label={tx('auth.email')} value={email} onChange={setEmail} placeholder={tx('auth.emailPh')} keyboard="email-address" />
            <View>
              <Field label={tx('auth.password')} value={password} onChange={setPassword} placeholder={tx('auth.passwordPh')} secure={!showPw} />
              <Pressable style={s.eye} onPress={() => setShowPw(!showPw)} accessibilityLabel={tx('auth.showPw')}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={t.muted} />
              </Pressable>
            </View>

            {mode === 'signup' ? (
              <>
                <View style={{ marginBottom: space.md }}>
                  {pw.rules.map((r) => (
                    <View key={r.key} style={s.rule}>
                      <Ionicons name={r.ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={r.ok ? t.correct : t.muted} />
                      <Text style={[s.ruleText, r.ok && { color: t.correct }]}>{tx(r.key)}</Text>
                    </View>
                  ))}
                </View>
                <Pressable style={s.consent} onPress={() => setConsent(!consent)}>
                  <Ionicons name={consent ? 'checkbox' : 'square-outline'} size={22} color={consent ? t.accentStrong : t.muted} />
                  <Text style={s.consentText}>
                    {tx('auth.consentA')}
                    <Text style={s.link} onPress={() => setPrivacyOpen(true)}>
                      {tx('auth.consentLink')}
                    </Text>
                    {tx('auth.consentB')}
                  </Text>
                </Pressable>
              </>
            ) : null}

            {error ? (
              <View style={s.error}>
                <Ionicons name="alert-circle" size={18} color={t.wrong} />
                <Text style={s.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button title={mode === 'login' ? tx('auth.login') : tx('auth.create')} onPress={submit} disabled={busy} />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={googleOpen}
        title={tx('auth.googleTitle')}
        message={tx('auth.googleMsg')}
        confirmText={tx('auth.useDemo')}
        onCancel={() => setGoogleOpen(false)}
        onConfirm={() => {
          setGoogleOpen(false);
          demoLogIn();
        }}
      />
      <ConfirmDialog
        visible={privacyOpen}
        title={tx('auth.privacyTitle')}
        message={tx('auth.privacyMsg')}
        confirmText={tx('auth.gotIt')}
        cancelText={null}
        onCancel={() => setPrivacyOpen(false)}
        onConfirm={() => {
          setPrivacyOpen(false);
          setConsent(true);
        }}
      />
    </SafeAreaView>
  );
}

export function LangSwitch({ lang, setLang, tx }) {
  const s = useStyles();
  return (
    <View style={s.langSwitch}>
      {LANGS.map((l) => (
        <Pressable key={l} onPress={() => setLang(l)} style={[s.langBtn, lang === l && s.langOn]} accessibilityLabel={tx(`lang.${l}`)}>
          <Text style={[s.langText, lang === l && s.langTextOn]}>{l.toUpperCase()}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Field({ label, value, onChange, placeholder, secure, keyboard, capitalize = 'none' }) {
  const t = useTheme();
  const s = useStyles();
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={t.muted}
        secureTextEntry={secure}
        keyboardType={keyboard}
        autoCapitalize={capitalize}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: space.lg },
  tiles: { flexDirection: 'row', gap: 6, marginBottom: space.lg },
  tile: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tagline: { color: t.muted, marginTop: space.sm, fontSize: font.body, textAlign: 'center' },
  form: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: space.xl },
  tabs: { flexDirection: 'row', backgroundColor: t.bg, borderRadius: 12, padding: 4, marginBottom: space.lg },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabOn: { backgroundColor: t.surface2 },
  tabText: { fontWeight: '800', color: t.muted },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: space.lg },
  line: { flex: 1, height: 1, backgroundColor: t.border },
  dividerText: { marginHorizontal: space.sm, color: t.muted, fontSize: font.small },
  label: { fontSize: font.small, fontWeight: '700', color: t.text, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: t.border,
    borderRadius: 12,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: font.medium - 1,
    color: t.text,
    backgroundColor: t.bg,
  },
  eye: { position: 'absolute', right: 10, top: 31, padding: 4 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  ruleText: { fontSize: font.small, color: t.muted },
  consent: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md },
  consentText: { flex: 1, fontSize: font.small, color: t.text },
  link: { color: t.accentStrong, fontWeight: '800', textDecorationLine: 'underline' },
  error: { flexDirection: 'row', gap: 6, backgroundColor: t.wrongSoft, padding: space.md, borderRadius: 12, marginBottom: space.md },
  errorText: { flex: 1, color: t.wrong, fontSize: font.small, fontWeight: '600' },
  langRow: { width: '100%', maxWidth: 420, alignSelf: 'center', alignItems: 'flex-end', marginBottom: space.md },
  langSwitch: { flexDirection: 'row', backgroundColor: t.surface2, borderRadius: 999, padding: 3, borderWidth: 1, borderColor: t.border },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  langOn: { backgroundColor: t.accent },
  langText: { fontWeight: '900', color: t.muted, fontSize: font.small },
  langTextOn: { color: '#FFFFFF' },
}));
