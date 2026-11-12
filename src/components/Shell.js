import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { font, makeStyles, space, useTheme } from '../theme';
import { maskName } from '../utils';
import { ConfirmDialog, Logo } from './ui';

export const MENU = [
  { screen: 'Home', icon: 'home' },
  { screen: 'Setup', icon: 'game-controller' },
  { screen: 'Scores', icon: 'podium' },
  { screen: 'Review', icon: 'refresh-circle' },
  { screen: 'Library', icon: 'library' },
  { screen: 'Badges', icon: 'ribbon' },
];

// Shared layout: vertical menu on the left, profile top-right, log out bottom-left
export default function Shell({ children }) {
  const { width } = useWindowDimensions();
  const wide = width >= 820;
  const [menuOpen, setMenuOpen] = useState(false);
  const s = useStyles();
  const { tx } = useApp();

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {wide ? <SideMenu /> : null}
        <View style={{ flex: 1 }}>
          <TopBar wide={wide} openMenu={() => setMenuOpen(true)} />
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <View style={s.contentInner}>{children}</View>
          </ScrollView>
        </View>
      </View>

      {!wide ? (
        <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <SafeAreaView style={s.drawer} edges={['top', 'bottom']}>
              <SideMenu close={() => setMenuOpen(false)} />
            </SafeAreaView>
            <Pressable style={s.backdrop} onPress={() => setMenuOpen(false)} accessibilityLabel={tx('menu.close')} />
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

function TopBar({ wide, openMenu }) {
  const { user, prefs, navigate, tx } = useApp();
  const t = useTheme();
  const s = useStyles();
  const name = prefs.hideName ? maskName(user.fullName) : user.fullName;
  return (
    <View style={s.top}>
      {!wide ? (
        <Pressable onPress={openMenu} style={{ padding: 4 }} accessibilityLabel={tx('menu.open')}>
          <Ionicons name="menu" size={26} color={t.text} />
        </Pressable>
      ) : null}
      {!wide ? <Logo small /> : <View />}
      <Pressable onPress={() => navigate('Profile')} style={s.profile} accessibilityLabel={tx('profile')}>
        {wide ? <Text style={s.profileName}>{name}</Text> : null}
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user.fullName[0]?.toUpperCase()}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function SideMenu({ close }) {
  const { route, navigate, logOut, tx } = useApp();
  const t = useTheme();
  const s = useStyles();
  const [confirm, setConfirm] = useState(false);
  const active = ['Game', 'Result'].includes(route.screen) ? 'Setup' : route.screen;

  return (
    <View style={[s.side, close && { flex: 1, width: '100%', borderRightWidth: 0 }]}>
      <View style={{ padding: space.lg }}>
        <Logo />
      </View>
      <View style={{ flex: 1, paddingHorizontal: space.sm }}>
        {MENU.map((m) => {
          const on = active === m.screen;
          return (
            <Pressable
              key={m.screen}
              onPress={() => {
                navigate(m.screen);
                close?.();
              }}
              style={[s.item, on && { backgroundColor: t.accentSoft }]}
            >
              <Ionicons name={on ? m.icon : `${m.icon}-outline`} size={21} color={on ? t.accentStrong : t.muted} />
              <Text style={[s.itemText, on && { color: t.text, fontWeight: '800' }]}>{tx(`menu.${m.screen}`)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={() => setConfirm(true)} style={[s.item, { margin: space.sm }]}>
        <Ionicons name="log-out-outline" size={21} color={t.wrong} />
        <Text style={[s.itemText, { color: t.wrong }]}>{tx('logOut')}</Text>
      </Pressable>
      <ConfirmDialog
        visible={confirm}
        title={tx('logout.title')}
        message={tx('logout.msg')}
        confirmText={tx('logOut')}
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          close?.();
          logOut();
        }}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.bg },
  top: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
    backgroundColor: t.bg,
  },
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  profileName: { color: t.text, fontWeight: '700', fontSize: font.body },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: t.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#1A1033', fontWeight: '900', fontSize: font.medium },
  content: { padding: space.lg, paddingBottom: space.xl * 2 },
  contentInner: { width: '100%', maxWidth: 980, alignSelf: 'center' },
  side: { width: 236, backgroundColor: t.surface, borderRightWidth: 1, borderRightColor: t.border },
  drawer: { width: 256, backgroundColor: t.surface },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  item: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 12, paddingHorizontal: space.md, borderRadius: 12, marginBottom: 2 },
  itemText: { fontSize: font.medium - 1, color: t.muted, fontWeight: '600' },
}));
