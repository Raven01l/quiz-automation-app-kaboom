import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { useApp } from '../AppContext';
import { Button, Chip } from './ui';
import { card, font, makeStyles, space, useTheme } from '../theme';

const REASONS = ['notUsing', 'fewQuestions', 'betterApp', 'privacy', 'bugs', 'other'];

// Two steps: first suggest holiday mode instead, then ask (optionally) why they're leaving.
export default function DeleteAccountModal({ visible, onClose }) {
  const { tx, user, deleteAccount, startHoliday, activeHoliday } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [step, setStep] = useState('alt');
  const [reason, setReason] = useState(null);
  const [comment, setComment] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const needsPassword = !user.isAnonymous;

  function close() {
    setStep('alt');
    setReason(null);
    setComment('');
    setPassword('');
    setError('');
    onClose();
  }

  async function confirm() {
    setError('');
    setBusy(true);
    const err = await deleteAccount({ password, reason, comment });
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={close}>
      <View style={s.backdrop}>
        <View style={s.dialog}>
          <ScrollView keyboardShouldPersistTaps="handled">
            {step === 'alt' ? (
              <>
                <Text style={s.title}>{tx('del.altTitle')}</Text>
                <Text style={s.msg}>{tx('del.altMsg')}</Text>
                {!activeHoliday ? (
                  <Button
                    title={tx('del.takeBreak')}
                    icon="sunny"
                    variant="gold"
                    onPress={() => {
                      startHoliday(14);
                      close();
                    }}
                    style={{ marginTop: space.lg }}
                  />
                ) : null}
                <View style={s.buttons}>
                  <Button title={tx('cancel')} variant="secondary" small onPress={close} style={{ flex: 1 }} />
                  <Button title={tx('del.continue')} variant="danger" small onPress={() => setStep('why')} style={{ flex: 1 }} />
                </View>
              </>
            ) : (
              <>
                <Text style={s.title}>{tx('del.whyTitle')}</Text>
                <Text style={s.msg}>{tx('del.whySub')}</Text>
                <View style={s.reasons}>
                  {REASONS.map((r) => (
                    <Chip key={r} label={tx(`del.r.${r}`)} selected={reason === r} onPress={() => setReason(reason === r ? null : r)} />
                  ))}
                </View>
                <TextInput style={[s.input, { minHeight: 70 }]} multiline value={comment} onChangeText={setComment} placeholder={tx('del.commentPh')} placeholderTextColor={t.muted} maxLength={1000} />
                {needsPassword ? (
                  <TextInput style={s.input} secureTextEntry value={password} onChangeText={setPassword} placeholder={tx('del.passwordPh')} placeholderTextColor={t.muted} />
                ) : null}
                <Text style={s.small}>{tx('prof.deleteSub')}</Text>
                {error ? <Text style={s.error}>{error}</Text> : null}
                <View style={s.buttons}>
                  <Button title={tx('cancel')} variant="secondary" small onPress={close} style={{ flex: 1 }} />
                  <Button title={tx('del.final')} variant="danger" small onPress={confirm} disabled={busy || (needsPassword && !password)} style={{ flex: 1 }} />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((t) => ({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: space.lg },
  dialog: { ...card(t), width: '100%', maxWidth: 460, maxHeight: '90%', padding: space.xl, backgroundColor: t.surface },
  title: { fontSize: font.large, fontWeight: '900', color: t.text },
  msg: { fontSize: font.body, color: t.muted, marginTop: space.sm, lineHeight: 20 },
  small: { fontSize: font.small, color: t.muted, lineHeight: 18, marginTop: space.sm },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.md },
  input: { borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: space.md, paddingVertical: 10, color: t.text, backgroundColor: t.bg, marginTop: space.sm },
  error: { color: t.wrong, fontWeight: '700', marginTop: space.md },
  buttons: { flexDirection: 'row', gap: space.sm, marginTop: space.xl },
}));
