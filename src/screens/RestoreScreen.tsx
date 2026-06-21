import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { useGameStore } from '@/store/gameStore';
import { charAvatar } from '@/utils/people';
import { story } from '@/story';
import type { Screen } from '@/navigation/types';

const CLOUD = 'Maravox Cloud';

/**
 * Contact-backup restore — the step right after line activation. The carrier's
 * cloud found the contacts tied to this account and offers to restore them.
 * Only CONTACTS come back, never conversations: the player's chip is new, so
 * the Messages app starts empty. Restoring is what populates the agenda (the
 * `startsUnlocked` characters), so people like "Mãe" show by name from the
 * first message instead of as an unknown number — and only AFTER restoring
 * does the game actually start (the first message arrives once contacts exist).
 */
export function RestoreScreen({ navigation, route }: Screen<'Restore'>) {
  const name = route.params?.name ?? '';
  const gender = route.params?.gender ?? 'm';
  const startGame = useGameStore((s) => s.startGame);
  const [restoring, setRestoring] = useState(false);

  // The backup = the contacts marked startsUnlocked in the story registry.
  const contacts = useMemo(
    () => Object.values(story.characters).filter((c) => c.startsUnlocked),
    [],
  );

  const restore = () => {
    if (restoring) return;
    setRestoring(true);
    // A beat of "restaurando…" so it reads like a real cloud sync, then the
    // line truly begins (startGame seeds the restored contacts).
    setTimeout(() => {
      startGame(name, gender);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }, 1400);
  };

  return (
    <View style={styles.bg}>
      <View style={styles.inner}>
        <View style={styles.brand}>
          <View style={styles.badge}>
            <MaterialCommunityIcons name="cloud-sync-outline" size={26} color={theme.colors.accent} />
          </View>
          <Text style={styles.cloud}>{CLOUD}</Text>
          <Text style={styles.sub}>Restauração de contatos</Text>
        </View>

        {restoring ? (
          <View style={styles.restoringWrap}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={styles.restoringText}>Restaurando contatos…</Text>
          </View>
        ) : (
          <>
            <Text style={styles.lead}>
              Encontramos um backup de contatos vinculado a esta conta.
            </Text>

            <View style={styles.noteCard}>
              <Ionicons name="information-circle-outline" size={16} color={theme.colors.textDim} />
              <Text style={styles.noteText}>
                Apenas os contatos da sua agenda serão restaurados. Suas conversas{' '}
                <Text style={styles.noteStrong}>não</Text> serão recuperadas neste aparelho.
              </Text>
            </View>

            <View style={styles.listCard}>
              <Text style={styles.listCount}>
                {contacts.length} {contacts.length === 1 ? 'contato encontrado' : 'contatos encontrados'}
              </Text>
              {contacts.slice(0, 5).map((c) => (
                <View key={c.id} style={styles.row}>
                  <Avatar initials={c.initials} color={c.avatarColor} url={charAvatar(c)} size={34} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{c.name}</Text>
                    <Text style={styles.rowRole} numberOfLines={1}>{c.role}</Text>
                  </View>
                  <Ionicons name="cloud-download-outline" size={16} color={theme.colors.textFaint} />
                </View>
              ))}
              {contacts.length > 5 ? (
                <Text style={styles.more}>e mais {contacts.length - 5}…</Text>
              ) : null}
            </View>

            <Pressable style={styles.btn} onPress={restore}>
              <Ionicons name="cloud-download" size={18} color={theme.colors.text} />
              <Text style={styles.btnText}>Restaurar contatos</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#05070A' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 26 },
  brand: { alignItems: 'center', marginBottom: 28 },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(46,125,107,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cloud: { color: theme.colors.text, fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  sub: { color: theme.colors.textDim, fontSize: 13, marginTop: 3 },

  lead: { color: theme.colors.text, fontSize: 17, fontWeight: '600', lineHeight: 24, textAlign: 'center' },

  noteCard: {
    flexDirection: 'row',
    gap: 9,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 13,
    marginTop: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  noteText: { flex: 1, color: theme.colors.textDim, fontSize: 13, lineHeight: 19 },
  noteStrong: { color: theme.colors.text, fontWeight: '800' },

  listCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    marginTop: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  listCount: {
    color: theme.colors.textFaint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 6 },
  rowName: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  rowRole: { color: theme.colors.textFaint, fontSize: 11.5, marginTop: 1 },
  more: { color: theme.colors.textFaint, fontSize: 12, marginTop: 4, marginLeft: 2 },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 26,
    backgroundColor: theme.colors.accentDim,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
  },
  btnText: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },

  restoringWrap: { alignItems: 'center', gap: 14, paddingVertical: 40 },
  restoringText: { color: theme.colors.textDim, fontSize: 15 },
});
