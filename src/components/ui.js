import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { card, font, makeStyles, space, useTheme } from '../theme';
import { useApp } from '../AppContext';

export function Logo({ small }) {
  const s = useStyles();
  const size = small ? 30 : 40;
  return (
    <View style={s.logoRow}>
      <View style={[s.logoMark, { width: size, height: size, borderRadius: size / 3, transform: [{ rotate: '-8deg' }] }]}>
        <Ionicons name="flash" size={small ? 18 : 24} color="#1A1033" />
      </View>
      <Text style={[s.logoText, small && { fontSize: 22 }]}>
        Kaboom<Text style={s.logoBang}>!</Text>
      </Text>
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', icon, disabled, small, style, big }) {
  const t = useTheme();
  const s = useStyles();
  const v = {
    primary: { bg: t.accent, border: t.accent, fg: '#FFFFFF' },
    secondary: { bg: t.surface2, border: t.border, fg: t.text },
    soft: { bg: t.accentSoft, border: 'transparent', fg: t.accentStrong },
    danger: { bg: t.wrong, border: t.wrong, fg: '#FFFFFF' },
    gold: { bg: t.gold, border: t.gold, fg: '#1A1033' },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        s.button,
        small && s.buttonSmall,
        big && s.buttonBig,
        { backgroundColor: v.bg, borderColor: v.border, borderBottomColor: 'rgba(0,0,0,0.3)' },
        pressed && { transform: [{ scale: 0.97 }] },
        disabled && { opacity: 0.45 },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={small ? 16 : big ? 22 : 18} color={v.fg} style={{ marginRight: 6 }} /> : null}
      <Text style={[s.buttonText, small && { fontSize: font.body }, big && { fontSize: font.large }, { color: v.fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }) {
  const s = useStyles();
  return <View style={[s.card, style]}>{children}</View>;
}

export function Title({ children, subtitle }) {
  const s = useStyles();
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={s.title}>{children}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children, right }) {
  const s = useStyles();
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function ProgressBar({ value, color, height = 10 }) {
  const t = useTheme();
  const pct = Math.max(0, Math.min(1, value || 0)) * 100;
  return (
    <View style={{ height, borderRadius: height, backgroundColor: t.surface2, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: height, backgroundColor: color || t.accent }} />
    </View>
  );
}

export function Chip({ label, selected, onPress, icon, color }) {
  const t = useTheme();
  const s = useStyles();
  const active = color || t.accent;
  return (
    <Pressable onPress={onPress} style={[s.chip, selected && { backgroundColor: active, borderColor: active }]}>
      {icon ? <Ionicons name={icon} size={15} color={selected ? '#fff' : t.muted} style={{ marginRight: 5 }} /> : null}
      <Text style={[s.chipText, selected && { color: '#FFFFFF' }]}>{label}</Text>
    </Pressable>
  );
}

// Alert.alert doesn't support buttons on web, so we use our own dialog
export function ConfirmDialog({ visible, title, message, confirmText, cancelText, danger, onConfirm, onCancel }) {
  const s = useStyles();
  const { tx } = useApp();
  if (confirmText === undefined) confirmText = tx('yes');
  if (cancelText === undefined) cancelText = tx('cancel');
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={s.backdrop}>
        <View style={s.dialog}>
          <Text style={s.dialogTitle}>{title}</Text>
          {message ? <Text style={s.dialogMessage}>{message}</Text> : null}
          <View style={s.dialogButtons}>
            {cancelText ? <Button title={cancelText} variant="secondary" onPress={onCancel} small style={{ flex: 1 }} /> : null}
            <Button title={confirmText} variant={danger ? 'danger' : 'primary'} onPress={onConfirm} small style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function Pagination({ page, total, pageSize, onChange }) {
  const t = useTheme();
  const { tx } = useApp();
  const s = useStyles();
  if (!total) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <View style={s.pagination}>
      <Pressable disabled={page <= 1} onPress={() => onChange(page - 1)} style={[s.pageButton, page <= 1 && { opacity: 0.35 }]} accessibilityLabel={tx('prevPage')}>
        <Ionicons name="chevron-back" size={18} color={t.text} />
      </Pressable>
      <Text style={s.pageText}>
        {tx('pageOf', { from, to, total })}
      </Text>
      <Pressable disabled={page >= pages} onPress={() => onChange(page + 1)} style={[s.pageButton, page >= pages && { opacity: 0.35 }]} accessibilityLabel={tx('nextPage')}>
        <Ionicons name="chevron-forward" size={18} color={t.text} />
      </Pressable>
    </View>
  );
}

export function EmptyState({ icon = 'sparkles', title, message, children }) {
  const t = useTheme();
  const s = useStyles();
  return (
    <Card style={{ alignItems: 'center', paddingVertical: space.xl * 1.5 }}>
      <Ionicons name={icon} size={44} color={t.accentStrong} />
      <Text style={[s.sectionTitle, { marginTop: space.md, textAlign: 'center' }]}>{title}</Text>
      {message ? <Text style={[s.subtitle, { textAlign: 'center' }]}>{message}</Text> : null}
      {children ? <View style={{ marginTop: space.lg }}>{children}</View> : null}
    </Card>
  );
}

export function StatTile({ value, label, icon, color }) {
  const t = useTheme();
  const s = useStyles();
  const c = color || t.accentStrong;
  return (
    <Card style={s.stat}>
      <View style={[s.statIcon, { backgroundColor: c + '26' }]}>
        <Ionicons name={icon} size={20} color={c} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </Card>
  );
}

const useStyles = makeStyles((t) => ({
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoMark: { backgroundColor: t.gold, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  logoText: { fontSize: 28, fontWeight: '900', color: t.text, letterSpacing: -0.5 },
  logoBang: { color: t.gold },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: space.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderBottomWidth: 4,
  },
  buttonSmall: { paddingVertical: 8, paddingHorizontal: space.md, borderRadius: 12, borderBottomWidth: 3 },
  buttonBig: { paddingVertical: 18, borderRadius: 18 },
  buttonText: { fontSize: font.medium, fontWeight: '800' },
  card: card(t),
  title: { fontSize: font.title, fontWeight: '900', color: t.text },
  subtitle: { fontSize: font.body, color: t.muted, marginTop: 4, lineHeight: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.sm },
  sectionTitle: { fontSize: font.medium + 1, fontWeight: '800', color: t.text },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: t.border,
    backgroundColor: t.surface,
    marginRight: space.sm,
    marginBottom: space.sm,
  },
  chipText: { fontSize: font.body, color: t.text, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: space.xl },
  dialog: { ...card(t), width: '100%', maxWidth: 400, padding: space.xl, backgroundColor: t.surface2 },
  dialogTitle: { fontSize: font.large, fontWeight: '900', color: t.text },
  dialogMessage: { fontSize: font.body, color: t.muted, marginTop: space.sm, lineHeight: 20 },
  dialogButtons: { flexDirection: 'row', gap: space.sm, marginTop: space.xl },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: space.lg, gap: space.md },
  pageButton: { padding: 8, borderRadius: 10, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface },
  pageText: { fontSize: font.body, color: t.text, fontWeight: '700', minWidth: 90, textAlign: 'center' },
  stat: { flex: 1, minWidth: 140, padding: space.md },
  statIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: font.large + 2, fontWeight: '900', color: t.text, marginTop: space.sm },
  statLabel: { fontSize: font.small, color: t.muted, marginTop: 2 },
}));
