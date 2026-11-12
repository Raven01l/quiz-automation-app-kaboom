import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import Shell from '../components/Shell';
import { Card, ProgressBar, Title } from '../components/ui';
import { badgeStatus } from '../badges';
import { font, makeStyles, space, useTheme } from '../theme';
import { formatNumber } from '../utils';

export default function BadgesScreen() {
  const { games, tx, lang } = useApp();
  const t = useTheme();
  const s = useStyles();
  const badges = badgeStatus(games);
  const earned = badges.filter((b) => b.earned).length;

  return (
    <Shell>
      <Title subtitle={tx('badges.sub', { e: earned, n: badges.length })}>{tx('badges.title')}</Title>
      <View style={s.grid}>
        {badges.map((b) => (
          <Card key={b.id} style={[s.badge, b.earned && { borderColor: t.gold }]}>
            <View style={[s.icon, b.earned ? { backgroundColor: t.gold, transform: [{ rotate: '-8deg' }] } : { backgroundColor: t.surface2 }]}>
              <Ionicons name={b.earned ? b.icon : `${b.icon}-outline`} size={28} color={b.earned ? '#1A1033' : t.muted} />
            </View>
            <Text style={[s.name, !b.earned && { color: t.muted }]}>{tx(`badge.${b.id}.name`)}</Text>
            <Text style={s.desc}>{tx(`badge.${b.id}.desc`)}</Text>
            <View style={{ width: '100%', marginTop: space.md }}>
              <ProgressBar value={b.current / b.target} color={b.earned ? t.gold : t.accent} />
              <Text style={s.progress}>{b.earned ? tx('badges.earned') : `${formatNumber(b.current, lang)} / ${formatNumber(b.target, lang)}`}</Text>
            </View>
          </Card>
        ))}
      </View>
    </Shell>
  );
}

const useStyles = makeStyles((t) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  badge: { flexGrow: 1, flexBasis: 170, alignItems: 'center' },
  icon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  name: { fontWeight: '900', color: t.text, fontSize: font.medium },
  desc: { fontSize: font.small, color: t.muted, textAlign: 'center', marginTop: 2 },
  progress: { fontSize: font.small, color: t.muted, textAlign: 'center', marginTop: 5, fontWeight: '700' },
}));
