import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Avatar } from '@/components/Avatar';
import { useGameStore } from '@/store/gameStore';
import { fakePhone } from '@/utils/people';
import type { Screen } from '@/navigation/types';

/** Initials for the faceless protagonist's avatar (never a face). */
function playerInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '?';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

/** The player's own messenger profile — name, status and number. */
export function ProfileScreen({ navigation }: Screen<'Profile'>) {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  return (
    <View style={styles.bg}>
      <ScreenHeader title="Perfil"
        icon="person-circle"
        tint="#2E6B62" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Avatar
            initials={playerInitials(state.playerName)}
            color={theme.colors.accentDim}
            size={96}
          />
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color="#E7ECF3" />
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="person-outline" size={19} color={theme.colors.textDim} style={styles.rowIcon} />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>Nome</Text>
            <Text style={styles.rowValue}>{state.playerName}</Text>
            <Text style={styles.rowNote}>
              Este é o nome que seus contatos veem. É como as pessoas deste caso te conhecem.
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Ionicons name="information-circle-outline" size={19} color={theme.colors.textDim} style={styles.rowIcon} />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>Recado</Text>
            <Text style={styles.rowValue}>Disponível</Text>
          </View>
        </View>

        <View style={[styles.row, styles.rowLast]}>
          <Ionicons name="call-outline" size={19} color={theme.colors.textDim} style={styles.rowIcon} />
          <View style={styles.rowBody}>
            <Text style={styles.rowLabel}>Número</Text>
            <Text style={styles.rowValue}>{fakePhone('player')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  content: { paddingVertical: 26 },
  head: { alignItems: 'center', marginBottom: 26 },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    marginLeft: 64,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.bg,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { marginTop: 3, marginRight: 16 },
  rowBody: { flex: 1 },
  rowLabel: { color: theme.colors.textDim, fontSize: 12.5 },
  rowValue: { color: theme.colors.text, fontSize: 16, marginTop: 3 },
  rowNote: { color: theme.colors.textFaint, fontSize: 12.5, lineHeight: 17, marginTop: 6 },
});
